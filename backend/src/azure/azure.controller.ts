import { Controller, Get, Post, Logger } from '@nestjs/common';
import { AzureSchedulerService } from './azure-scheduler.service';
import { AzureService } from './azure.service';

@Controller('azure')
export class AzureController {
  private readonly logger = new Logger(AzureController.name);

  constructor(
    private readonly azureSchedulerService: AzureSchedulerService,
    private readonly azureService: AzureService,
  ) {}

  /**
   * Manually trigger Azure resource sync
   */
  @Post('sync/resources')
  async triggerResourceSync() {
    this.logger.log('Manual resource sync triggered via API');
    return this.azureSchedulerService.triggerResourceSync();
  }

  /**
   * Manually trigger Azure cost sync
   */
  @Post('sync/costs')
  async triggerCostSync() {
    this.logger.log('Manual cost sync triggered via API');
    return this.azureSchedulerService.triggerCostSync();
  }

  /**
   * Get Azure configuration status
   */
  @Get('status')
  async getStatus() {
    return {
      configured: this.azureService.isConfigured(),
      message: this.azureService.isConfigured()
        ? 'Azure credentials configured successfully'
        : 'Azure credentials not configured',
    };
  }

  /**
   * Test Azure connection by fetching subscriptions
   */
  @Get('test-connection')
  async testConnection() {
    try {
      const subscriptions = await this.azureService.getSubscriptions();
      return {
        success: true,
        subscriptions: subscriptions.map((sub: any) => ({
          id: sub.subscriptionId,
          name: sub.displayName,
          state: sub.state,
        })),
      };
    } catch (error: any) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
