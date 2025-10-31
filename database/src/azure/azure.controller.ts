import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import type {
  CreateAzureSubscriptionDto,
  CreateAzureResourceDto,
  CreateAzureCostRecordDto,
  CreateAzureActivityLogDto,
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

  // Statistics - MUST come before parameterized routes to avoid conflicts
  @Get('resources/groups/count')
  async getResourceGroupsCount() {
    return this.azureService.getResourceGroupsCount();
  }

  @Get('resources/summary')
  async getResourcesSummary() {
    return this.azureService.getResourcesSummary();
  }

  @Get('resources/statistics')
  async getStatistics() {
    return this.azureService.getStatistics();
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

  // Activity Logs
  @Post('activity-logs')
  async createActivityLogs(
    @Body() body: { activityLogs: CreateAzureActivityLogDto[] }
  ) {
    return this.azureService.createActivityLogs(body.activityLogs);
  }

  @Get('activity-logs')
  async getActivityLogs(
    @Query('subscriptionId') subscriptionId?: string,
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('caller') caller?: string,
    @Query('resourceGroupName') resourceGroupName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.azureService.getActivityLogs({
      subscriptionId,
      category,
      level,
      caller,
      resourceGroupName,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('activity-logs/:id')
  async getActivityLogById(@Param('id') id: string) {
    return this.azureService.getActivityLogById(id);
  }

  @Get('activity-logs/operation/:operationName')
  async getActivityLogsByOperation(
    @Param('operationName') operationName: string,
    @Query('limit') limit?: string,
  ) {
    return this.azureService.getActivityLogsByOperationName(
      operationName,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('activity-logs-statistics')
  async getActivityLogStatistics(@Query('subscriptionId') subscriptionId?: string) {
    return this.azureService.getActivityLogStatistics(subscriptionId);
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
}
