import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
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
 * - HTTP client for database service communication
 * 
 * This module depends on:
 * - OllamaModule: For LLM communication
 * - McpModule: For tool execution (Azure resource queries)
 * - HttpModule: For database service communication
 */
@Module({
  imports: [
    HttpModule,   // For making HTTP requests to database service
    ConfigModule, // For accessing environment variables
    OllamaModule, // Import to use OllamaService
    McpModule,    // Import to use McpToolsService
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService], // Export in case other modules need it
})
export class ChatModule {}
