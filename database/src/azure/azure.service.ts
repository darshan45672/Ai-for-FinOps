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
  meterCategory?: string;
  quantity?: number;
  unitOfMeasure?: string;
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
