import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { OllamaModule } from '../ollama/ollama.module';
import { McpModule } from '../mcp/mcp.module';

/**
 * Chat Module
 * 
 * This module encapsulates chat-related functionality:
 * - ChatService for orchestrating chat flow with Ollama and MCP tools
 * - ChatGateway for WebSocket communication
 * - Integration with Ollama and MCP modules
 * 
 * This module depends on:
 * - OllamaModule: For LLM communication
 * - McpModule: For tool execution (Azure resource queries)
 */
@Module({
  imports: [
    OllamaModule, // Import to use OllamaService
    McpModule,    // Import to use McpToolsService
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService], // Export in case other modules need it
})
export class ChatModule {}
