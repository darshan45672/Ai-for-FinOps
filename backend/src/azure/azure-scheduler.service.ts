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
}
