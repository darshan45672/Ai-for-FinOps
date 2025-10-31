import { Injectable, Logger } from '@nestjs/common';
import { AzureFoundryService } from '../azure-foundry/azure-foundry.service';
import { McpToolsService } from '../mcp/mcp-tools.service';
import { isOutputOfType } from '@azure/ai-agents';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class ChatFoundryService {
  private readonly logger = new Logger(ChatFoundryService.name);

  constructor(
    private readonly azureFoundryService: AzureFoundryService,
    private readonly mcpToolsService: McpToolsService,
  ) {}

  /**
   * Process a chat message using Azure AI Foundry agents
   */
  async processMessage(
    message: string,
    conversationHistory: ChatMessage[],
  ): Promise<string> {
    try {
      const client = this.azureFoundryService.getClient();
      const modelDeployment = this.azureFoundryService.getModelDeploymentName();
      
      // Get function tools in Azure AI Foundry format
      const functionTools = this.mcpToolsService.getAzureFoundryFunctionTools();
      
      this.logger.log(`Processing message with ${functionTools.length} function tools`);

      // Create agent with function tools
      const agent = await this.azureFoundryService.getOrCreateAgent(
        functionTools,
        this.getSystemPrompt(),
        'azure-finops-assistant',
      );

      this.logger.log(`Created agent: ${agent.id}`);

      // Create thread for conversation
      const thread = await client.threads.create();
      
      this.logger.log(`Created thread: ${thread.id}`);

      // Add conversation history to thread (if any)
      for (const msg of conversationHistory.slice(-5)) { // Keep last 5 messages for context
        if (msg.role !== 'system') {
          await client.messages.create(
            thread.id,
            msg.role,
            msg.content,
          );
        }
      }

      // Add user message
      await client.messages.create(thread.id, 'user', message);

      // Create and execute run
      let run = await client.runs.create(thread.id, agent.id);
      
      this.logger.log(`Created run: ${run.id}, status: ${run.status}`);

      // Poll run status and handle tool calls
      let iterations = 0;
      const maxIterations = 10; // Prevent infinite loops

      while (['queued', 'in_progress', 'requires_action'].includes(run.status) && iterations < maxIterations) {
        await this.sleep(1000);
        run = await client.runs.get(thread.id, run.id);
        
        this.logger.log(`Run status: ${run.status}`);

        if (run.status === 'requires_action' && run.requiredAction) {
          iterations++;
          this.logger.log(`Run iteration ${iterations}, handling required action`);

          // Check if it's submit_tool_outputs action using isOutputOfType
          if (isOutputOfType(run.requiredAction, 'submit_tool_outputs')) {
            const submitToolOutputsAction: any = run.requiredAction;
            const toolCalls = submitToolOutputsAction.submitToolOutputs.toolCalls;
            
            if (!toolCalls || toolCalls.length === 0) {
              this.logger.warn('requires_action status but no tool calls found');
              break;
            }

            this.logger.log(`Executing ${toolCalls.length} tool calls`);

            // Execute all tool calls
            const toolResponses: any[] = [];
            for (const toolCall of toolCalls) {
              if (isOutputOfType(toolCall, 'function')) {
                const functionName = (toolCall as any).function.name;
                const functionArgs = JSON.parse((toolCall as any).function.arguments || '{}');

                this.logger.log(`Executing tool: ${functionName} with args: ${JSON.stringify(functionArgs)}`);

                try {
                  const result = await this.mcpToolsService.executeTool(
                    functionName,
                    functionArgs,
                  );

                  this.logger.log(`Tool ${functionName} executed successfully`);

                  toolResponses.push({
                    toolCallId: (toolCall as any).id,
                    output: result,
                  });
                } catch (error) {
                  this.logger.error(`Error executing tool ${functionName}:`, error);
                  toolResponses.push({
                    toolCallId: (toolCall as any).id,
                    output: `Error: ${error.message}`,
                  });
                }
              }
            }

            if (toolResponses.length > 0) {
              // Submit tool outputs
              run = await client.runs.submitToolOutputs(
                thread.id,
                run.id,
                toolResponses,
              );

              this.logger.log(`Submitted tool outputs, new status: ${run.status}`);
            }
          }
        }
      }

      if (iterations >= maxIterations) {
        this.logger.warn('Reached maximum iterations for tool calls');
      }

      // Check final status
      if (run.status === 'failed') {
        throw new Error(`Run failed: ${run.lastError?.message || 'Unknown error'}`);
      }

      if (run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Run ${run.status}`);
      }

      // Get messages from thread
      const messagesIterator = client.messages.list(thread.id);
      const messagesArray: any[] = [];
      
      for await (const message of messagesIterator) {
        messagesArray.push(message);
      }
      
      // Find the latest assistant message
      const assistantMessage = messagesArray
        .filter((msg: any) => msg.role === 'assistant')
        .sort((a: any, b: any) => b.createdAt - a.createdAt)[0];

      if (!assistantMessage) {
        throw new Error('No assistant response found');
      }

      // Extract text content
      const textContent = assistantMessage.content
        .filter((content: any) => content.type === 'text')
        .map((content: any) => content.text.value)
        .join('\n');

      this.logger.log('Successfully processed message with Azure AI Foundry');

      // Clean up (optional - may want to keep threads for conversation continuity)
      // await client.threads.del(thread.id);
      // await client.agents.delete(agent.id);

      return textContent;
    } catch (error) {
      this.logger.error('Error processing message with Azure AI Foundry:', error);
      throw error;
    }
  }

  /**
   * Get system prompt for Azure FinOps assistant
   */
  private getSystemPrompt(): string {
    return `You are an Azure FinOps AI Assistant with access to real-time Azure resource and cost data.

IMPORTANT RULES:
1. You can ONLY answer questions about Azure cloud services, resources, and costs
2. For any non-Azure questions, politely decline and redirect to Azure topics
3. Use the provided function tools to fetch actual data from the database
4. Always provide specific, data-driven answers using the tools
5. Format responses in clear, structured markdown
6. When showing costs, always include currency and time period
7. When listing resources, organize by relevant categories (type, location, resource group)

AVAILABLE DATA:
- Azure resources across all subscriptions
- Cost and billing data
- Resource groups and their contents
- Resource statistics and summaries

USER CONTEXT:
- The user has automated schedulers that sync Azure data hourly
- All data is stored in a PostgreSQL database
- You can query this data without needing subscription IDs

RESPONSE STYLE:
- Be concise but comprehensive
- Use bullet points and tables for clarity
- Highlight important metrics (costs, counts, trends)
- Provide actionable insights when relevant`;
  }

  /**
   * Helper to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
