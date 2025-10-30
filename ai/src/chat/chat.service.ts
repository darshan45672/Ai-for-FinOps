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
      // Convert messages to Ollama format
      const ollamaMessages = messages.map((msg) => ({
        role: msg.role === 'tool' ? 'system' : msg.role,
        content: msg.content,
      }));

      // Format tools for Ollama
      const formattedTools = tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));

      // Call Ollama chat API with tools
      const response = await this.ollamaService.chat({
        model: this.ollamaService.getDefaultModel(),
        messages: ollamaMessages,
        tools: formattedTools,
        stream: false, // Disable streaming to get complete response
        options: {
          temperature: 0.7,
          num_predict: 2000,
        },
      });

      // Log response for debugging
      this.logger.debug(`Ollama response structure: ${JSON.stringify({ 
        hasMessage: !!response.message,
        hasContent: !!response.message?.content,
        content: response.message?.content?.substring(0, 100) 
      })}`);

      // Check if AI wants to call tools
      if (response.message && response.message.tool_calls) {
        return {
          content: response.message.content || '',
          toolCalls: response.message.tool_calls.map((tc: any, index: number) => ({
            id: `call_${Date.now()}_${index}`,
            type: 'function',
            function: {
              name: tc.function.name,
              arguments: JSON.stringify(tc.function.arguments),
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
      this.logger.error('Error calling Ollama:', error);
      
      // Fallback to simple chat without tools
      const ollamaMessages = messages.map((msg) => ({
        role: msg.role === 'tool' ? 'system' : msg.role,
        content: msg.content,
      }));

      const response = await this.ollamaService.chat({
        model: this.ollamaService.getDefaultModel(),
        messages: ollamaMessages,
        stream: false, // Disable streaming to get complete response
        options: {
          temperature: 0.7,
        },
      });

      return {
        content: response.message?.content || '',
        message: response.message?.content || '',
      };
    }
  }

  /**
   * Get system prompt for the AI assistant
   */
  private getSystemPrompt(): string {
    return `You are an intelligent FinOps assistant specialized in Azure cloud resource management and cost optimization.

Your capabilities include:
- Analyzing Azure resource utilization and costs
- Providing insights on cloud spending trends
- Identifying cost optimization opportunities
- Monitoring resource status and performance
- Analyzing activity logs for security and compliance

You have access to the following tools:
1. get_azure_resources - Query Azure resources with filters
2. get_resource_costs - Get cost data for specific resources or time periods
3. get_cost_summary - Get aggregated cost summaries
4. get_activity_logs - Query Azure activity logs
5. get_resource_utilization - Get resource utilization metrics
6. analyze_cost_trends - Analyze cost trends and anomalies
7. get_subscription_info - Get Azure subscription details

When answering questions:
- Use the appropriate tools to fetch real-time data
- Provide specific numbers and facts from the data
- Offer actionable insights and recommendations
- Format your responses clearly with bullet points when listing items
- If asked about costs, include currency and time periods
- If data is not available, explain what information is missing

Be concise but informative. Always base your answers on the actual data retrieved from the tools.`;
  }
}
