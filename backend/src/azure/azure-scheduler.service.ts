import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AzureService } from './azure.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { AxiosError } from 'axios';

interface AzureResourceData {
  id: string;
  name: string;
  type: string;
  location: string;
  resourceGroup: string;
  tags?: any;
  sku?: any;
  properties?: any;
}

interface AzureSubscriptionData {
  subscriptionId: string;
  displayName: string;
  state: string;
  tenantId: string;
}

@Injectable()
export class AzureSchedulerService {
  private readonly logger = new Logger(AzureSchedulerService.name);
  private readonly databaseServiceUrl: string;
  private isSyncing = false;

  constructor(
    private readonly azureService: AzureService,
    private readonly httpService: HttpService,
  ) {
    this.databaseServiceUrl = process.env.DATABASE_SERVICE_URL || 'http://localhost:3002';
  }

  /**
   * Sync Azure resources every hour
   * Cron expression: At minute 0 of every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncAzureResources() {
    if (!this.azureService.isConfigured()) {
      this.logger.warn('Azure credentials not configured. Skipping sync.');
      return;
    }

    if (this.isSyncing) {
      this.logger.warn('Sync already in progress. Skipping this run.');
      return;
    }

    this.isSyncing = true;
    const syncLogId = await this.createSyncLog('resources', 'in_progress');
    let totalResources = 0;

    try {
      this.logger.log('Starting Azure resources sync...');

      // Get all subscriptions
      const subscriptions = await this.azureService.getSubscriptions();
      this.logger.log(`Found ${subscriptions.length} subscriptions`);

      for (const subscription of subscriptions) {
        try {
          // Save or update subscription in database
          await this.saveSubscription({
            subscriptionId: subscription.subscriptionId,
            displayName: subscription.displayName,
            state: subscription.state,
            tenantId: subscription.tenantId,
          });

          // Fetch resources for this subscription
          const resources = await this.azureService.getResources(subscription.subscriptionId);
          this.logger.log(`Fetched ${resources.length} resources from subscription ${subscription.displayName}`);

          // Save resources to database
          for (const resource of resources) {
            await this.saveResource({
              resourceId: resource.id,
              name: resource.name,
              type: this.azureService.mapResourceType(resource.type),
              resourceType: resource.type,
              location: resource.location,
              resourceGroup: resource.resourceGroup,
              subscriptionId: subscription.subscriptionId,
              status: 'UNKNOWN',
              sku: resource.sku?.name || null,
              tags: resource.tags || null,
              properties: resource.properties || null,
            });
            totalResources++;
          }
        } catch (error: any) {
          this.logger.error(`Failed to sync subscription ${subscription.displayName}: ${error.message}`);
        }
      }

      await this.updateSyncLog(syncLogId, 'success', totalResources);
      this.logger.log(`Azure resources sync completed successfully. Total resources: ${totalResources}`);
    } catch (error: any) {
      await this.updateSyncLog(syncLogId, 'failed', totalResources, error.message);
      this.logger.error(`Azure resources sync failed: ${error.message}`);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync Azure cost data daily at midnight
   * Cron expression: At 00:00 every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncAzureCosts() {
    if (!this.azureService.isConfigured()) {
      this.logger.warn('Azure credentials not configured. Skipping cost sync.');
      return;
    }

    const syncLogId = await this.createSyncLog('costs', 'in_progress');
    let totalCostRecords = 0;

    try {
      this.logger.log('Starting Azure cost data sync...');

      // Get date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Get all subscriptions
      const subscriptions = await this.azureService.getSubscriptions();

      for (const subscription of subscriptions) {
        try {
          // Fetch cost data
          const costData: any = await this.azureService.getCostData(
            subscription.subscriptionId,
            startDate,
            endDate,
          );

          this.logger.log(`Fetched cost data for subscription ${subscription.displayName}`);
          this.logger.debug(`Cost data structure: ${JSON.stringify({ hasRows: !!costData?.rows, rowCount: costData?.rows?.length || 0 })}`);

          // Process and save cost records
          if (costData && costData.rows && costData.rows.length > 0) {
            this.logger.log(`Processing ${costData.rows.length} cost records`);
            
            for (const row of costData.rows) {
              await this.saveCostRecord({
                subscriptionId: subscription.subscriptionId,
                cost: row[0] || 0,
                usageStart: new Date(row[1]),
                usageEnd: new Date(row[2]),
                resourceGroup: row[3] || null,
                serviceName: row[4] || 'Unknown',
                currency: 'USD',
              });
              totalCostRecords++;
            }
          } else {
            this.logger.warn(`No cost data available for subscription ${subscription.displayName}. Cost data: ${JSON.stringify(costData)}`);
          }

          this.logger.log(`Synced cost data for subscription ${subscription.displayName}`);
        } catch (error: any) {
          this.logger.error(`Failed to sync costs for subscription ${subscription.displayName}: ${error.message}`);
        }
      }

      await this.updateSyncLog(syncLogId, 'success', totalCostRecords);
      this.logger.log(`Azure cost sync completed successfully. Total records: ${totalCostRecords}`);
    } catch (error: any) {
      await this.updateSyncLog(syncLogId, 'failed', totalCostRecords, error.message);
      this.logger.error(`Azure cost sync failed: ${error.message}`);
    }
  }

  /**
   * Sync Azure Activity Logs every 6 hours
   * Cron expression: At minute 0 past every 6th hour
   */
  @Cron('0 */6 * * *')
  async syncAzureActivityLogs() {
    if (!this.azureService.isConfigured()) {
      this.logger.warn('Azure credentials not configured. Skipping activity logs sync.');
      return;
    }

    const syncLogId = await this.createSyncLog('activity_logs', 'in_progress');
    let totalActivityLogs = 0;

    try {
      this.logger.log('Starting Azure activity logs sync...');

      // Get date range (last 6 hours to match cron schedule)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 6);

      // Get all subscriptions
      const subscriptions = await this.azureService.getSubscriptions();

      for (const subscription of subscriptions) {
        try {
          // Fetch activity logs
          const activityLogs = await this.azureService.getActivityLogs(
            subscription.subscriptionId,
            startDate,
            endDate,
          );

          this.logger.log(`Fetched ${activityLogs.length} activity logs from subscription ${subscription.displayName}`);

          // Save activity logs to database
          for (const log of activityLogs) {
            // Helper function to extract string value from Azure API response
            const extractValue = (field: any): string | null => {
              if (!field) return null;
              if (typeof field === 'string') return field;
              if (typeof field === 'object' && field.value) return String(field.value);
              if (typeof field === 'object') return JSON.stringify(field);
              return String(field);
            };

            await this.saveActivityLog({
              subscriptionId: subscription.subscriptionId,
              eventTimestamp: new Date(log.eventTimestamp),
              eventDataId: log.eventDataId,
              correlationId: extractValue(log.correlationId),
              operationName: extractValue(log.operationName) || 'Unknown',
              operationId: extractValue(log.operationId),
              level: extractValue(log.level) || 'Informational',
              status: extractValue(log.status),
              subStatus: extractValue(log.subStatus),
              caller: extractValue(log.caller),
              category: extractValue(log.category) || 'Administrative',
              resourceId: extractValue(log.resourceId),
              resourceGroupName: extractValue(log.resourceGroupName),
              resourceType: extractValue(log.resourceType),
              resourceProviderName: extractValue(log.resourceProviderName),
              eventName: extractValue(log.eventName),
              description: extractValue(log.description),
              httpRequest: log.httpRequest || null,
              authorization: log.authorization || null,
              claims: log.claims || null,
              properties: log.properties || null,
            });
            totalActivityLogs++;
          }
        } catch (error: any) {
          this.logger.error(`Failed to sync activity logs for subscription ${subscription.displayName}: ${error.message}`);
        }
      }

      await this.updateSyncLog(syncLogId, 'success', totalActivityLogs);
      this.logger.log(`Azure activity logs sync completed successfully. Total logs: ${totalActivityLogs}`);
    } catch (error: any) {
      await this.updateSyncLog(syncLogId, 'failed', totalActivityLogs, error.message);
      this.logger.error(`Azure activity logs sync failed: ${error.message}`);
    }
  }

