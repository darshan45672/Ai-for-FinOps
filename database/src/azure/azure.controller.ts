import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import type {
  CreateAzureSubscriptionDto,
  CreateAzureResourceDto,
  CreateAzureCostRecordDto,
  CreateAzureSyncLogDto,
} from './azure.service';
import {
  AzureService,
  AzureSyncType,
  AzureSyncStatus,
} from './azure.service';
import {
  AzureResourceType,
  AzureResourceStatus,
} from '@prisma/client';

@Controller('azure')
export class AzureController {
  constructor(private readonly azureService: AzureService) {}

  // Subscriptions
  @Post('subscriptions')
  async createOrUpdateSubscriptions(
    @Body() body: { subscriptions: CreateAzureSubscriptionDto[] }
  ) {
    return this.azureService.createOrUpdateSubscriptions(body.subscriptions);
  }

  @Get('subscriptions')
  async getSubscriptions() {
    return this.azureService.getSubscriptions();
  }

  @Get('subscriptions/:subscriptionId')
  async getSubscriptionById(@Param('subscriptionId') subscriptionId: string) {
    return this.azureService.getSubscriptionById(subscriptionId);
  }

  // Resources
  @Post('resources')
  async createOrUpdateResources(
    @Body() body: { resources: CreateAzureResourceDto[] }
  ) {
    return this.azureService.createOrUpdateResources(body.resources);
  }

  @Get('resources')
  async getResources(
    @Query('subscriptionId') subscriptionId?: string,
    @Query('resourceGroup') resourceGroup?: string,
    @Query('type') type?: AzureResourceType,
    @Query('location') location?: string,
    @Query('status') status?: AzureResourceStatus,
  ) {
    return this.azureService.getResources({
      subscriptionId,
      resourceGroup,
      type,
      location,
      status,
    });
  }

  @Get('resources/:resourceId')
  async getResourceById(@Param('resourceId') resourceId: string) {
    return this.azureService.getResourceById(resourceId);
  }

  // Cost Records
  @Post('costs')
  async createCostRecords(
    @Body() body: { costRecords: CreateAzureCostRecordDto[] }
  ) {
    return this.azureService.createCostRecords(body.costRecords);
  }

  @Get('costs')
  async getCostRecords(
    @Query('subscriptionId') subscriptionId?: string,
    @Query('resourceGroup') resourceGroup?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.azureService.getCostRecords({
      subscriptionId,
      resourceGroup,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('costs/summary')
  async getCostSummary(@Query('subscriptionId') subscriptionId?: string) {
    return this.azureService.getCostSummary(subscriptionId);
  }

  // Sync Logs
  @Post('sync-logs')
  async createSyncLog(@Body() body: CreateAzureSyncLogDto) {
    return this.azureService.createSyncLog(body);
  }

  @Patch('sync-logs/:id')
  async updateSyncLog(
    @Param('id') id: string,
    @Body() body: Partial<CreateAzureSyncLogDto>
  ) {
    return this.azureService.updateSyncLog(id, body);
  }

  @Get('sync-logs')
  async getSyncLogs(
    @Query('syncType') syncType?: AzureSyncType,
    @Query('status') status?: AzureSyncStatus,
    @Query('limit') limit?: string,
  ) {
    return this.azureService.getSyncLogs({
      syncType,
      status,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('sync-logs/latest/:syncType')
  async getLatestSyncLog(@Param('syncType') syncType: AzureSyncType) {
    return this.azureService.getLatestSyncLog(syncType);
  }

  // Statistics
  @Get('statistics')
  async getStatistics() {
    return this.azureService.getStatistics();
  }
}
