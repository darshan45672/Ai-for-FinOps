import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from '../ollama/ollama.service';
import { McpToolsService, MCPToolResult } from '../mcp/mcp-tools.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatResponse {
  message: string;
  toolsUsed?: string[];
  conversationHistory: ChatMessage[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly mcpToolsService: McpToolsService,
  ) {}

  /**
   * Process a chat message with MCP tools integration
   */
  async processMessage(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
  ): Promise<ChatResponse> {
    this.logger.log(`Processing chat message: ${userMessage.substring(0, 50)}...`);

    // Build the conversation with system prompt
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Get available tools
    const tools = this.mcpToolsService.getAvailableTools();
    const toolsUsed: string[] = [];

    // Initial AI response with tool calling capability
    let aiResponse = await this.callOllamaWithTools(messages, tools);
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops

    // Handle tool calls in a loop
    while (aiResponse.toolCalls && aiResponse.toolCalls.length > 0 && iterations < maxIterations) {
      iterations++;
      this.logger.log(`Tool call iteration ${iterations}`);

      // Execute all tool calls
      const toolResults = await Promise.all(
        aiResponse.toolCalls.map(async (toolCall) => {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          this.logger.log(`Executing tool: ${toolName}`);
          toolsUsed.push(toolName);

          const result = await this.mcpToolsService.executeTool(toolName, toolArgs);
          
          return {
            toolCallId: toolCall.id,
            toolName,
            result,
          };
        }),
      );

      // Add assistant message with tool calls
      messages.push({
        role: 'assistant',
        content: aiResponse.content || '',
        toolCalls: aiResponse.toolCalls,
      });

      // Add tool results
      for (const toolResult of toolResults) {
        messages.push({
          role: 'tool',
          content: toolResult.result.content[0].text,
          toolCallId: toolResult.toolCallId,
          name: toolResult.toolName,
        });
      }

      // Get next AI response with tool results
      aiResponse = await this.callOllamaWithTools(messages, tools);
    }

    // Add final assistant message
    messages.push({
      role: 'assistant',
      content: aiResponse.content || aiResponse.message || '',
    });

    return {
      message: aiResponse.content || aiResponse.message || '',
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
      conversationHistory: messages.slice(1), // Exclude system prompt
    };
  }

  /**
   * Call Ollama with tools support
   */
  private async callOllamaWithTools(messages: ChatMessage[], tools: any[]): Promise<any> {
    try {
      // Get the model name - use a tool-capable model
      const model = this.ollamaService.getDefaultModel();
      
      this.logger.debug(`Calling Ollama with ${tools.length} tools available`);
      this.logger.debug(`Using model: ${model}`);

      // Convert messages to Ollama format
      const ollamaMessages = messages.map((msg) => ({
        role: msg.role === 'tool' ? 'system' : msg.role,
        content: msg.content,
      }));

      // Format tools for Ollama - ensure proper structure matching Ollama API docs
      const formattedTools = tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties: tool.inputSchema.properties || {},
            required: tool.inputSchema.required || [],
          },
        },
      }));

      this.logger.debug(`Formatted ${formattedTools.length} tools for Ollama`);
      this.logger.debug(`Tools: ${JSON.stringify(formattedTools, null, 2)}`);

      // Call Ollama chat API with tools
      const response = await this.ollamaService.chat({
        model: model,
        messages: ollamaMessages,
        tools: formattedTools,
        stream: false, // Disable streaming to get complete response
        options: {
          temperature: 0.7,
          num_predict: 2000,
          // Enable tool usage
          num_ctx: 4096, // Increase context window for tool calls
        },
      });

      // Log response structure for debugging
      this.logger.debug(`Ollama response: ${JSON.stringify({
        hasMessage: !!response.message,
        hasToolCalls: !!response.message?.tool_calls,
        toolCallsCount: response.message?.tool_calls?.length || 0,
        contentPreview: response.message?.content?.substring(0, 100)
      })}`);

      // Check if AI wants to call tools
      if (response.message && response.message.tool_calls && response.message.tool_calls.length > 0) {
        this.logger.log(`AI requested ${response.message.tool_calls.length} tool calls`);
        
        return {
          content: response.message.content || '',
          toolCalls: response.message.tool_calls.map((tc: any, index: number) => ({
            id: `call_${Date.now()}_${index}`,
            type: 'function',
            function: {
              name: tc.function.name,
              arguments: typeof tc.function.arguments === 'string' 
                ? tc.function.arguments 
                : JSON.stringify(tc.function.arguments),
            },
          })),
        };
      }

      // Extract content from response
      const content = response.message?.content || (response as any).content || (response as any).response || '';
      
      if (!content) {
        this.logger.warn('Empty response from Ollama, full response:', JSON.stringify(response));
      }

      return {
        content,
        message: content,
      };
    } catch (error) {
      this.logger.error('Error calling Ollama with tools:', error.message);
      this.logger.error('Stack:', error.stack);
      
      // Fallback to simple chat without tools
      const ollamaMessages = messages.map((msg) => ({
        role: msg.role === 'tool' ? 'system' : msg.role,
        content: msg.content,
      }));

      try {
        const response = await this.ollamaService.chat({
          model: this.ollamaService.getDefaultModel(),
          messages: ollamaMessages,
          stream: false,
          options: {
            temperature: 0.7,
          },
        });

        return {
          content: response.message?.content || '',
          message: response.message?.content || '',
        };
      } catch (fallbackError) {
        this.logger.error('Fallback chat also failed:', fallbackError.message);
        throw fallbackError;
      }
    }
  }

  /**
   * Get system prompt for the AI assistant
   */
  private getSystemPrompt(): string {
    return `You are an intelligent FinOps assistant specialized EXCLUSIVELY in Microsoft Azure cloud services, resource management, and cost optimization.

CRITICAL RESTRICTIONS:
- You ONLY answer questions about Microsoft Azure Cloud services, resources, costs, and FinOps practices
- You MUST REFUSE to answer questions about:
  * Non-Azure cloud providers (AWS, GCP, etc.)
  * General programming or technology topics not related to Azure
  * Personal advice, creative writing, or general knowledge questions
  * Any topic outside of Azure cloud computing and FinOps

Your Azure-specific capabilities include:
- Analyzing Azure resource utilization and costs
- Providing insights on Azure cloud spending trends
- Identifying Azure cost optimization opportunities
- Monitoring Azure resource status and performance
- Analyzing Azure activity logs for security and compliance
- Explaining Azure services, pricing models, and best practices

IMPORTANT - TOOL USAGE:
You have access to powerful Azure tools that fetch real-time data from the database. 
Azure data is automatically synced every hour by schedulers, so you DON'T need to ask users for subscription IDs.

Available Tools:
1. get_azure_resources - Query Azure resources (NO subscription ID needed)
   - Filters: type, location, resourceGroup, status
2. get_resource_costs - Get cost data (NO subscription ID needed)
   - Required: startDate, endDate
   - Optional: resourceGroup, resourceId
3. get_resource_groups_count - Get total count of resource groups
4. get_azure_summary - Get comprehensive Azure resources overview

Tool Usage Guidelines:
- ALWAYS use tools when users ask for data about Azure resources or costs
- DO NOT ask users for subscription IDs - data is already in the database
- When asked about costs, use get_resource_costs with appropriate date ranges
- When asked about resources, use get_azure_resources with relevant filters
- When asked "how many resource groups", use get_resource_groups_count
- For overview/summary questions, use get_azure_summary
- DO NOT make up or estimate data - always fetch real data using tools
- For date ranges, use ISO format (YYYY-MM-DD)

Examples of when to use tools:
- "show me my Azure costs" → use get_resource_costs (last 30 days)
- "what are my Azure resources" → use get_azure_resources
- "cost utilization for last 30 days" → use get_resource_costs with date range
- "list my virtual machines" → use get_azure_resources with type filter
- "how many resource groups do I have" → use get_resource_groups_count
- "give me an overview" → use get_azure_summary

Response Guidelines:
- Use tools FIRST to get data, then format the response
- Provide specific numbers and facts from tool results
- Offer actionable Azure cost optimization insights
- Format responses clearly with bullet points and tables
- Include currency and time periods for cost data
- If tool execution fails, explain the error and try alternative approaches

If a user asks about non-Azure topics:
- Politely decline: "I'm specialized in Microsoft Azure Cloud services only. I can help you with Azure resources, costs, FinOps practices, and cloud optimization strategies. Please ask me about Azure-related topics."
- Redirect: "Would you like to know about Azure services, resource management, or cost optimization instead?"

Remember: ALWAYS use tools to fetch real Azure data. Never provide made-up information.`;
  }
}
