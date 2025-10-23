import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AzureResourceType,
  AzureResourceStatus,
} from '@prisma/client';

// Enums for sync logs
export enum AzureSyncType {
  resources = 'resources',
  costs = 'costs',
  activity_logs = 'activity_logs',
}

export enum AzureSyncStatus {
  in_progress = 'in_progress',
  success = 'success',
  failed = 'failed',
}

// DTOs
export interface CreateAzureSubscriptionDto {
  subscriptionId: string;
  displayName: string;
  tenantId: string;
  state: string;
}

export interface CreateAzureResourceDto {
  resourceId: string;
  name: string;
  type: AzureResourceType;
  resourceType: string; // Full Azure resource type
  location: string;
  resourceGroup: string;
  subscriptionId: string;
  sku?: string;
  tags?: any;
  properties?: any;
  status?: AzureResourceStatus;
}

export interface CreateAzureCostRecordDto {
  subscriptionId: string;
  resourceGroup?: string;
  resourceId?: string;
  serviceName: string;
  cost: number;
  currency: string;
  usageStart: Date;
  usageEnd: Date;
  quantity?: number;
  unitOfMeasure?: string;
  meterCategory?: string;
}

export interface CreateAzureActivityLogDto {
  subscriptionId: string;
  eventTimestamp: Date;
  eventDataId: string;
  correlationId?: string;
  operationName: string;
  operationId?: string;
  level: string;
  status?: string;
  subStatus?: string;
  caller?: string;
  category: string;
  resourceId?: string;
  resourceGroupName?: string;
  resourceType?: string;
  resourceProviderName?: string;
  eventName?: string;
  description?: string;
  httpRequest?: any;
  authorization?: any;
  claims?: any;
  properties?: any;
}