  /**
   * Manual trigger for resource sync
   */
  async triggerResourceSync(): Promise<{ message: string }> {
    // Run sync in background
    this.syncAzureResources();
    return { message: 'Azure resource sync triggered' };
  }

  /**
   * Manual trigger for cost sync
   */
  async triggerCostSync(): Promise<{ message: string }> {
    // Run sync in background
    this.syncAzureCosts();
    return { message: 'Azure cost sync triggered' };
  }

  /**
   * Manual trigger for daily cost snapshot collection (NEW granular tracking)
   */
  async triggerCostSnapshotCollection(): Promise<{ message: string }> {
    // Run collection in background
    this.collectDailyCostSnapshots();
    return { message: 'Daily cost snapshot collection triggered' };
  }

  /**
   * Manual trigger for hourly cost metrics collection (NEW granular tracking)
   */
  async triggerCostMetricsCollection(): Promise<{ message: string }> {
    // Run collection in background
    this.collectHourlyCostMetrics();
    return { message: 'Hourly cost metrics collection triggered' };
  }

  /**
   * Manual trigger for activity logs sync
   */
  async triggerActivityLogsSync(): Promise<{ message: string }> {
    // Run sync in background
    this.syncAzureActivityLogs();
    return { message: 'Azure activity logs sync triggered' };
  }

