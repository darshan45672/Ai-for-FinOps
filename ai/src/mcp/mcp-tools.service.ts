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
        description: 'Fetch and list Azure resources from the database. Returns up to 50 resources with full details plus total count (out of potentially thousands). For large result sets, suggest using filters. Can filter by type, location, resourceGroup, or status to narrow results. Use this when users ask to "list resources", "show me resources", or "what resources do I have".',
        inputSchema: {
          type: 'object',
          properties: {
            type: { 
              type: 'string', 
              description: 'Filter by resource type (e.g., VIRTUAL_MACHINE, STORAGE_ACCOUNT, SQL_DATABASE, APP_SERVICE, FUNCTION_APP, KUBERNETES_SERVICE, COSMOS_DB, KEY_VAULT, OTHER)'
            },
            location: { 
              type: 'string', 
              description: 'Filter by Azure region/location (e.g., eastus, westus, centralus)'
            },
            resourceGroup: { 
              type: 'string', 
              description: 'Filter by resource group name'
            },
            status: { 
              type: 'string', 
              description: 'Filter by resource status (RUNNING, STOPPED, DEALLOCATED, FAILED, UNKNOWN)'
            },
          },
        },
      },
      {
        name: 'get_resource_costs',
        description: 'Get cost data for Azure resources from the database. Use this to retrieve cost information, spending trends, and utilization data. Costs are automatically synced from Azure.',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: { 
              type: 'string', 
              description: 'Start date for cost data in ISO format (YYYY-MM-DD). Required for date range filtering.'
            },
            endDate: { 
              type: 'string', 
              description: 'End date for cost data in ISO format (YYYY-MM-DD). Required for date range filtering.'
            },
            resourceGroup: { 
              type: 'string', 
              description: 'Optional: Filter by specific resource group name'
            },
            resourceId: { 
              type: 'string', 
              description: 'Optional: Filter by specific resource ID'
            },
          },
          required: ['startDate', 'endDate'],
        },
      },
      {
        name: 'get_resource_groups_count',
        description: 'Get the total count and complete list of all resource groups across all Azure subscriptions. Returns both the count and the names of all resource groups. Use this when users ask "how many resource groups", "list resource groups", or "show me resource groups".',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_azure_summary',
        description: 'Get a summary of all Azure resources including total counts by type, locations, and resource groups. Use this for overview or dashboard-style queries.',
        inputSchema: {
          type: 'object',
          properties: {},
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
        case 'get_resource_groups_count':
          return await this.getResourceGroupsCount();
        case 'get_azure_summary':
          return await this.getAzureSummary();
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
    // Build query parameters from filters
    const queryParams = new URLSearchParams();
    
    if (params.type) queryParams.append('type', params.type);
    if (params.location) queryParams.append('location', params.location);
    if (params.resourceGroup) queryParams.append('resourceGroup', params.resourceGroup);
    if (params.status) queryParams.append('status', params.status);
    
    const url = `${this.databaseServiceUrl}/azure/resources?${queryParams.toString()}`;
    
    this.logger.debug(`Fetching Azure resources from: ${url}`);
    
    const response = await firstValueFrom(
      this.httpService.get(url).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Failed to fetch Azure resources: ${error.message}`);
          throw error;
        }),
      ),
    );
    
    const resources = (response as AxiosResponse).data;
    const formattedResponse = this.formatResourcesResponse(resources);
    
    return {
      content: [{ type: 'text', text: formattedResponse }],
    };
  }

  private async getResourceCosts(params: any): Promise<MCPToolResult> {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.resourceGroup) queryParams.append('resourceGroup', params.resourceGroup);
    if (params.resourceId) queryParams.append('resourceId', params.resourceId);
    
    const url = `${this.databaseServiceUrl}/azure/costs?${queryParams.toString()}`;
    
    this.logger.debug(`Fetching Azure costs from: ${url}`);
    
    const response = await firstValueFrom(
      this.httpService.get(url).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Failed to fetch Azure costs: ${error.message}`);
          throw error;
        }),
      ),
    );
    
    const costs = (response as AxiosResponse).data;
    const formattedResponse = this.formatCostsResponse(costs, params);
    
    return {
      content: [{ type: 'text', text: formattedResponse }],
    };
  }

  private async getResourceGroupsCount(): Promise<MCPToolResult> {
    const url = `${this.databaseServiceUrl}/azure/resources/groups/count`;
    
    this.logger.debug(`Fetching resource groups count from: ${url}`);
    
    const response = await firstValueFrom(
      this.httpService.get(url).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Failed to fetch resource groups count: ${error.message}`);
          throw error;
        }),
      ),
    );
    
    const data = (response as AxiosResponse).data;
    
    return {
      content: [{ 
        type: 'text', 
        text: `You have **${data.count}** resource groups across all your Azure subscriptions.\n\nResource groups: ${data.resourceGroups.join(', ')}`
      }],
    };
  }

  private async getAzureSummary(): Promise<MCPToolResult> {
    const url = `${this.databaseServiceUrl}/azure/resources/summary`;
    
    this.logger.debug(`Fetching Azure summary from: ${url}`);
    
    const response = await firstValueFrom(
      this.httpService.get(url).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Failed to fetch Azure summary: ${error.message}`);
          throw error;
        }),
      ),
    );
    
    const summary = (response as AxiosResponse).data;
    const formattedResponse = this.formatSummaryResponse(summary);
    
    return {
      content: [{ type: 'text', text: formattedResponse }],
    };
  }

  private formatResourcesResponse(resources: any[]): string {
    if (!resources || resources.length === 0) {
      return 'No Azure resources found matching your filters.';
    }

    const displayLimit = 50; // Increased from 20 to 50 for better visibility
    let response = `Found **${resources.length}** Azure resources:\n\n`;
    
    // Show first 50 resources (or all if less than 50)
    const resourcesToShow = Math.min(resources.length, displayLimit);
    
    resources.slice(0, resourcesToShow).forEach((resource, index) => {
      response += `${index + 1}. **${resource.name}**\n`;
      response += `   - Type: ${resource.type}\n`;
      response += `   - Resource Group: ${resource.resourceGroup}\n`;
      response += `   - Location: ${resource.location}\n`;
      response += `   - Status: ${resource.status}\n`;
      if (resource.sku) response += `   - SKU: ${resource.sku}\n`;
      response += `\n`;
    });

    if (resources.length > displayLimit) {
      response += `\n_...and ${resources.length - displayLimit} more resources. Use filters (type, location, resourceGroup, status) to narrow down the results._\n`;
    }

    return response;
  }

  private formatCostsResponse(costs: any[], params: any): string {
    if (!costs || costs.length === 0) {
      return `No cost data found for the period ${params.startDate} to ${params.endDate}.`;
    }

    const totalCost = costs.reduce((sum, cost) => sum + cost.cost, 0);
    
    let response = `## Azure Cost Summary (${params.startDate} to ${params.endDate})\n\n`;
    response += `**Total Cost:** $${totalCost.toFixed(2)} ${costs[0]?.currency || 'USD'}\n\n`;
    
    // Group by service
    const costsByService = costs.reduce((acc, cost) => {
      const service = cost.serviceName || 'Unknown';
      if (!acc[service]) acc[service] = 0;
      acc[service] += cost.cost;
      return acc;
    }, {});

    response += `### Breakdown by Service:\n`;
    Object.entries(costsByService)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .forEach(([service, cost]: any) => {
        const percentage = ((cost / totalCost) * 100).toFixed(1);
        response += `- **${service}**: $${cost.toFixed(2)} (${percentage}%)\n`;
      });

    if (params.resourceGroup) {
      response += `\n_Filtered by resource group: ${params.resourceGroup}_\n`;
    }

    return response;
  }

  private formatSummaryResponse(summary: any): string {
    let response = `## Azure Resources Summary\n\n`;
    
    response += `**Total Resources:** ${summary.totalResources}\n`;
    response += `**Resource Groups:** ${summary.resourceGroups}\n`;
    response += `**Subscriptions:** ${summary.subscriptions}\n\n`;
    
    response += `### Resources by Type:\n`;
    Object.entries(summary.resourcesByType || {}).forEach(([type, count]) => {
      response += `- ${type}: ${count}\n`;
    });
    
    response += `\n### Resources by Location:\n`;
    Object.entries(summary.resourcesByLocation || {})
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .forEach(([location, count]) => {
        response += `- ${location}: ${count}\n`;
      });

    return response;
  }

  /**
   * Get tools in Azure AI Foundry function tool format
   * Uses the @azure/ai-agents ToolUtility to create function tools
   */
  getAzureFoundryFunctionTools() {
    const tools = this.getAvailableTools();
    
    // Import ToolUtility dynamically to avoid bundling issues
    let ToolUtility: any;
    try {
      ToolUtility = require('@azure/ai-agents').ToolUtility;
    } catch (error) {
      this.logger.error('Azure AI Agents SDK not installed. Run: npm install @azure/ai-agents');
      throw new Error('Azure AI Agents SDK not available');
    }

    // ToolUtility.createFunctionTool returns { definition, func }
    // We only need the definition property which has the correct format with 'type' field
    return tools.map((tool) => {
      const functionTool = ToolUtility.createFunctionTool({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      });
      return functionTool.definition;
    });
  }

  /**
   * Get tools in Google Gemini FunctionDeclaration format
   * Converts MCP tools to Gemini's function calling format
   */
  getGeminiFunctionDeclarations() {
    const tools = this.getAvailableTools();
    
    // Import Type from @google/genai
    let Type: any;
    try {
      const genai = require('@google/genai');
      Type = genai.Type;
    } catch (error) {
      this.logger.error('Google GenAI SDK not installed. Run: npm install @google/genai');
      throw new Error('Google GenAI SDK not available');
    }

    // Convert each tool to Gemini FunctionDeclaration format
    return tools.map((tool) => {
      // Convert JSON Schema properties to Gemini format
      const properties = {};
      if (tool.inputSchema.properties) {
        for (const [key, value] of Object.entries(tool.inputSchema.properties)) {
          const prop: any = value;
          properties[key] = {
            type: this.mapJsonTypeToGeminiType(prop.type, Type),
            description: prop.description || '',
          };
        }
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: Type.OBJECT,
          properties,
          required: tool.inputSchema.required || [],
        },
      };
    });
  }

  /**
   * Map JSON Schema type to Gemini Type enum
   */
  private mapJsonTypeToGeminiType(jsonType: string, Type: any) {
    switch (jsonType.toLowerCase()) {
      case 'string':
        return Type.STRING;
      case 'number':
      case 'integer':
        return Type.NUMBER;
      case 'boolean':
        return Type.BOOLEAN;
      case 'array':
        return Type.ARRAY;
      case 'object':
        return Type.OBJECT;
      default:
        return Type.STRING;
    }
  }
}