export interface CreateAzureSyncLogDto {
  syncType: AzureSyncType;
  status: AzureSyncStatus;
  recordsSync?: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class AzureService {
  constructor(private readonly prisma: PrismaService) {}

  // Azure Subscriptions
  async createOrUpdateSubscription(data: CreateAzureSubscriptionDto) {
    return this.prisma.azureSubscription.upsert({
      where: { subscriptionId: data.subscriptionId },
      create: {
        subscriptionId: data.subscriptionId,
        displayName: data.displayName,
        tenantId: data.tenantId,
        state: data.state,
      },
      update: {
        displayName: data.displayName,
        state: data.state,
      },
    });
  }

  async createOrUpdateSubscriptions(subscriptions: CreateAzureSubscriptionDto[]) {
    const results = await Promise.all(
      subscriptions.map((sub) => this.createOrUpdateSubscription(sub))
    );
    return { count: results.length, subscriptions: results };
  }

  async getSubscriptions() {
    return this.prisma.azureSubscription.findMany({
      orderBy: { displayName: 'asc' },
    });
  }

  async getSubscriptionById(subscriptionId: string) {
    return this.prisma.azureSubscription.findUnique({
      where: { subscriptionId },
      include: {
        resources: {
          orderBy: { name: 'asc' },
          take: 100,
        },
        costRecords: {
          orderBy: { usageStart: 'desc' },
          take: 50,
        },
      },
    });
  }

  // Azure Resources
  async createOrUpdateResource(data: CreateAzureResourceDto) {
    return this.prisma.azureResource.upsert({
      where: { resourceId: data.resourceId },
      create: {
        resourceId: data.resourceId,
        name: data.name,
        type: data.type,
        resourceType: data.resourceType,
        location: data.location,
        resourceGroup: data.resourceGroup,
        subscriptionId: data.subscriptionId,
        sku: data.sku,
        tags: data.tags || {},
        properties: data.properties || {},
        status: data.status || AzureResourceStatus.RUNNING,
      },
      update: {
        name: data.name,
        type: data.type,
        resourceType: data.resourceType,
        location: data.location,
        resourceGroup: data.resourceGroup,
        sku: data.sku,
        tags: data.tags || {},
        properties: data.properties || {},
        status: data.status || AzureResourceStatus.RUNNING,
        lastSyncedAt: new Date(),
      },
    });
  }

  async createOrUpdateResources(resources: CreateAzureResourceDto[]) {
    const results = await Promise.all(
      resources.map((resource) => this.createOrUpdateResource(resource))
    );
    return { count: results.length, resources: results };
  }

  async getResources(filters?: {
    subscriptionId?: string;
    resourceGroup?: string;
    type?: AzureResourceType;
    location?: string;
    status?: AzureResourceStatus;
  }) {
    return this.prisma.azureResource.findMany({
      where: {
        ...(filters?.subscriptionId && { subscriptionId: filters.subscriptionId }),
        ...(filters?.resourceGroup && { resourceGroup: filters.resourceGroup }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.location && { location: filters.location }),
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async getResourceById(resourceId: string) {
    return this.prisma.azureResource.findUnique({
      where: { resourceId },
      include: {
        subscription: true,
      },
    });
  }

  // Azure Cost Records
  async createCostRecord(data: CreateAzureCostRecordDto) {
    return this.prisma.azureCostRecord.create({
      data: {
        subscriptionId: data.subscriptionId,
        resourceGroup: data.resourceGroup,
        resourceId: data.resourceId,
        serviceName: data.serviceName,
        cost: data.cost,
        currency: data.currency,
        usageStart: data.usageStart,
        usageEnd: data.usageEnd,
        meterCategory: data.meterCategory,
        quantity: data.quantity,
        unitOfMeasure: data.unitOfMeasure,
      },
    });
  }

  async createCostRecords(costRecords: CreateAzureCostRecordDto[]) {
    const results = await Promise.all(
      costRecords.map((record) => this.createCostRecord(record))
    );
    return { count: results.length, costRecords: results };
  }

  async getCostRecords(filters?: {
    subscriptionId?: string;
    resourceGroup?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.prisma.azureCostRecord.findMany({
      where: {
        ...(filters?.subscriptionId && { subscriptionId: filters.subscriptionId }),
        ...(filters?.resourceGroup && { resourceGroup: filters.resourceGroup }),
        ...(filters?.startDate && {
          usageStart: { gte: filters.startDate },
        }),
        ...(filters?.endDate && {
          usageEnd: { lte: filters.endDate },
        }),
      },
      orderBy: { usageStart: 'desc' },
    });
  }

  async getCostSummary(subscriptionId?: string) {
    const where = subscriptionId ? { subscriptionId } : {};
    
    const totalCost = await this.prisma.azureCostRecord.aggregate({
      where,
      _sum: { cost: true },
    });

    const costByService = await this.prisma.azureCostRecord.groupBy({
      by: ['serviceName'],
      where,
      _sum: { cost: true },
      orderBy: { _sum: { cost: 'desc' } },
      take: 10,
    });

    const costByResourceGroup = await this.prisma.azureCostRecord.groupBy({
      by: ['resourceGroup'],
      where,
      _sum: { cost: true },
      orderBy: { _sum: { cost: 'desc' } },
      take: 10,
    });

    return {
      totalCost: totalCost._sum.cost || 0,
      costByService,
      costByResourceGroup,
    };
  }

  // Azure Activity Logs
  async createActivityLog(data: CreateAzureActivityLogDto) {
    return this.prisma.azureActivityLog.create({
      data: {
        subscriptionId: data.subscriptionId,
        eventTimestamp: data.eventTimestamp,
        eventDataId: data.eventDataId,
        correlationId: data.correlationId,
        operationName: data.operationName,
        operationId: data.operationId,
        level: data.level,
        status: data.status,
        subStatus: data.subStatus,
        caller: data.caller,
        category: data.category,
        resourceId: data.resourceId,
        resourceGroupName: data.resourceGroupName,
        resourceType: data.resourceType,
        resourceProviderName: data.resourceProviderName,
        eventName: data.eventName,
        description: data.description,
        httpRequest: data.httpRequest,
        authorization: data.authorization,
        claims: data.claims,
        properties: data.properties,
      },
    });
  }

  async createActivityLogs(activityLogs: CreateAzureActivityLogDto[]) {
    const results = await Promise.all(
      activityLogs.map((log) => {
        // Use upsert to avoid duplicate eventDataId errors
        return this.prisma.azureActivityLog.upsert({
          where: { eventDataId: log.eventDataId },
          create: {
            subscriptionId: log.subscriptionId,
            eventTimestamp: log.eventTimestamp,
            eventDataId: log.eventDataId,
            correlationId: log.correlationId,
            operationName: log.operationName,
            operationId: log.operationId,
            level: log.level,
            status: log.status,
            subStatus: log.subStatus,
            caller: log.caller,
            category: log.category,
            resourceId: log.resourceId,
            resourceGroupName: log.resourceGroupName,
            resourceType: log.resourceType,
            resourceProviderName: log.resourceProviderName,
            eventName: log.eventName,
            description: log.description,
            httpRequest: log.httpRequest,
            authorization: log.authorization,
            claims: log.claims,
            properties: log.properties,
          },
          update: {
            eventTimestamp: log.eventTimestamp,
            correlationId: log.correlationId,
            operationName: log.operationName,
            operationId: log.operationId,
            level: log.level,
            status: log.status,
            subStatus: log.subStatus,
            caller: log.caller,
            category: log.category,
            resourceId: log.resourceId,
            resourceGroupName: log.resourceGroupName,
            resourceType: log.resourceType,
            resourceProviderName: log.resourceProviderName,
            eventName: log.eventName,
            description: log.description,
            httpRequest: log.httpRequest,
            authorization: log.authorization,
            claims: log.claims,
            properties: log.properties,
          },
        });
      })
    );
    return { count: results.length, activityLogs: results };
  }

  async getActivityLogs(filters?: {
    subscriptionId?: string;
    category?: string;
    level?: string;
    caller?: string;
    resourceGroupName?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return this.prisma.azureActivityLog.findMany({
      where: {
        ...(filters?.subscriptionId && { subscriptionId: filters.subscriptionId }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.level && { level: filters.level }),
        ...(filters?.caller && { caller: filters.caller }),
        ...(filters?.resourceGroupName && { resourceGroupName: filters.resourceGroupName }),
        ...(filters?.startDate && {
          eventTimestamp: { gte: filters.startDate },
        }),
        ...(filters?.endDate && {
          eventTimestamp: { lte: filters.endDate },
        }),
      },
      orderBy: { eventTimestamp: 'desc' },
      take: filters?.limit || 100,
    });
  }

  async getActivityLogById(id: string) {
    return this.prisma.azureActivityLog.findUnique({
      where: { id },
    });
  }

  async getActivityLogsByOperationName(operationName: string, limit = 50) {
    return this.prisma.azureActivityLog.findMany({
      where: { operationName: { contains: operationName } },
      orderBy: { eventTimestamp: 'desc' },
      take: limit,
    });
  }

  async getActivityLogStatistics(subscriptionId?: string) {
    const where = subscriptionId ? { subscriptionId } : {};
    
    const totalLogs = await this.prisma.azureActivityLog.count({ where });
    
    const logsByCategory = await this.prisma.azureActivityLog.groupBy({
      by: ['category'],
      where,
      _count: true,
      orderBy: { _count: { category: 'desc' } },
    });

    const logsByLevel = await this.prisma.azureActivityLog.groupBy({
      by: ['level'],
      where,
      _count: true,
      orderBy: { _count: { level: 'desc' } },
    });

    const logsByCaller = await this.prisma.azureActivityLog.groupBy({
      by: ['caller'],
      where,
      _count: true,
      orderBy: { _count: { caller: 'desc' } },
      take: 10,
    });

    return {
      totalLogs,
      logsByCategory,
      logsByLevel,
      topCallers: logsByCaller,
    };
  }

  // Azure Sync Logs
  async createSyncLog(data: CreateAzureSyncLogDto) {
    return this.prisma.azureSyncLog.create({
      data: {
        syncType: data.syncType.toString(),
        status: data.status.toString(),
        recordsSync: data.recordsSync,
        errorMessage: data.errorMessage,
        startedAt: data.startedAt || new Date(),
        completedAt: data.completedAt,
      },
    });
  }

  async updateSyncLog(id: string, data: Partial<CreateAzureSyncLogDto>) {
    return this.prisma.azureSyncLog.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status.toString() }),
        ...(data.recordsSync !== undefined && { recordsSync: data.recordsSync }),
        ...(data.errorMessage && { errorMessage: data.errorMessage }),
        ...(data.completedAt && { completedAt: data.completedAt }),
      },
    });
  }

  async getSyncLogs(filters?: {
    syncType?: AzureSyncType;
    status?: AzureSyncStatus;
    limit?: number;
  }) {
    return this.prisma.azureSyncLog.findMany({
      where: {
        ...(filters?.syncType && { syncType: filters.syncType.toString() }),
        ...(filters?.status && { status: filters.status.toString() }),
      },
      orderBy: { startedAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  async getLatestSyncLog(syncType: AzureSyncType) {
    return this.prisma.azureSyncLog.findFirst({
      where: { syncType: syncType.toString() },
      orderBy: { startedAt: 'desc' },
    });
  }

  // Statistics
  async getStatistics() {
    const [subscriptionCount, resourceCount, totalCost, latestResourceSync, latestCostSync] = await Promise.all([
      this.prisma.azureSubscription.count(),
      this.prisma.azureResource.count(),
      this.prisma.azureCostRecord.aggregate({
        _sum: { cost: true },
      }),
      this.getLatestSyncLog(AzureSyncType.resources),
      this.getLatestSyncLog(AzureSyncType.costs),
    ]);

    const resourcesByType = await this.prisma.azureResource.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
      take: 10,
    });

    const resourcesByLocation = await this.prisma.azureResource.groupBy({
      by: ['location'],
      _count: { location: true },
      orderBy: { _count: { location: 'desc' } },
      take: 10,
    });

    return {
      subscriptionCount,
      resourceCount,
      totalCost: totalCost._sum.cost || 0,
      latestResourceSync,
      latestCostSync,
      resourcesByType,
      resourcesByLocation,
    };
  }
}
