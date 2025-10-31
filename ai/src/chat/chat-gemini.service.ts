import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { McpToolsService } from '../mcp/mcp-tools.service';
import { ContextService } from '../context/context.service';
import { AzureMcpGatewayService } from '../mcp/azure-mcp-gateway.service';
import { FunctionCallingConfigMode } from '@google/genai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ChatGeminiService {
  private readonly logger = new Logger(ChatGeminiService.name);
  private readonly MAX_ITERATIONS = 10; // Prevent infinite loops

  constructor(
    private readonly geminiService: GeminiService,
    private readonly mcpToolsService: McpToolsService,
    private readonly contextService: ContextService,
    private readonly azureMcpGateway: AzureMcpGatewayService,
  ) {}

  /**
   * Build dynamic system instructions based on rich context
   */
  private buildSystemInstruction(richContext: any): string {
    const sections: string[] = [];

    // Base instruction
    sections.push(`You are an expert Azure FinOps AI assistant specializing in cloud cost optimization and financial operations.`);
    sections.push(`Your role is to help users understand, analyze, and optimize their Azure cloud costs.`);
    sections.push(``);

    // User context
    if (richContext.user) {
      sections.push(`**User Profile:**`);
      sections.push(`- Name: ${richContext.user.name || 'Unknown'}`);
      sections.push(`- Email: ${richContext.user.email || 'Unknown'}`);
      if (richContext.user.preferences) {
        sections.push(`- Preferred Azure Subscription: ${richContext.user.preferences.defaultSubscriptionId || 'Not set'}`);
        sections.push(`- Preferred Region: ${richContext.user.preferences.defaultRegion || 'Not set'}`);
        sections.push(`- Cost Alert Threshold: $${richContext.user.preferences.costAlertThreshold || 'Not set'}`);
      }
      sections.push(``);
    }

    // Azure context
    if (richContext.azure) {
      sections.push(`**Current Azure State:**`);
      if (richContext.azure.currentCosts) {
        sections.push(`- Current Month Cost: $${richContext.azure.currentCosts.toFixed(2)}`);
      }
      if (richContext.azure.resourceCount) {
        sections.push(`- Total Resources: ${richContext.azure.resourceCount}`);
      }
      if (richContext.azure.activeAlerts && richContext.azure.activeAlerts.length > 0) {
        sections.push(`- Active Alerts: ${richContext.azure.activeAlerts.length}`);
        richContext.azure.activeAlerts.slice(0, 3).forEach((alert: any) => {
          sections.push(`  - ${alert.type}: ${alert.message}`);
        });
      }
      sections.push(``);
    }

    // Conversation context
    if (richContext.conversation) {
      sections.push(`**Conversation Context:**`);
      if (richContext.conversation.recentTopics && richContext.conversation.recentTopics.length > 0) {
        sections.push(`- Recent Topics: ${richContext.conversation.recentTopics.join(', ')}`);
      }
      if (richContext.conversation.entitiesDiscussed && richContext.conversation.entitiesDiscussed.length > 0) {
        sections.push(`- Key Entities: ${richContext.conversation.entitiesDiscussed.join(', ')}`);
      }
      sections.push(``);
    }

    // Historical insights
    if (richContext.historical) {
      sections.push(`**Historical Insights:**`);
      if (richContext.historical.costTrend) {
        sections.push(`- Cost Trend: ${richContext.historical.costTrend}`);
      }
      if (richContext.historical.topRecommendations && richContext.historical.topRecommendations.length > 0) {
        sections.push(`- Past Recommendations:`);
        richContext.historical.topRecommendations.slice(0, 3).forEach((rec: any) => {
          sections.push(`  - ${rec.type}: ${rec.description} (Potential savings: $${rec.estimatedSavings || 0})`);
        });
      }
      sections.push(``);
    }

    // Documentation context (Context7)
    if (richContext.documentation) {
      sections.push(`**Relevant Documentation:**`);
      if (richContext.documentation.bestPractices && richContext.documentation.bestPractices.length > 0) {
        sections.push(`- Best Practices:`);
        richContext.documentation.bestPractices.slice(0, 3).forEach((practice: string) => {
          sections.push(`  - ${practice}`);
        });
      }
      if (richContext.documentation.codeExamples && richContext.documentation.codeExamples.length > 0) {
        sections.push(`- Relevant Code Examples Available: ${richContext.documentation.codeExamples.length}`);
      }
      sections.push(``);
    }

    // Tool context
    if (richContext.tools) {
      sections.push(`**Available Tools:**`);
      sections.push(`You have access to ${richContext.tools.customTools || 0} custom FinOps tools and ${richContext.tools.azureMcpTools || 0} Azure MCP tools.`);
      sections.push(`Use these tools to:`);
      sections.push(`- Analyze Azure costs and generate reports`);
      sections.push(`- Query Azure resources and configurations`);
      sections.push(`- Manage Azure databases, caches, and storage`);
      sections.push(`- Access Azure monitoring and diagnostic data`);
      sections.push(`- Retrieve configuration and secrets`);
      sections.push(``);
    }

    // Guidelines
    sections.push(`**Guidelines:**`);
    sections.push(`1. Use available tools to fetch real-time data before making recommendations`);
    sections.push(`2. Consider the user's preferences and historical context in your analysis`);
    sections.push(`3. Provide specific, actionable recommendations with estimated cost savings`);
    sections.push(`4. Reference Azure best practices and documentation when relevant`);
    sections.push(`5. If you don't have enough information, ask clarifying questions or use tools to gather data`);
    sections.push(`6. Always explain your reasoning and show calculations for cost optimization suggestions`);
    sections.push(`7. Be proactive in identifying potential cost savings and inefficiencies`);
    sections.push(``);

    // Context7 MCP Tools - Azure Documentation Access
    sections.push(`**Azure Documentation Access (Context7 MCP):**`);
    sections.push(`You have access to comprehensive Azure documentation through Context7 MCP tools:`);
    sections.push(``);
    sections.push(`**When to use Context7:**`);
    sections.push(`- User asks for Azure best practices or "how to" guidance`);
    sections.push(`- User needs code examples (CLI, PowerShell, Terraform, ARM templates)`);
    sections.push(`- User asks about Azure cost optimization strategies`);
    sections.push(`- User needs detailed Azure feature documentation`);
    sections.push(``);
    sections.push(`**Available MCP Tools:**`);
    sections.push(`1. mcp_context7_resolve-library-id({ libraryName: "azure" })`);
    sections.push(`   - Finds the correct Azure documentation library`);
    sections.push(``);
    sections.push(`2. mcp_context7_get-library-docs({`);
    sections.push(`     context7CompatibleLibraryID: "/microsoftdocs/azure-docs",`);
    sections.push(`     topic: "your specific topic",`);
    sections.push(`     tokens: 5000`);
    sections.push(`   })`);
    sections.push(`   - Fetches comprehensive Azure documentation with 61,000+ code examples`);
    sections.push(`   - Covers: Azure CLI, PowerShell, Terraform, ARM templates, and SDKs`);
    sections.push(``);
    sections.push(`**Recommended workflow:**`);
    sections.push(`1. Fetch user's current Azure data (use Azure MCP tools like get_current_costs, get_resource_groups_count)`);
    sections.push(`2. If guidance needed, fetch relevant documentation (use Context7 MCP tools)`);
    sections.push(`3. Combine real data + documentation to provide actionable, documented recommendations`);
    sections.push(``);
    sections.push(`**Example:** For cost optimization queries:`);
    sections.push(`- Step 1: Use get_current_costs to see actual spending`);
    sections.push(`- Step 2: Use mcp_context7_get-library-docs with topic "Azure cost optimization resource rightsizing"`);
    sections.push(`- Step 3: Apply best practices from docs to user's specific resources`);

    return sections.join('\n');
  }

  /**
   * Send a message and get a response from Gemini with function calling support
   * Now includes rich context engineering and Context7 RAG
   * Returns both the response and the rich context used
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    message: string,
    conversationHistory: Message[] = [],
  ): Promise<{ response: string; richContext?: any }> {
    try {
      this.logger.log(`Processing message from user: ${userId || 'anonymous'}`);
      this.logger.debug(`Message: ${message.substring(0, 100)}...`);

      // Step 1: Build rich context using ContextService
      let richContext;
      if (userId && conversationId) {
        this.logger.log('Building rich context with user preferences, Azure data, and documentation...');
        richContext = await this.contextService.buildContext(
          userId,
          conversationId,
          message,
          {
            includeHistory: true,
            includeDocumentation: true,
            includeTools: true,
            historyLimit: 20,
            documentationTokens: 3000,
          }
        );
        this.logger.log(`Context built: ${richContext.tools.available.length} tools available`);
      }

      const client = this.geminiService.getClient();
      const model = this.geminiService.getModel();

      // Step 2: Get available tools from both custom MCP tools and Azure MCP Gateway
      const customTools = this.mcpToolsService.getGeminiFunctionDeclarations();
      const azureTools = await this.azureMcpGateway.discoverAllTools();
      
      // Combine all tool declarations
      const allFunctionDeclarations = [
        ...customTools,
        ...azureTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        })),
      ];
      
      this.logger.log(`Loaded ${allFunctionDeclarations.length} function declarations (${customTools.length} custom + ${azureTools.length} Azure MCP)`);

      // Step 3: Build dynamic system instructions with rich context
      const systemInstruction = this.buildSystemInstruction(richContext);

      // Build conversation content from history + new message
      const contents = this.buildContents(conversationHistory, message);

      // Initialize iteration tracking
      let iterations = 0;
      let currentContents = [...contents];
      let finalResponse = '';

      // Iterate until we get a final text response or hit max iterations
      while (iterations < this.MAX_ITERATIONS) {
        iterations++;
        this.logger.debug(`Iteration ${iterations}/${this.MAX_ITERATIONS}`);

        // Generate content with function calling enabled
        // Add retry logic for rate limiting (429 errors)
        let response;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            response = await client.models.generateContent({
              model,
              contents: currentContents,
              config: {
                systemInstruction,
                tools: [{ functionDeclarations: allFunctionDeclarations }],
                toolConfig: {
                  functionCallingConfig: {
                    mode: FunctionCallingConfigMode.AUTO,
                  },
                },
              },
            });
            break; // Success, exit retry loop
          } catch (error: any) {
            if (error.status === 429 && retries < maxRetries - 1) {
              // Rate limit hit, wait with exponential backoff
              const waitTime = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
              this.logger.warn(`Rate limit hit (429), retrying in ${waitTime}ms... (attempt ${retries + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries++;
            } else {
              // Non-429 error or max retries reached, rethrow
              throw error;
            }
          }
        }

        // Check if we got function calls
        if (response.functionCalls && response.functionCalls.length > 0) {
          this.logger.log(`Model requested ${response.functionCalls.length} function call(s)`);

          // Execute all function calls
          const functionResults = await Promise.all(
            response.functionCalls.map(async (call) => {
              const functionName = call.name || 'unknown';
              this.logger.log(`Executing function: ${functionName}`);
              this.logger.debug(`Function args:`, call.args);
              
              try {
                // Determine if this is a custom MCP tool or Azure MCP Gateway tool
                const isCustomTool = customTools.some(t => t.name === functionName);
                const isAzureTool = azureTools.some(t => t.name === functionName);
                
                let resultText: string;
                
                if (isCustomTool) {
                  // Execute custom MCP tool
                  const result = await this.mcpToolsService.executeTool(functionName, call.args);
                  resultText = result.content.map((c) => c.text).join('\n');
                  this.logger.debug(`Custom tool ${functionName} executed successfully`);
                } else if (isAzureTool) {
                  // Execute Azure MCP Gateway tool
                  const result = await this.azureMcpGateway.executeTool(
                    functionName,
                    call.args,
                    userId || 'anonymous',
                    conversationId || 'unknown',
                  );
                  
                  if (result.success) {
                    resultText = typeof result.data === 'string' 
                      ? result.data 
                      : JSON.stringify(result.data, null, 2);
                    this.logger.log(`Azure MCP tool ${functionName} executed in ${result.durationMs}ms`);
                  } else {
                    resultText = `Error: ${result.error}`;
                    this.logger.error(`Azure MCP tool ${functionName} failed: ${result.error}`);
                  }
                } else {
                  // Unknown tool
                  this.logger.warn(`Unknown tool requested: ${functionName}`);
                  resultText = `Error: Tool ${functionName} not found`;
                }
                
                this.logger.debug(`Function ${functionName} result: ${resultText.substring(0, 200)}...`);

                return {
                  name: functionName,
                  response: {
                    content: resultText,
                  },
                };
              } catch (error) {
                this.logger.error(`Error executing function ${functionName}:`, error);
                return {
                  name: functionName,
                  response: {
                    content: `Error executing ${functionName}: ${error.message}`,
                  },
                };
              }
            }),
          );

          // Add the assistant's function call message to conversation
          currentContents.push({
            role: 'model',
            parts: response.functionCalls.map((call) => ({
              functionCall: {
                name: call.name,
                args: call.args,
              },
            })),
          });

          // Add function results to conversation
          currentContents.push({
            role: 'function',
            parts: functionResults.map((result) => ({
              functionResponse: {
                name: result.name,
                response: result.response,
              },
            })),
          });

          // Continue to next iteration with updated conversation
          continue;
        }

        // No function calls - we have a final text response
        if (response.text) {
          finalResponse = response.text;
          this.logger.debug(`Got final response: ${finalResponse.substring(0, 100)}...`);
          break;
        }

        // No function calls and no text - unexpected situation
        this.logger.warn('No function calls and no text in response');
        finalResponse = 'I apologize, but I encountered an issue processing your request.';
        break;
      }

      // Check if we hit max iterations
      if (iterations >= this.MAX_ITERATIONS) {
        this.logger.warn(`Hit maximum iterations (${this.MAX_ITERATIONS})`);
        finalResponse = 'I apologize, but I needed too many steps to answer your question. Please try rephrasing your request.';
      }

      return {
        response: finalResponse,
        richContext,
      };
    } catch (error) {
      this.logger.error('Error in sendMessage:', error);
      
      // Handle rate limit errors with user-friendly message
      if (error.status === 429) {
        throw new Error('API rate limit reached. Please wait a moment and try again. If this persists, consider upgrading your Gemini API quota.');
      }
      
      throw new Error(`Failed to process message: ${error.message}`);
    }
  }

  /**
   * Build Gemini contents array from conversation history
   */
  private buildContents(history: Message[], newMessage: string) {
    const contents: any[] = [];

    // Add conversation history
    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Add new user message
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }],
    });

    return contents;
  }

  /**
   * Get available tools for display/debugging
   */
  getAvailableTools() {
    return this.mcpToolsService.getAvailableTools();
  }
}
