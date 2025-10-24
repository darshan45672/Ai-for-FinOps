import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { McpToolsService } from './mcp-tools.service';

/**
 * MCP (Model Context Protocol) Module
 * 
 * This module encapsulates MCP-related functionality:
 * - MCP Tools Service for tool definitions and execution
 * - Integration with Database and Backend services
 * - Azure resource query tools
 * 
 * The McpToolsService is exported to be used by ChatModule
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 120000, // 2 minutes timeout for API requests
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [McpToolsService],
  exports: [McpToolsService], // Export for use in Chat module
})
export class McpModule {}
