import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { AzureMcpGatewayService } from './azure-mcp-gateway.service';
import { ToolDiscoveryOptions } from './interfaces/mcp-gateway.interface';

/**
 * Azure MCP Gateway Controller
 * 
 * Provides REST endpoints for testing and interacting with Azure MCP Gateway
 */
@Controller('mcp-gateway')
export class AzureMcpGatewayController {
  private readonly logger = new Logger(AzureMcpGatewayController.name);

  constructor(private readonly azureMcpGateway: AzureMcpGatewayService) {}

  /**
   * Discover all available Azure MCP tools
   * 
   * GET /mcp-gateway/discover?refreshCache=true
   */
  @Get('discover')
  async discoverTools(@Query('refreshCache') refreshCache?: string) {
    this.logger.log('Discovering Azure MCP tools...');
    
    const options: ToolDiscoveryOptions = {
      refreshCache: refreshCache === 'true',
    };

    const tools = await this.azureMcpGateway.discoverAllTools(options);

    return {
      success: true,
      count: tools.length,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        category: tool.metadata?.category,
        serverName: tool.metadata?.serverName,
        parametersCount: Object.keys(tool.parameters.properties).length,
        requiredParams: tool.parameters.required,
      })),
    };
  }

  /**
   * Get available MCP servers
   * 
   * GET /mcp-gateway/servers
   */
  @Get('servers')
  async getServers() {
    const servers = this.azureMcpGateway.getAvailableServers();

    return {
      success: true,
      count: servers.length,
      servers: servers.map(server => ({
        name: server.name,
        description: server.description,
        category: server.category,
      })),
    };
  }

  /**
   * Execute a tool
   * 
   * POST /mcp-gateway/execute
   * Body: { toolName: string, parameters: any, userId: string, conversationId: string }
   */
  @Post('execute')
  async executeTool(@Body() body: {
    toolName: string;
    parameters: any;
    userId: string;
    conversationId: string;
  }) {
    this.logger.log(`Executing tool: ${body.toolName}`);

    const result = await this.azureMcpGateway.executeTool(
      body.toolName,
      body.parameters,
      body.userId,
      body.conversationId,
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error,
      durationMs: result.durationMs,
      timestamp: result.timestamp,
    };
  }

  /**
   * Clear tool cache
   * 
   * POST /mcp-gateway/cache/clear
   */
  @Post('cache/clear')
  async clearCache() {
    this.logger.log('Clearing tool cache...');
    await this.azureMcpGateway.clearCache();

    return {
      success: true,
      message: 'Tool cache cleared successfully',
    };
  }

  /**
   * Health check
   * 
   * GET /mcp-gateway/health
   */
  @Get('health')
  async health() {
    return {
      success: true,
      service: 'Azure MCP Gateway',
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }
}
