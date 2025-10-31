import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { McpToolsService } from '../mcp/mcp-tools.service';
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
  ) {}

  /**
   * Send a message and get a response from Gemini with function calling support
   */
  async sendMessage(
    message: string,
    conversationHistory: Message[] = [],
  ): Promise<string> {
    try {
      this.logger.debug(`Processing message: ${message}`);

      const client = this.geminiService.getClient();
      const model = this.geminiService.getModel();

      // Get available tools in Gemini format
      const functionDeclarations = this.mcpToolsService.getGeminiFunctionDeclarations();
      
      this.logger.debug(`Loaded ${functionDeclarations.length} function declarations`);

      // Build conversation content from history + new message
      const contents = this.buildContents(conversationHistory, message);

      // Initialize iteration tracking
      let iterations = 0;
      let currentContents = [...contents];
      let finalResponse = '';

      // Iterate until we get a final text response or hit max iterations
      while (iterations < this.MAX_ITERATIONS) {
        iterations++;
        this.logger.debug(`Iteration ${iterations}`);

        // Generate content with function calling enabled
        const response = await client.models.generateContent({
          model,
          contents: currentContents,
          config: {
            systemInstruction: `You are an Azure FinOps AI Assistant with direct access to real-time Azure resource data through function tools.

CRITICAL RULES:
1. When you receive function call results, TRUST them completely - they contain accurate, real data from the user's Azure environment
2. Tool results come PRE-FORMATTED with complete details - display them EXACTLY as returned, do NOT summarize
3. If the tool returns a formatted list like "1. ResourceName\n   - Type: VM\n2. StorageName...", show that ENTIRE formatted list verbatim
4. The tool results ARE the complete answer - present them word-for-word to the user
5. NEVER say "The first 20 are listed above" unless you actually displayed those 20 items in your response

YOUR TOOLS:
- get_azure_resources: Returns FORMATTED text with up to 50 resources (each with name, type, resource group, location, status) PLUS total count. For large environments (1000+ resources), the tool suggests using filters. Display the COMPLETE formatted text.
- get_resource_groups_count: Returns FORMATTED text with ALL resource group names listed. Display the COMPLETE text.
- get_resource_costs: Returns FORMATTED cost breakdown. Display the COMPLETE text.
- get_azure_summary: Returns FORMATTED overview with counts. Display the COMPLETE text.

BEHAVIOR GUIDELINES:
✅ DO: Copy the entire formatted text from tool results into your response
✅ DO: Show all numbered lists, details, and formatting exactly as provided
✅ DO: If tool returns "Found **4025** resources:\n\n1. vm-name\n   - Type: VM\n2. storage...", show ALL of that
✅ DO: Trust that tool results are complete and accurate
✅ DO: When results show "...and 3975 more", suggest using filters to narrow the search

❌ DON'T: Summarize tool results - they're already formatted for display
❌ DON'T: Say "listed above" if you didn't paste the actual list
❌ DON'T: Reformat, reorganize, or shorten the tool's output
❌ DON'T: Say "I cannot list all" or apologize for "limitations"

EXAMPLE:

User: "what azure resources am i using"
Tool Returns: "Found **4025** Azure resources:\n\n1. **vm-prod-01**\n   - Type: VIRTUAL_MACHINE\n   - Resource Group: rg-prod\n   - Location: eastus\n   - Status: RUNNING\n\n2. **storage-prod**\n   - Type: STORAGE_ACCOUNT\n   - Resource Group: rg-prod\n   - Location: westus\n   - Status: RUNNING\n\n...(continues for 20 items)\n\n_...and 4005 more resources_"

Your Response: [Paste that ENTIRE formatted text, including all 20 numbered items, not just "I found 4025 resources"]

Remember: Your job is to DISPLAY the pre-formatted tool output, not to summarize it!`,
            tools: [{ functionDeclarations }],
            toolConfig: {
              functionCallingConfig: {
                mode: FunctionCallingConfigMode.AUTO,
              },
            },
          },
        });

        // Check if we got function calls
        if (response.functionCalls && response.functionCalls.length > 0) {
          this.logger.debug(`Model requested ${response.functionCalls.length} function call(s)`);

          // Execute all function calls
          const functionResults = await Promise.all(
            response.functionCalls.map(async (call) => {
              const functionName = call.name || 'unknown';
              this.logger.debug(`Executing function: ${functionName} with args:`, call.args);
              
              try {
                const result = await this.mcpToolsService.executeTool(functionName, call.args);
                
                // Extract text content from MCP result
                const resultText = result.content
                  .map((c) => c.text)
                  .join('\n');
                
                this.logger.debug(`Function ${functionName} result: ${resultText.substring(0, 100)}...`);

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

      return finalResponse;
    } catch (error) {
      this.logger.error('Error in sendMessage:', error);
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
