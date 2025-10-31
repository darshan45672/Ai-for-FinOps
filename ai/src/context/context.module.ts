import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ContextService } from './context.service';
import { Context7Module } from '../context7/context7.module';
import { AzureMcpGatewayModule } from '../mcp/azure-mcp-gateway.module';

/**
 * Context Module
 * 
 * Provides rich context engineering capabilities for the AI system.
 * 
 * Features:
 * - User preference management
 * - Azure environment context
 * - Conversation history tracking
 * - Historical trend analysis
 * - RAG with Context7
 * - Tool availability discovery via Azure MCP Gateway
 * - Smart caching (5-10 min TTL)
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    Context7Module,
    AzureMcpGatewayModule,
  ],
  providers: [ContextService],
  exports: [ContextService],
})
export class ContextModule {}
