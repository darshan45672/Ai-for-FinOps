import { Injectable, Logger } from '@nestjs/common';
import { ClientSecretCredential } from '@azure/identity';
import { ResourceManagementClient } from '@azure/arm-resources';
import { CostManagementClient } from '@azure/arm-costmanagement';
import { ResourceGraphClient } from '@azure/arm-resourcegraph';
import { MonitorClient } from '@azure/arm-monitor';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AzureService {
  private readonly logger = new Logger(AzureService.name);
  private credential: ClientSecretCredential;
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly subscriptionId: string;

  constructor(private readonly httpService: HttpService) {
    // Load Azure credentials from environment variables
    this.tenantId = process.env.AZURE_TENANT_ID || '';
    this.clientId = process.env.AZURE_CLIENT_ID || '';
    this.clientSecret = process.env.AZURE_CLIENT_SECRET || '';
    this.subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || '';

    if (!this.tenantId || !this.clientId || !this.clientSecret) {
      this.logger.error('Azure credentials not configured. Please set environment variables.');
    } else {
      // Initialize Azure credential with Service Principal
      this.credential = new ClientSecretCredential(
        this.tenantId,
        this.clientId,
        this.clientSecret,
      );
      this.logger.log('Azure Service Principal authenticated successfully');
    }
  }

  /**
   * Get all Azure subscriptions accessible by the Service Principal
   */
  async getSubscriptions(): Promise<any[]> {
    try {
      const url = `https://management.azure.com/subscriptions?api-version=2022-12-01`;
      
      // Get access token
      const tokenResponse = await this.credential.getToken('https://management.azure.com/.default');
      
      const response = await firstValueFrom(
        this.httpService.get<{ value: any[] }>(url, {
          headers: {
            Authorization: `Bearer ${tokenResponse.token}`,
          },
        }),
      );

      return response.data.value;
    } catch (error: any) {
      this.logger.error(`Failed to fetch subscriptions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch all resources in a subscription
   */
  async getResources(subscriptionId: string) {
    try {
      const client = new ResourceManagementClient(this.credential, subscriptionId);
      const resources: any[] = [];

      // List all resources
      for await (const resource of client.resources.list()) {
        resources.push({
          id: resource.id || '',
          name: resource.name || '',
          type: resource.type || '',
          location: resource.location || '',
          resourceGroup: this.extractResourceGroup(resource.id || ''),
          tags: resource.tags,
          sku: resource.sku,
          properties: resource.properties,
        });
      }

      this.logger.log(`Fetched ${resources.length} resources from subscription ${subscriptionId}`);
      return resources;
    } catch (error: any) {
      this.logger.error(`Failed to fetch resources: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch cost data using Azure Cost Management Cost Details API
   * This uses the modern generateCostDetailsReport API instead of the deprecated query.usage
   * 
   * Workflow:
   * 1. POST to generate report
   * 2. Poll operation status
   * 3. Download and parse CSV
   */
  async getCostData(subscriptionId: string, startDate: Date, endDate: Date) {
    try {
      const scope = `/subscriptions/${subscriptionId}`;
      
      // Step 1: Generate cost details report
      const tokenResponse = await this.credential.getToken(
        'https://management.azure.com/.default',
      );
      
      const generateUrl = `https://management.azure.com${scope}/providers/Microsoft.CostManagement/generateCostDetailsReport?api-version=2025-03-01`;
      
      const requestBody = {
        metric: 'ActualCost',
        timePeriod: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
      };
      
      this.logger.log(`Generating cost details report for subscription ${subscriptionId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      const generateResponse = await firstValueFrom(
        this.httpService.post(generateUrl, requestBody, {
          headers: {
            'Authorization': `Bearer ${tokenResponse.token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      
      // Extract operation ID from Location header or response
      const locationHeader = generateResponse.headers['location'];
      const operationId = this.extractOperationId(locationHeader);
      
      if (!operationId) {
        this.logger.error('Failed to extract operation ID from response');
        throw new Error('No operation ID returned from generateCostDetailsReport');
      }
      
      this.logger.log(`Cost report generation started. Operation ID: ${operationId}`);
      
      // Step 2: Poll for status until complete
      const statusUrl = `https://management.azure.com${scope}/providers/Microsoft.CostManagement/costDetailsOperationStatus/${operationId}?api-version=2025-03-01`;
      
      let reportReady = false;
      let attempts = 0;
      const maxAttempts = 60; // Wait up to 5 minutes (60 * 5 seconds)
      let downloadUrl: string | null = null;
      
      while (!reportReady && attempts < maxAttempts) {
        attempts++;
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls
        
        const statusResponse = await firstValueFrom(
          this.httpService.get(statusUrl, {
            headers: {
              'Authorization': `Bearer ${tokenResponse.token}`,
            },
          }),
        );
        
        const status = statusResponse.data;
        this.logger.debug(`Poll attempt ${attempts}: Status = ${status.status}`);
        
        if (status.status === 'Completed') {
          reportReady = true;
          downloadUrl = status.properties?.reportUrl || status.properties?.downloadUrl;
          this.logger.log(`Cost report ready. Download URL obtained.`);
        } else if (status.status === 'Failed') {
          throw new Error(`Cost report generation failed: ${status.error?.message || 'Unknown error'}`);
        }
        // Status can be: InProgress, Queued, Completed, Failed
      }
      
      if (!reportReady || !downloadUrl) {
        throw new Error(`Cost report generation timed out after ${attempts} attempts`);
      }
      
      // Step 3: Download and parse CSV
      this.logger.log(`Downloading cost details CSV from ${downloadUrl}`);
      
      const csvResponse = await firstValueFrom(
        this.httpService.get(downloadUrl, {
          responseType: 'text',
        }),
      );
      
      const csvData = csvResponse.data as string;
      
      // Parse CSV to extract cost records
      const parsedData = this.parseCostDetailsCsv(csvData);
      
      this.logger.log(`Parsed ${parsedData.rows.length} cost records from CSV`);
      
      return parsedData;
    } catch (error: any) {
      this.logger.error(`Failed to fetch cost data for subscription ${subscriptionId}: ${error.message}`);
      if (error.response) {
        this.logger.error(`API Response Status: ${error.response.status}`);
        this.logger.error(`API Response Data: ${JSON.stringify(error.response.data)}`);
      }
      
      // Fallback to old API if new API fails
      this.logger.warn('Falling back to legacy query.usage API');
      return this.getCostDataLegacy(subscriptionId, startDate, endDate);
    }
  }
  
  /**
   * Extract operation ID from Location header
   */
  private extractOperationId(locationHeader: string): string | null {
    if (!locationHeader) return null;
    
    const match = locationHeader.match(/costDetailsOperationStatus\/([^?]+)/);
    return match ? match[1] : null;
  }
  
  /**
   * Parse CSV cost details into structured format
   */
  private parseCostDetailsCsv(csvData: string): { columns: any[], rows: any[][] } {
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { columns: [], rows: [] };
    }
    
    // First line is header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Map to column objects
    const columns = headers.map(name => ({
      name,
      type: 'string',
    }));
    
    // Parse data rows
    const rows: any[][] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      rows.push(values);
    }
    
    return { columns, rows };
  }
  
  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCsvLine(line: string): any[] {
    const values: any[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Push last value
    values.push(currentValue.trim());
    
    return values;
  }
  
  /**
   * Legacy cost data fetch using deprecated query.usage API
   * Kept as fallback
   */
  private async getCostDataLegacy(subscriptionId: string, startDate: Date, endDate: Date) {
    try {
      const scope = `/subscriptions/${subscriptionId}`;
      const client = new CostManagementClient(this.credential);

      const queryDefinition: any = {
        type: 'Usage',
        timeframe: 'Custom',
        timePeriod: {
          from: new Date(startDate.toISOString().split('T')[0]),
          to: new Date(endDate.toISOString().split('T')[0]),
        },
        dataset: {
          granularity: 'Daily',
          aggregation: {
            totalCost: {
              name: 'PreTaxCost',
              function: 'Sum',
            },
          },
          grouping: [
            {
              type: 'Dimension',
              name: 'ResourceGroup',
            },
            {
              type: 'Dimension',
              name: 'ServiceName',
            },
          ],
        },
      };

      this.logger.log(`Querying cost data (legacy API) for subscription ${subscriptionId}`);
      const result = await client.query.usage(scope, queryDefinition);
      
      this.logger.log(`Cost data query completed. Result structure: ${JSON.stringify({ 
        hasRows: !!result?.rows,
        hasColumns: !!result?.columns,
        rowCount: result?.rows?.length || 0,
        columnCount: result?.columns?.length || 0
      })}`);
      
      if (result?.rows && result.rows.length > 0) {
        this.logger.debug(`First row sample: ${JSON.stringify(result.rows[0])}`);
        this.logger.debug(`Columns: ${JSON.stringify(result.columns)}`);
      } else {
        this.logger.warn(`No cost data returned for subscription ${subscriptionId}`);
      }
      
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to fetch legacy cost data for subscription ${subscriptionId}: ${error.message}`);
      if (error.response) {
        this.logger.error(`API Response: ${JSON.stringify(error.response)}`);
      }
      throw error;
    }
  }

  /**
   * Query resources using Azure Resource Graph
   */
  async queryResourceGraph(query: string, subscriptions?: string[]) {
    try {
      const client = new ResourceGraphClient(this.credential);
      
      const queryRequest = {
        query,
        subscriptions: subscriptions || [this.subscriptionId],
      };

      const result = await client.resources(queryRequest);
      
      this.logger.log(`Resource Graph query executed successfully`);
      return result.data;
    } catch (error: any) {
      this.logger.error(`Failed to execute Resource Graph query: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get virtual machines with detailed information
   */
  async getVirtualMachines(subscriptionId: string) {
    const query = `
      Resources
      | where type == "microsoft.compute/virtualmachines"
      | project id, name, location, resourceGroup, properties.hardwareProfile.vmSize, 
                properties.storageProfile.osDisk, tags, properties.provisioningState
    `;

    return this.queryResourceGraph(query, [subscriptionId]);
  }

  /**
   * Get storage accounts
   */
  async getStorageAccounts(subscriptionId: string) {
    const query = `
      Resources
      | where type == "microsoft.storage/storageaccounts"
      | project id, name, location, resourceGroup, sku.name, tags, properties.primaryEndpoints
    `;

    return this.queryResourceGraph(query, [subscriptionId]);
  }

  /**
   * Get resource utilization and metrics
   */
  async getResourceMetrics(resourceId: string, metricNames: string[], startTime: Date, endTime: Date) {
    try {
      const url = `https://management.azure.com${resourceId}/providers/Microsoft.Insights/metrics`;
      const tokenResponse = await this.credential.getToken('https://management.azure.com/.default');

      const params = {
        'api-version': '2023-10-01',
        metricnames: metricNames.join(','),
        timespan: `${startTime.toISOString()}/${endTime.toISOString()}`,
        interval: 'PT1H',
      };

      const response = await firstValueFrom(
        this.httpService.get<any>(url, {
          headers: {
            Authorization: `Bearer ${tokenResponse.token}`,
          },
          params,
        }),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch resource metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract resource group name from resource ID
   */
  private extractResourceGroup(resourceId: string): string {
    const match = resourceId?.match(/resourceGroups\/([^\/]+)/);
    return match ? match[1] : '';
  }

  /**
   * Map Azure resource type to enum
   */
  mapResourceType(azureType: string): string {
    const typeMap = {
      'Microsoft.Compute/virtualMachines': 'VIRTUAL_MACHINE',
      'Microsoft.Storage/storageAccounts': 'STORAGE_ACCOUNT',
      'Microsoft.Sql/servers/databases': 'SQL_DATABASE',
      'Microsoft.Web/sites': 'APP_SERVICE',
      'Microsoft.Web/sites/functions': 'FUNCTION_APP',
      'Microsoft.ContainerService/managedClusters': 'KUBERNETES_SERVICE',
      'Microsoft.DocumentDB/databaseAccounts': 'COSMOS_DB',
      'Microsoft.KeyVault/vaults': 'KEY_VAULT',
    };

    return typeMap[azureType] || 'OTHER';
  }

  /**
   * Check if Azure credentials are configured
   */
  isConfigured(): boolean {
    return !!(this.tenantId && this.clientId && this.clientSecret);
  }

  /**
   * Fetch Azure Activity Logs for a subscription
   * @param subscriptionId - The subscription ID
   * @param startTime - Start time for the logs (default: 24 hours ago)
   * @param endTime - End time for the logs (default: now)
   * @returns Array of activity log events
   */
  async getActivityLogs(
    subscriptionId: string,
    startTime?: Date,
    endTime?: Date,
  ): Promise<any[]> {
    try {
      // Default to last 24 hours if not specified
      const start = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endTime || new Date();

      const url = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Insights/eventtypes/management/values`;
      const tokenResponse = await this.credential.getToken(
        'https://management.azure.com/.default',
      );

      // Build filter for time range
      const filter = `eventTimestamp ge '${start.toISOString()}' and eventTimestamp le '${end.toISOString()}'`;

      const response = await firstValueFrom(
        this.httpService.get<{ value: any[] }>(url, {
          headers: {
            Authorization: `Bearer ${tokenResponse.token}`,
          },
          params: {
            'api-version': '2015-04-01',
            $filter: filter,
            $select:
              'eventTimestamp,eventDataId,correlationId,operationName,operationId,level,status,subStatus,caller,category,resourceId,resourceGroupName,resourceType,resourceProviderName,eventName,description,httpRequest,authorization,claims,properties',
          },
        }),
      );

      this.logger.log(
        `Fetched ${response.data.value.length} activity log events from subscription ${subscriptionId}`,
      );
      return response.data.value;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch activity logs: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Fetch activity logs for a specific resource group
   */
  async getActivityLogsByResourceGroup(
    subscriptionId: string,
    resourceGroupName: string,
    startTime?: Date,
    endTime?: Date,
  ): Promise<any[]> {
    try {
      const start = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endTime || new Date();

      const url = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Insights/eventtypes/management/values`;
      const tokenResponse = await this.credential.getToken(
        'https://management.azure.com/.default',
      );

      const filter = `eventTimestamp ge '${start.toISOString()}' and eventTimestamp le '${end.toISOString()}' and resourceGroupName eq '${resourceGroupName}'`;

      const response = await firstValueFrom(
        this.httpService.get<{ value: any[] }>(url, {
          headers: {
            Authorization: `Bearer ${tokenResponse.token}`,
          },
          params: {
            'api-version': '2015-04-01',
            $filter: filter,
          },
        }),
      );

      this.logger.log(
        `Fetched ${response.data.value.length} activity log events for resource group ${resourceGroupName}`,
      );
      return response.data.value;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch activity logs for resource group: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Fetch activity logs filtered by caller (user/service principal)
   */
  async getActivityLogsByCaller(
    subscriptionId: string,
    caller: string,
    startTime?: Date,
    endTime?: Date,
  ): Promise<any[]> {
    try {
      const start = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endTime || new Date();

      const url = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Insights/eventtypes/management/values`;
      const tokenResponse = await this.credential.getToken(
        'https://management.azure.com/.default',
      );

      const filter = `eventTimestamp ge '${start.toISOString()}' and eventTimestamp le '${end.toISOString()}' and caller eq '${caller}'`;

      const response = await firstValueFrom(
        this.httpService.get<{ value: any[] }>(url, {
          headers: {
            Authorization: `Bearer ${tokenResponse.token}`,
          },
          params: {
            'api-version': '2015-04-01',
            $filter: filter,
          },
        }),
      );

      this.logger.log(
        `Fetched ${response.data.value.length} activity log events for caller ${caller}`,
      );
      return response.data.value;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch activity logs by caller: ${error.message}`,
      );
      throw error;
    }
  }
}
