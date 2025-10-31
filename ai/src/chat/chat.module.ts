import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ChatGeminiService } from './chat-gemini.service';
import { ChatGateway } from './chat.gateway';
import { GeminiModule } from '../gemini/gemini.module';
import { McpModule } from '../mcp/mcp.module';

/**
 * Chat Module
 * 
 * This module encapsulates chat-related functionality:
 * - ChatGeminiService for Google Gemini integration with function calling
 * - ChatGateway for WebSocket communication
 * - Integration with Gemini and MCP modules
 * - HTTP client for database service communication
 * 
 * This module depends on:
 * - GeminiModule: For Google Gemini AI with function calling
 * - McpModule: For tool execution (Azure resource queries)
 * - HttpModule: For database service communication
 */
@Module({
  imports: [
    HttpModule,      // For making HTTP requests to database service
    ConfigModule,    // For accessing environment variables
    GeminiModule,    // Import to use GeminiService for AI
    McpModule,       // Import to use McpToolsService
  ],
  providers: [ChatGeminiService, ChatGateway],
  exports: [ChatGeminiService], // Export for use in other modules if needed
})
export class ChatModule {}