  // Helper methods to interact with database service
  private async saveSubscription(data: AzureSubscriptionData) {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.databaseServiceUrl}/azure/subscriptions`, {
          subscriptions: [data],
        }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Failed to save subscription: ${error.message}`);
            if (error.response) {
              this.logger.error(`Response status: ${error.response.status}`);
              this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            this.logger.error(`Request data: ${JSON.stringify(data, null, 2)}`);
            return throwError(() => new Error(`Failed to save subscription: ${error.message}`));
          }),
        ),
      );
    } catch (error: any) {
      // Rethrow to prevent saving resources without subscription
      throw error;
    }
  }

  private async saveResource(data: any) {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.databaseServiceUrl}/azure/resources`, {
          resources: [data],
        }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Failed to save resource: ${error.message}`);
            if (error.response) {
              this.logger.error(`Response status: ${error.response.status}`);
              this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            this.logger.error(`Request data: ${JSON.stringify(data, null, 2)}`);
            return throwError(() => new Error(`Failed to save resource: ${error.message}`));
          }),
        ),
      );
    } catch (error: any) {
      // Error already logged in catchError
    }
  }

  private async saveCostRecord(data: any) {
    try {
      this.logger.debug(`Saving cost record to ${this.databaseServiceUrl}/azure/costs`, JSON.stringify(data, null, 2));
      
      const response = await firstValueFrom(
        this.httpService.post(`${this.databaseServiceUrl}/azure/costs`, {
          costRecords: [data],
        }),
      );
      
      this.logger.debug(`Cost record saved successfully. Response status: ${response.status}`);
    } catch (error: any) {
      this.logger.error(`Failed to save cost record: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      this.logger.error(`Request data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  private async saveActivityLog(data: any) {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.databaseServiceUrl}/azure/activity-logs`, {
          activityLogs: [data],
        }),
      );
    } catch (error: any) {
      this.logger.error(`Failed to save activity log: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      this.logger.error(`Request data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  private async createSyncLog(syncType: string, status: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ id: string }>(`${this.databaseServiceUrl}/azure/sync-logs`, {
          syncType,
          status,
        }),
      );
      return response.data.id;
    } catch (error: any) {
      this.logger.error(`Failed to create sync log: ${error.message}`);
      return '';
    }
  }

  private async updateSyncLog(id: string, status: string, recordsSync?: number, errorMessage?: string) {
    if (!id) return;
    
    try {
      await firstValueFrom(
        this.httpService.patch(`${this.databaseServiceUrl}/azure/sync-logs/${id}`, {
          status,
          recordsSync,
          errorMessage,
          completedAt: new Date(),
        }),
      );
    } catch (error: any) {
      this.logger.error(`Failed to update sync log: ${error.message}`);
    }
  }

  /**
   * Collect daily cost snapshots for all users with granular tracking
   * Cron expression: Every day at midnight UTC (00:00)
   * This provides historical cost data for AI context and detailed service/resource tracking
   */
  @Cron('0 0 * * *', {
    name: 'daily-cost-snapshot',
    timeZone: 'UTC',
  })
  async collectDailyCostSnapshots() {
    if (!this.azureService.isConfigured()) {
      this.logger.warn('Azure credentials not configured. Skipping cost snapshot.');
      return;
    }

    this.logger.log('Starting daily cost snapshot collection with granular tracking...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      // Get all users from database
      const usersResponse = await firstValueFrom(
        this.httpService.get(`${this.databaseServiceUrl}/users`),
      );
      const responseData = usersResponse.data;
      
      // Extract users array from response object
      const users = responseData.users || responseData;
      
      if (!Array.isArray(users)) {
        this.logger.error(`Expected users array but got: ${typeof users}. Data: ${JSON.stringify(responseData)}`);
        throw new Error(`Invalid users response: expected array, got ${typeof users}`);
      }
      
      this.logger.log(`Collecting cost snapshots for ${users.length} users`);

      // Get all subscriptions
      const subscriptions = await this.azureService.getSubscriptions();

      for (const user of users) {
        for (const subscription of subscriptions) {
          try {
            // Fetch cost data for yesterday (returns CSV format with detailed columns)
            const costResult = await this.azureService.getCostData(
              subscription.subscriptionId,
              yesterday,
              today,
            );

            // Parse CSV columns and rows
            const columns = costResult.columns || [];
            const rows = costResult.rows || [];
            
            this.logger.log(`Processing ${rows.length} cost detail records`);
            this.logger.debug(`Available columns: ${JSON.stringify(columns.map((c: any) => c.name || c))}`);
            
            // Find column indexes for efficient parsing
            const colIndexes = this.mapCsvColumns(columns);
            this.logger.debug(`Mapped column indexes: ${JSON.stringify(colIndexes)}`);
            
            // Aggregate costs by service and resource
            const serviceCosts = new Map<string, { cost: number; resourceGroup: string; region: string }>();
            const resourceBreakdowns = new Map<string, {
              resourceName: string;
              resourceGroup: string;
              resourceType: string;
              meterCategory: string;
              meterSubCategory: string;
              meterName: string;
              quantity: number;
              unitOfMeasure: string;
              unitPrice: number;
              cost: number;
              currency: string;
            }>();
            
            let totalCost = 0;
            const serviceBreakdown: Record<string, number> = {};
            const resourceCosts: Array<{name: string; cost: number}> = [];

            // Process each cost detail row from CSV
            rows.forEach((row: any[], rowIndex: number) => {
              try {
                const date = row[colIndexes.date] || yesterday.toISOString().split('T')[0];
                const resourceId = row[colIndexes.resourceId] || '';
                const resourceName = row[colIndexes.resourceName] || 'Unknown';
                const resourceType = row[colIndexes.resourceType] || 'Unknown';
                const resourceGroup = row[colIndexes.resourceGroup] || 'Unknown';
                const meterCategory = row[colIndexes.meterCategory] || 'Unknown';
                const meterSubCategory = row[colIndexes.meterSubCategory] || '';
                const meterName = row[colIndexes.meterName] || 'Unknown';
                const quantity = parseFloat(row[colIndexes.quantity]) || 0;
                const unitOfMeasure = row[colIndexes.unitOfMeasure] || '';
                const unitPrice = parseFloat(row[colIndexes.unitPrice]) || 0;
                const cost = parseFloat(row[colIndexes.cost]) || 0;
                const currency = row[colIndexes.currency] || 'USD';
                
                // Legacy API provides ServiceName directly
                const legacyServiceName = colIndexes.serviceName !== undefined ? row[colIndexes.serviceName] : null;
                
                // Log first row to debug column mapping
                if (rowIndex === 0) {
                  this.logger.debug(`First row data: ${JSON.stringify({
                    date, resourceId, resourceName, resourceType, resourceGroup,
                    meterCategory, meterName, quantity, cost, currency, legacyServiceName
                  })}`);
                }
                
                totalCost += cost;
                
                // Determine service name - use legacy ServiceName if available, otherwise map from resourceType
                let serviceName: string;
                let serviceType: string;
                
                if (legacyServiceName) {
                  // Use ServiceName from legacy API and map to our service types
                  serviceName = this.normalizeServiceName(legacyServiceName);
                  serviceType = this.mapLegacyServiceNameToType(legacyServiceName);
                } else {
                  // Modern API - use resource type mapping
                  serviceName = this.mapResourceTypeToService(resourceType, resourceName);
                  serviceType = this.mapResourceTypeToServiceType(resourceType);
                }
                
                // Aggregate by service (skip if unknown/other)
                if (serviceName && serviceType && serviceType !== 'OTHER') {
                  const serviceKey = `${serviceName}-${serviceType}`;
                  const existing = serviceCosts.get(serviceKey) || { cost: 0, resourceGroup, region: 'eastus' };
                  serviceCosts.set(serviceKey, {
                    cost: existing.cost + cost,
                    resourceGroup,
                    region: existing.region,
                  });
                  
                  serviceBreakdown[serviceName] = (serviceBreakdown[serviceName] || 0) + cost;
                }
                
                // Store resource breakdown (meter-level detail)
                const resourceKey = `${resourceId}-${meterName}`;
                resourceBreakdowns.set(resourceKey, {
                  resourceName,
                  resourceGroup,
                  resourceType,
                  meterCategory,
                  meterSubCategory,
                  meterName,
                  quantity,
                  unitOfMeasure,
                  unitPrice,
                  cost,
                  currency,
                });
                
                resourceCosts.push({ name: resourceGroup, cost });
              } catch (parseError: any) {
                this.logger.warn(`Failed to parse cost row: ${parseError.message}`);
              }
            });

            // Save granular service costs
            for (const [serviceKey, data] of serviceCosts.entries()) {
              const [serviceName, serviceType] = serviceKey.split('-');
              
              try {
                const payload = {
                  serviceName,
                  serviceType,
                  date: yesterday,
                  cost: data.cost,
                  currency: 'USD',
                  subscriptionId: subscription.subscriptionId,
                  resourceGroup: data.resourceGroup,
                  region: data.region,
                };
                
                // Log first service cost payload for debugging
                if (serviceCosts.size > 0 && Array.from(serviceCosts.keys())[0] === serviceKey) {
                  this.logger.debug(`First service cost payload: ${JSON.stringify(payload, null, 2)}`);
                }
                
                await this.saveServiceCost(payload);
                
                this.logger.debug(`Saved service cost for ${serviceName} (${serviceType}): $${data.cost.toFixed(4)}`);
              } catch (error: any) {
                this.logger.error(`Failed to save service cost for ${serviceName}: ${error.message}`);
              }
            }

            // Save resource breakdowns (limit to top 50 by cost to avoid overwhelming database)
            // Skip if using legacy API (no meter data available)
            const hasDetailedMeterData = resourceBreakdowns.size > 0 && 
              Array.from(resourceBreakdowns.values()).some(b => b.meterName !== 'Unknown' && b.resourceType !== 'Unknown');
            
            let breakdownsSaved = 0;
            if (hasDetailedMeterData) {
              const topBreakdowns = Array.from(resourceBreakdowns.values())
                .sort((a, b) => b.cost - a.cost)
                .slice(0, 50);
              
              for (const breakdown of topBreakdowns) {
                try {
                  await this.saveResourceCostBreakdown({
                    date: yesterday,
                    subscriptionId: subscription.subscriptionId,
                    ...breakdown,
                  });
                  
                  this.logger.debug(`Saved resource breakdown for ${breakdown.resourceName}: ${breakdown.meterName} = $${breakdown.cost.toFixed(4)}`);
                  breakdownsSaved++;
                } catch (error: any) {
                  this.logger.error(`Failed to save resource breakdown: ${error.message}`);
                }
              }
              
              this.logger.log(`Saved ${breakdownsSaved} resource breakdowns (modern API with meter data)`);
            } else {
              this.logger.warn(`Skipping resource breakdowns - legacy API does not provide meter-level data`);
            }

            // Get top 10 resources by cost for legacy snapshot
            const topResources = resourceCosts
              .sort((a, b) => b.cost - a.cost)
              .slice(0, 10)
              .map(item => ({
                name: item.name,
                cost: item.cost,
                type: 'ResourceGroup',
              }));

            // Save legacy cost snapshot for backward compatibility
            await this.saveCostSnapshot({
              userId: user.id,
              subscriptionId: subscription.subscriptionId,
              date: yesterday,
              totalCost,
              serviceBreakdown,
              topResources,
            });

            this.logger.log(
              `Saved cost snapshot for user ${user.username}, subscription ${subscription.displayName}: $${totalCost.toFixed(2)} (${serviceCosts.size} services, ${breakdownsSaved} resource breakdowns)`
            );
          } catch (error: any) {
            this.logger.error(
              `Failed to collect cost snapshot for user ${user.username}, subscription ${subscription.subscriptionId}: ${error.message}`
            );
          }
        }
      }

      this.logger.log('Daily cost snapshot collection completed');
    } catch (error: any) {
      this.logger.error(`Failed to collect daily cost snapshots: ${error.message}`);
    }
  }

  /**
   * Collect hourly cost metrics for real-time monitoring
   * Cron expression: Every hour at minute 0 (00:00, 01:00, 02:00, etc.)
   * This provides near real-time cost tracking for critical resources
   */
  @Cron('0 * * * *', {
    name: 'hourly-cost-metrics',
    timeZone: 'UTC',
  })
  async collectHourlyCostMetrics() {
    if (!this.azureService.isConfigured()) {
      this.logger.warn('Azure credentials not configured. Skipping hourly cost metrics.');
      return;
    }

    this.logger.log('Starting hourly cost metrics collection...');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    try {
      // Get all subscriptions
      const subscriptions = await this.azureService.getSubscriptions();

      for (const subscription of subscriptions) {
        try {
          // Fetch cost data for the past hour
          const costResult = await this.azureService.getCostData(
            subscription.subscriptionId,
            oneHourAgo,
            now,
          );

          const columns = costResult.columns || [];
          const rows = costResult.rows || [];
          
          this.logger.log(`Processing ${rows.length} hourly cost records for subscription ${subscription.displayName}`);
          
          if (rows.length === 0) {
            this.logger.warn(`No cost data available for the past hour. Azure may not have processed recent usage yet.`);
            continue;
          }
          
          const colIndexes = this.mapCsvColumns(columns);
          
          // Aggregate costs by service for the hour
          const serviceCosts = new Map<string, { cost: number; resourceGroup: string; region: string }>();

          rows.forEach((row: any[]) => {
            try {
              const resourceName = row[colIndexes.resourceName] || 'Unknown';
              const resourceType = row[colIndexes.resourceType] || 'Unknown';
              const resourceGroup = row[colIndexes.resourceGroup] || 'Unknown';
              const cost = parseFloat(row[colIndexes.cost]) || 0;
              
              // Legacy API provides ServiceName directly
              const legacyServiceName = colIndexes.serviceName !== undefined ? row[colIndexes.serviceName] : null;
              
              // Determine service name - use legacy ServiceName if available, otherwise map from resourceType
              let serviceName: string;
              let serviceType: string;
              
              if (legacyServiceName) {
                serviceName = this.normalizeServiceName(legacyServiceName);
                serviceType = this.mapLegacyServiceNameToType(legacyServiceName);
              } else {
                serviceName = this.mapResourceTypeToService(resourceType, resourceName);
                serviceType = this.mapResourceTypeToServiceType(resourceType);
              }
              
              if (serviceName && serviceType && serviceType !== 'OTHER') {
                const serviceKey = `${serviceName}-${serviceType}`;
                const existing = serviceCosts.get(serviceKey) || { cost: 0, resourceGroup, region: 'eastus' };
                serviceCosts.set(serviceKey, {
                  cost: existing.cost + cost,
                  resourceGroup,
                  region: existing.region,
                });
              }
            } catch (parseError: any) {
              this.logger.warn(`Failed to parse hourly cost row: ${parseError.message}`);
            }
          });

          // Save hourly service costs (these accumulate throughout the day)
          for (const [serviceKey, data] of serviceCosts.entries()) {
            const [serviceName, serviceType] = serviceKey.split('-');
            
            try {
              await this.saveServiceCost({
                serviceName,
                serviceType,
                date: new Date(now.toISOString().split('T')[0]), // Use current date (midnight UTC)
                cost: data.cost,
                currency: 'USD',
                subscriptionId: subscription.subscriptionId,
                resourceGroup: data.resourceGroup,
                region: data.region,
              });
              
              this.logger.debug(`Saved hourly service cost for ${serviceName}: $${data.cost.toFixed(4)}`);
            } catch (error: any) {
              this.logger.error(`Failed to save hourly service cost: ${error.message}`);
            }
          }

          this.logger.log(`Hourly cost metrics saved for subscription ${subscription.displayName}: ${serviceCosts.size} services`);
        } catch (error: any) {
          this.logger.error(
            `Failed to collect hourly metrics for subscription ${subscription.subscriptionId}: ${error.message}`
          );
        }
      }

      this.logger.log('Hourly cost metrics collection completed');
    } catch (error: any) {
      this.logger.error(`Failed to collect hourly cost metrics: ${error.message}`);
    }
  }

  /**
   * Map CSV column names to indexes for efficient parsing
   */
  private mapCsvColumns(columns: any[]): Record<string, number> {
    const indexes: Record<string, number> = {};
    
    columns.forEach((col, index) => {
      const colName = col.name?.toLowerCase() || col.toLowerCase() || '';
      
      if (colName.includes('date') || colName === 'usagedate') {
        indexes.date = index;
      } else if (colName.includes('resourceid')) {
        indexes.resourceId = index;
      } else if (colName.includes('resourcename')) {
        indexes.resourceName = index;
      } else if (colName.includes('resourcetype')) {
        indexes.resourceType = index;
      } else if (colName.includes('resourcegroup')) {
        indexes.resourceGroup = index;
      } else if (colName.includes('metercategory')) {
        indexes.meterCategory = index;
      } else if (colName.includes('metersubcategory')) {
        indexes.meterSubCategory = index;
      } else if (colName.includes('metername')) {
        indexes.meterName = index;
      } else if (colName.includes('quantity')) {
        indexes.quantity = index;
      } else if (colName.includes('unitofmeasure')) {
        indexes.unitOfMeasure = index;
      } else if (colName.includes('unitprice')) {
        indexes.unitPrice = index;
      } else if (colName.includes('cost') || colName.includes('pretaxcost')) {
        indexes.cost = index;
      } else if (colName.includes('currency')) {
        indexes.currency = index;
      } else if (colName === 'servicename' || colName.includes('service')) {
        indexes.serviceName = index; // Legacy API provides ServiceName column
      }
    });
    
    return indexes;
  }

  /**
   * Map Azure resource type to service name
   */
  private mapResourceTypeToService(resourceType: string, resourceName: string): string {
    const type = resourceType.toLowerCase();
    const name = resourceName.toLowerCase();
    
    // Container Apps (5 services)
    if (type.includes('containerapp') || type.includes('microsoft.app/containerapps')) {
      if (name.includes('frontend') || name.includes('ca-frontend')) return 'ca-frontend';
      if (name.includes('ai-service') || name.includes('ca-ai')) return 'ca-ai-service';
      if (name.includes('authentication') || name.includes('ca-auth')) return 'ca-authentication';
      if (name.includes('backend') || name.includes('ca-backend')) return 'ca-backend';
      if (name.includes('database') || name.includes('ca-database')) return 'ca-database';
      return 'container-apps';
    }
    
    // PostgreSQL Flexible Server
    if (type.includes('postgres') || type.includes('microsoft.dbforpostgresql')) {
      return 'psql-finops-prod';
    }
    
    // Redis Cache
    if (type.includes('redis') || type.includes('microsoft.cache')) {
      return 'redis-finops-prod';
    }
    
    // Application Gateway
    if (type.includes('applicationgateway') || type.includes('microsoft.network/applicationgateways')) {
      return 'app-gateway';
    }
    
    // Virtual Network
    if (type.includes('virtualnetwork') || type.includes('microsoft.network/virtualnetworks')) {
      return 'vnet';
    }
    
    // Storage Account
    if (type.includes('storageaccount') || type.includes('microsoft.storage')) {
      return 'storage';
    }
    
    // Log Analytics / Monitor
    if (type.includes('loganalytics') || type.includes('microsoft.operationalinsights')) {
      return 'log-analytics';
    }
    
    return 'other';
  }

  /**
   * Map Azure resource type to ServiceType enum
   */
  private mapResourceTypeToServiceType(resourceType: string): string {
    const type = resourceType.toLowerCase();
    
    if (type.includes('containerapp')) return 'CONTAINER_APP';
    if (type.includes('postgres')) return 'DATABASE';
    if (type.includes('redis')) return 'CACHE';
    if (type.includes('applicationgateway')) return 'LOAD_BALANCER';
    if (type.includes('virtualnetwork')) return 'NETWORK';
    if (type.includes('storage')) return 'STORAGE';
    if (type.includes('loganalytics') || type.includes('monitor')) return 'MONITORING';
    
    return 'OTHER';
  }

  /**
   * Save service cost to database via cost tracking API
   */
  private async saveServiceCost(data: {
    serviceName: string;
    serviceType: string;
    date: Date;
    cost: number;
    currency: string;
    subscriptionId: string;
    resourceGroup: string;
    region: string;
  }) {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.databaseServiceUrl}/cost-tracking/service-costs`,
          data,
          { timeout: 5000 }
        ),
      );
    } catch (error: any) {
      this.logger.error(`Failed to save service cost: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      this.logger.error(`Request data: ${JSON.stringify(data, null, 2)}`);
      throw error;
    }
  }

  /**
   * Save resource cost breakdown to database via cost tracking API
   */
  private async saveResourceCostBreakdown(data: {
    date: Date;
    subscriptionId: string;
    resourceName: string;
    resourceGroup: string;
    resourceType: string;
    meterCategory: string;
    meterSubCategory: string;
    meterName: string;
    quantity: number;
    unitOfMeasure: string;
    unitPrice: number;
    cost: number;
    currency: string;
  }) {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.databaseServiceUrl}/cost-tracking/resource-cost-breakdowns`,
          data,
          { timeout: 5000 }
        ),
      );
    } catch (error: any) {
      this.logger.error(`Failed to save resource breakdown: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      this.logger.error(`Request data: ${JSON.stringify(data, null, 2)}`);
      throw error;
    }
  }

  /**
   * Save cost snapshot to database
   */
  private async saveCostSnapshot(data: {
    userId: string;
    subscriptionId: string;
    date: Date;
    totalCost: number;
    serviceBreakdown: Record<string, number>;
    topResources: any[];
  }) {
    try {
      this.logger.debug(`Saving cost snapshot to ${this.databaseServiceUrl}/cost-snapshots`);
      this.logger.debug(`Snapshot data: ${JSON.stringify(data, null, 2)}`);
      
      const response = await firstValueFrom(
        this.httpService.post(`${this.databaseServiceUrl}/cost-snapshots`, data),
      );
      
      this.logger.log(`Cost snapshot saved successfully. Response status: ${response.status}`);
    } catch (error: any) {
      this.logger.error(`Failed to save cost snapshot: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      this.logger.error(`Request data: ${JSON.stringify(data, null, 2)}`);
      throw error;
    }
  }

  /**
   * Normalize legacy ServiceName to our standard service names
   */
  private normalizeServiceName(serviceName: string): string {
    const normalized = serviceName.toLowerCase().trim();
    
    // Map Azure service names to our standard names
    const mapping: Record<string, string> = {
      'virtual machines': 'Compute',
      'vm': 'Compute',
      'compute': 'Compute',
      'app service': 'App Service',
      'web apps': 'App Service',
      'storage': 'Storage',
      'blob storage': 'Storage',
      'cosmos db': 'Cosmos DB',
      'cosmosdb': 'Cosmos DB',
      'sql database': 'SQL Database',
      'azure sql': 'SQL Database',
      'functions': 'Functions',
      'azure functions': 'Functions',
      'cognitive services': 'AI Services',
      'openai': 'AI Services',
      'ai': 'AI Services',
      'networking': 'Networking',
      'virtual network': 'Networking',
      'load balancer': 'Networking',
      'container': 'Container',
      'kubernetes': 'Container',
      'aks': 'Container',
    };
    
    for (const [key, value] of Object.entries(mapping)) {
      if (normalized.includes(key)) {
        return value;
      }
    }
    
    // If no match, capitalize first letter of each word
    return serviceName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Map legacy ServiceName to our service type enum
   */
  private mapLegacyServiceNameToType(serviceName: string): string {
    const normalized = serviceName.toLowerCase().trim();
    
    if (normalized.includes('compute') || normalized.includes('virtual machine') || normalized.includes('vm')) {
      return 'COMPUTE';
    } else if (normalized.includes('storage') || normalized.includes('blob')) {
      return 'STORAGE';
    } else if (normalized.includes('database') || normalized.includes('sql') || normalized.includes('cosmos')) {
      return 'DATABASE';
    } else if (normalized.includes('function')) {
      return 'COMPUTE'; // Functions are compute workloads
    } else if (normalized.includes('app service') || normalized.includes('web')) {
      return 'COMPUTE'; // App Service is compute
    } else if (normalized.includes('network') || normalized.includes('load balancer')) {
      return 'NETWORKING';
    } else if (normalized.includes('container') || normalized.includes('kubernetes') || normalized.includes('aks')) {
      return 'CONTAINER';
    } else if (normalized.includes('ai') || normalized.includes('cognitive') || normalized.includes('openai')) {
      return 'AI_ML';
    }
    
    return 'OTHER';
  }
}
