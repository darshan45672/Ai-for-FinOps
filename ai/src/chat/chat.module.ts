import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ChatGeminiService } from './chat-gemini.service';
import { ChatGateway } from './chat.gateway';
import { ResponseFormatterService } from './response-formatter.service';
import { GeminiModule } from '../gemini/gemini.module';
import { McpModule } from '../mcp/mcp.module';
import { ContextModule } from '../context/context.module';
import { AzureMcpGatewayModule } from '../mcp/azure-mcp-gateway.module';
import { AiCostTrackerModule } from '../ai-cost-tracker/ai-cost-tracker.module';

/**
 * Chat Module
 * 
 * This module encapsulates chat-related functionality:
 * - ChatGeminiService for Google Gemini integration with function calling
 * - ChatGateway for WebSocket communication
 * - Integration with Gemini, MCP, Azure MCP Gateway, and Context modules
 * - HTTP client for database service communication
 * - AI cost tracking for token usage monitoring
 * 
 * This module depends on:
 * - GeminiModule: For Google Gemini AI with function calling
 * - McpModule: For custom FinOps tool execution
 * - AzureMcpGatewayModule: For Azure MCP Gateway tools
 * - ContextModule: For rich context building with Context7 and Azure MCP Gateway
 * - AiCostTrackerModule: For tracking AI token usage and costs
 * - HttpModule: For database service communication
 */
@Module({
  imports: [
    HttpModule,              // For making HTTP requests to database service
    ConfigModule,            // For accessing environment variables
    GeminiModule,            // Import to use GeminiService for AI
    McpModule,               // Import to use McpToolsService
    AzureMcpGatewayModule,   // Import to use AzureMcpGatewayService
    ContextModule,           // Import to use ContextService for rich context building
    AiCostTrackerModule,     // Import to use AiCostTrackerService for cost tracking
  ],
  providers: [ChatGeminiService, ChatGateway, ResponseFormatterService],
  exports: [ChatGeminiService, ResponseFormatterService], // Export for use in other modules if needed
})
export class ChatModule {}


