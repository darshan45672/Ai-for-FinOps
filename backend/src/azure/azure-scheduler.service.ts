import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AzureService } from './azure.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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

          // Process and save cost records
          if (costData && costData.properties && costData.properties.rows) {
            for (const row of costData.properties.rows) {
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
        }),
      );
    } catch (error: any) {
      this.logger.error(`Failed to save subscription: ${error.message}`);
    }
  }

  private async saveResource(data: any) {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.databaseServiceUrl}/azure/resources`, {
          resources: [data],
        }),
      );
    } catch (error: any) {
      this.logger.error(`Failed to save resource: ${error.message}`);
    }
  }

  private async saveCostRecord(data: any) {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.databaseServiceUrl}/azure/costs`, {
          costRecords: [data],
        }),
      );
    } catch (error: any) {
      this.logger.error(`Failed to save cost record: ${error.message}`);
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
   * Collect daily cost snapshots for all users
   * Cron expression: Every day at midnight UTC (00:00)
   * This provides historical cost data for AI context
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

    this.logger.log('Starting daily cost snapshot collection...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      // Get all users from database
      const usersResponse = await firstValueFrom(
        this.httpService.get(`${this.databaseServiceUrl}/users`),
      );
      const users = usersResponse.data;
      this.logger.log(`Collecting cost snapshots for ${users.length} users`);

      // Get all subscriptions
      const subscriptions = await this.azureService.getSubscriptions();

      for (const user of users) {
        for (const subscription of subscriptions) {
          try {
            // Fetch cost data for yesterday
            const costResult = await this.azureService.getCostData(
              subscription.subscriptionId,
              yesterday,
              today,
            );

            // Extract rows from QueryResult
            const rows = costResult.rows || [];
            
            // Calculate total cost (PreTaxCost is typically in the first column)
            let totalCost = 0;
            const serviceBreakdown: Record<string, number> = {};
            const resourceCosts: Array<{name: string; cost: number}> = [];

            rows.forEach((row: any[]) => {
              // row format: [cost, resourceGroup, serviceName]
              const cost = parseFloat(row[0]) || 0;
              const resourceGroup = row[1] || 'Unknown';
              const serviceName = row[2] || 'Other';
              
              totalCost += cost;
              serviceBreakdown[serviceName] = (serviceBreakdown[serviceName] || 0) + cost;
              resourceCosts.push({ name: resourceGroup, cost });
            });

            // Get top 10 resources by cost
            const topResources = resourceCosts
              .sort((a, b) => b.cost - a.cost)
              .slice(0, 10)
              .map(item => ({
                name: item.name,
                cost: item.cost,
                type: 'ResourceGroup',
              }));

            // Save cost snapshot to database
            await this.saveCostSnapshot({
              userId: user.id,
              subscriptionId: subscription.subscriptionId,
              date: yesterday,
              totalCost,
              serviceBreakdown,
              topResources,
            });

            this.logger.log(
              `Saved cost snapshot for user ${user.username}, subscription ${subscription.displayName}: $${totalCost.toFixed(2)}`
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
      await firstValueFrom(
        this.httpService.post(`${this.databaseServiceUrl}/cost-snapshots`, data),
      );
    } catch (error: any) {
      this.logger.error(`Failed to save cost snapshot: ${error.message}`);
      throw error;
    }
  }
}
