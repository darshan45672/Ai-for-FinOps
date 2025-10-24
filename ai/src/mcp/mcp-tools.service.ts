import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

@Injectable()
export class McpToolsService {
  private readonly logger = new Logger(McpToolsService.name);
  private readonly databaseServiceUrl: string;
  private readonly backendServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.databaseServiceUrl = this.configService.get<string>(
      'DATABASE_SERVICE_URL',
      'http://localhost:3002',
    );
    this.backendServiceUrl = this.configService.get<string>(
      'BACKEND_SERVICE_URL',
      'http://localhost:3001',
    );
    this.logger.log('MCP Tools Service initialized');
  }

  getAvailableTools(): MCPTool[] {
    return [
      {
        name: 'get_azure_resources',
        description: 'Fetch Azure resources with filtering',
        inputSchema: {
          type: 'object',
          properties: {
            subscriptionId: { type: 'string' },
            type: { type: 'string' },
            location: { type: 'string' },
            resourceGroup: { type: 'string' },
            status: { type: 'string' },
          },
        },
      },
      {
        name: 'get_resource_costs',
        description: 'Get cost data for Azure resources',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            resourceGroup: { type: 'string' },
            resourceId: { type: 'string' },
          },
          required: ['startDate', 'endDate'],
        },
      },
    ];
  }

  async executeTool(toolName: string, params: any): Promise<MCPToolResult> {
    this.logger.debug('Executing tool: ' + toolName);
    try {
      switch (toolName) {
        case 'get_azure_resources':
          return await this.getAzureResources(params);
        case 'get_resource_costs':
          return await this.getResourceCosts(params);
        default:
          throw new Error('Unknown tool: ' + toolName);
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: 'Error: ' + error.message }],
        isError: true,
      };
    }
  }

  private async getAzureResources(params: any): Promise<MCPToolResult> {
    const url = this.databaseServiceUrl + '/azure/resources';
    const response = await firstValueFrom(
      this.httpService.get(url).pipe(
        catchError((error: AxiosError) => {
          throw error;
        }),
      ),
    );
    return {
      content: [{ type: 'text', text: JSON.stringify((response as AxiosResponse).data) }],
    };
  }

  private async getResourceCosts(params: any): Promise<MCPToolResult> {
    const url = this.databaseServiceUrl + '/azure/costs';
    const response = await firstValueFrom(
      this.httpService.get(url).pipe(
        catchError((error: AxiosError) => {
          throw error;
        }),
      ),
    );
    return {
      content: [{ type: 'text', text: JSON.stringify((response as AxiosResponse).data) }],
    };
  }
}
