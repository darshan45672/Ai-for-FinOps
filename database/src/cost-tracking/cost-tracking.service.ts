import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateServiceCostDto,
  ServiceCostFiltersDto,
  CreateAiUsageCostDto,
  AiUsageCostFiltersDto,
  CreateUserCostAllocationDto,
  UserCostAllocationFiltersDto,
  CreateResourceCostBreakdownDto,
  ResourceCostBreakdownFiltersDto,
} from './cost-tracking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CostTrackingService {
  private readonly logger = new Logger(CostTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Service Cost Methods ====================

  /**
   * Save or update service cost record
   */
  async saveServiceCost(data: CreateServiceCostDto) {
    try {
      const dateObj = new Date(data.date);
      
      const record = await this.prisma.serviceCostRecord.upsert({
        where: {
          subscriptionId_serviceName_date: {
            subscriptionId: data.subscriptionId,
            serviceName: data.serviceName,
            date: dateObj,
          },
        },
        create: {
          subscriptionId: data.subscriptionId,
          serviceName: data.serviceName,
          serviceType: data.serviceType,
          resourceId: data.resourceId,
          date: dateObj,
          cost: new Prisma.Decimal(data.cost),
          currency: data.currency || 'USD',
          meterCategory: data.meterCategory,
          meterName: data.meterName,
          quantity: data.quantity ? new Prisma.Decimal(data.quantity) : null,
          unitOfMeasure: data.unitOfMeasure,
          unitPrice: data.unitPrice ? new Prisma.Decimal(data.unitPrice) : null,
          tags: data.tags || {},
          region: data.region,
          resourceGroup: data.resourceGroup,
        },
        update: {
          cost: new Prisma.Decimal(data.cost),
          meterCategory: data.meterCategory,
          meterName: data.meterName,
          quantity: data.quantity ? new Prisma.Decimal(data.quantity) : null,
          unitOfMeasure: data.unitOfMeasure,
          unitPrice: data.unitPrice ? new Prisma.Decimal(data.unitPrice) : null,
          tags: data.tags || {},
          region: data.region,
          resourceGroup: data.resourceGroup,
        },
      });

      this.logger.log(`Service cost saved: ${data.serviceName} on ${data.date} = $${data.cost}`);
      return record;
    } catch (error: any) {
      this.logger.error(`Failed to save service cost: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get service costs with filters
   */
  async getServiceCosts(filters: ServiceCostFiltersDto) {
    const where: any = {};

    if (filters.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }

    if (filters.serviceName) {
      where.serviceName = filters.serviceName;
    }

    if (filters.serviceType) {
      where.serviceType = filters.serviceType;
    }

    if (filters.resourceGroup) {
      where.resourceGroup = filters.resourceGroup;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.serviceCostRecord.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Get cost trends for a specific service
   */
  async getServiceCostTrends(serviceName: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.prisma.serviceCostRecord.findMany({
      where: {
        serviceName,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        cost: true,
        currency: true,
        quantity: true,
        unitOfMeasure: true,
      },
    });

    // Calculate trend statistics
    const costs = records.map(r => parseFloat(r.cost.toString()));
    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
    const avgCost = costs.length > 0 ? totalCost / costs.length : 0;
    const maxCost = costs.length > 0 ? Math.max(...costs) : 0;
    const minCost = costs.length > 0 ? Math.min(...costs) : 0;

    return {
      serviceName,
      days,
      records,
      statistics: {
        totalCost,
        avgCost,
        maxCost,
        minCost,
        recordCount: records.length,
      },
    };
  }

  /**
   * Get service cost summary (aggregated by service)
   */
  async getServiceCostSummary(subscriptionId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (subscriptionId) {
      where.subscriptionId = subscriptionId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const records = await this.prisma.serviceCostRecord.findMany({
      where,
      select: {
        serviceName: true,
        serviceType: true,
        cost: true,
      },
    });

    // Group by service
    const summary = records.reduce((acc: any, record) => {
      if (!acc[record.serviceName]) {
        acc[record.serviceName] = {
          serviceName: record.serviceName,
          serviceType: record.serviceType,
          totalCost: 0,
          recordCount: 0,
        };
      }
      acc[record.serviceName].totalCost += parseFloat(record.cost.toString());
      acc[record.serviceName].recordCount += 1;
      return acc;
    }, {});

    return Object.values(summary);
  }

  // ==================== AI Usage Cost Methods ====================

  /**
   * Save AI usage cost record
   */
  async saveAiUsageCost(data: CreateAiUsageCostDto) {
    try {
      const record = await this.prisma.aiUsageCost.create({
        data: {
          conversationId: data.conversationId,
          messageId: data.messageId,
          userId: data.userId,
          aiProvider: data.aiProvider,
          modelName: data.modelName,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.totalTokens,
          estimatedCost: new Prisma.Decimal(data.estimatedCost),
          currency: data.currency || 'USD',
          promptTokenPrice: data.promptTokenPrice ? new Prisma.Decimal(data.promptTokenPrice) : null,
          completionTokenPrice: data.completionTokenPrice ? new Prisma.Decimal(data.completionTokenPrice) : null,
          toolsUsed: data.toolsUsed || [],
          responseTime: data.responseTime,
          wasSuccessful: data.wasSuccessful ?? true,
          errorMessage: data.errorMessage,
          date: new Date(),
        },
      });

      this.logger.log(`AI usage cost saved: ${data.modelName} - ${data.totalTokens} tokens = $${data.estimatedCost}`);
      return record;
    } catch (error: any) {
      this.logger.error(`Failed to save AI usage cost: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get AI usage costs with filters
   */
  async getAiUsageCosts(filters: AiUsageCostFiltersDto) {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.conversationId) {
      where.conversationId = filters.conversationId;
    }

    if (filters.aiProvider) {
      where.aiProvider = filters.aiProvider;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.timestamp.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.aiUsageCost.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get AI cost summary for a user
   */
  async getUserAiCostSummary(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const records = await this.prisma.aiUsageCost.findMany({
      where,
      select: {
        aiProvider: true,
        modelName: true,
        totalTokens: true,
        estimatedCost: true,
        wasSuccessful: true,
      },
    });

    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCost = records.reduce((sum, r) => sum + parseFloat(r.estimatedCost.toString()), 0);
    const successfulRequests = records.filter(r => r.wasSuccessful).length;
    const failedRequests = records.filter(r => !r.wasSuccessful).length;

    // Group by model
    const byModel = records.reduce((acc: any, record) => {
      const key = `${record.aiProvider}:${record.modelName}`;
      if (!acc[key]) {
        acc[key] = {
          aiProvider: record.aiProvider,
          modelName: record.modelName,
          totalTokens: 0,
          totalCost: 0,
          requestCount: 0,
        };
      }
      acc[key].totalTokens += record.totalTokens;
      acc[key].totalCost += parseFloat(record.estimatedCost.toString());
      acc[key].requestCount += 1;
      return acc;
    }, {});

    return {
      userId,
      period: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
      summary: {
        totalTokens,
        totalCost,
        totalRequests: records.length,
        successfulRequests,
        failedRequests,
      },
      byModel: Object.values(byModel),
    };
  }

  // ==================== User Cost Allocation Methods ====================

  /**
   * Save user cost allocation
   */
  async saveUserCostAllocation(data: CreateUserCostAllocationDto) {
    try {
      const dateObj = new Date(data.date);

      const record = await this.prisma.userCostAllocation.upsert({
        where: {
          userId_date: {
            userId: data.userId,
            date: dateObj,
          },
        },
        create: {
          userId: data.userId,
          subscriptionId: data.subscriptionId,
          date: dateObj,
          azureServiceCosts: new Prisma.Decimal(data.azureServiceCosts),
          aiApiCosts: new Prisma.Decimal(data.aiApiCosts),
          totalCost: new Prisma.Decimal(data.totalCost),
          currency: data.currency || 'USD',
          costBreakdown: data.costBreakdown || {},
          resourceUsage: data.resourceUsage || {},
        },
        update: {
          azureServiceCosts: new Prisma.Decimal(data.azureServiceCosts),
          aiApiCosts: new Prisma.Decimal(data.aiApiCosts),
          totalCost: new Prisma.Decimal(data.totalCost),
          costBreakdown: data.costBreakdown || {},
          resourceUsage: data.resourceUsage || {},
        },
      });

      this.logger.log(`User cost allocation saved: ${data.userId} on ${data.date} = $${data.totalCost}`);
      return record;
    } catch (error: any) {
      this.logger.error(`Failed to save user cost allocation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user cost allocations
   */
  async getUserCostAllocations(filters: UserCostAllocationFiltersDto) {
    const where: any = {
      userId: filters.userId,
    };

    if (filters.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.userCostAllocation.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Calculate user daily costs (aggregate from AI and service costs)
   */
  async calculateUserDailyCosts(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get AI costs for the day
    const aiCosts = await this.prisma.aiUsageCost.findMany({
      where: {
        userId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        estimatedCost: true,
        aiProvider: true,
        modelName: true,
      },
    });

    const aiApiCosts = aiCosts.reduce((sum, cost) => sum + parseFloat(cost.estimatedCost.toString()), 0);

    // For Azure service costs, we would need user-specific resource tracking
    // For now, we'll just calculate AI costs
    const azureServiceCosts = 0; // TODO: Implement user-specific Azure cost allocation

    const totalCost = azureServiceCosts + aiApiCosts;

    // Build cost breakdown
    const costBreakdown: any = {
      ai_total: aiApiCosts,
      azure_total: azureServiceCosts,
    };

    // Group AI costs by provider and model
    aiCosts.forEach(cost => {
      const key = `ai_${cost.aiProvider}_${cost.modelName}`;
      if (!costBreakdown[key]) {
        costBreakdown[key] = 0;
      }
      costBreakdown[key] += parseFloat(cost.estimatedCost.toString());
    });

    // Build resource usage metrics
    const resourceUsage = {
      ai_request_count: aiCosts.length,
      // TODO: Add more usage metrics
    };

    // Save allocation
    return this.saveUserCostAllocation({
      userId,
      date: startOfDay.toISOString(),
      azureServiceCosts,
      aiApiCosts,
      totalCost,
      costBreakdown,
      resourceUsage,
    });
  }

  // ==================== Resource Cost Breakdown Methods ====================

  /**
   * Save resource cost breakdown
   */
  async saveResourceCostBreakdown(data: CreateResourceCostBreakdownDto) {
    try {
      const dateObj = new Date(data.date);

      // Since resourceId is optional and we removed the unique constraint,
      // we'll just create records instead of upserting
      const record = await this.prisma.resourceCostBreakdown.create({
        data: {
          subscriptionId: data.subscriptionId,
          resourceId: data.resourceId || null,
          resourceName: data.resourceName,
          resourceType: data.resourceType,
          resourceGroup: data.resourceGroup,
          date: dateObj,
          meterCategory: data.meterCategory,
          meterSubCategory: data.meterSubCategory,
          meterName: data.meterName,
          meterId: data.meterId,
          quantity: new Prisma.Decimal(data.quantity),
          unitOfMeasure: data.unitOfMeasure,
          unitPrice: new Prisma.Decimal(data.unitPrice),
          cost: new Prisma.Decimal(data.cost),
          currency: data.currency || 'USD',
          pricingModel: data.pricingModel,
          chargeType: data.chargeType,
          tags: data.tags || {},
          region: data.region,
          availabilityZone: data.availabilityZone,
        },
      });

      this.logger.debug(`Resource cost breakdown saved: ${data.resourceName} - ${data.meterName}`);
      return record;
    } catch (error: any) {
      this.logger.error(`Failed to save resource cost breakdown: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get resource cost breakdowns with filters
   */
  async getResourceCostBreakdowns(filters: ResourceCostBreakdownFiltersDto) {
    const where: any = {};

    if (filters.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }

    if (filters.resourceId) {
      where.resourceId = filters.resourceId;
    }

    if (filters.resourceGroup) {
      where.resourceGroup = filters.resourceGroup;
    }

    if (filters.meterCategory) {
      where.meterCategory = filters.meterCategory;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.resourceCostBreakdown.findMany({
      where,
      orderBy: [{ date: 'desc' }, { cost: 'desc' }],
    });
  }

  /**
   * Get top cost resources
   */
  async getTopCostResources(subscriptionId: string, limit: number = 10, startDate?: Date, endDate?: Date) {
    const where: any = { subscriptionId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const records = await this.prisma.resourceCostBreakdown.findMany({
      where,
      select: {
        resourceId: true,
        resourceName: true,
        resourceType: true,
        resourceGroup: true,
        cost: true,
        meterCategory: true,
      },
    });

    // Aggregate by resource (use resourceGroup if resourceId is null)
    const resourceCosts = records.reduce((acc: any, record) => {
      const key = record.resourceId || record.resourceGroup || 'Unknown';
      if (!acc[key]) {
        acc[key] = {
          resourceId: record.resourceId,
          resourceName: record.resourceName,
          resourceType: record.resourceType,
          resourceGroup: record.resourceGroup,
          totalCost: 0,
          meterCategories: new Set(),
        };
      }
      acc[key].totalCost += parseFloat(record.cost.toString());
      acc[key].meterCategories.add(record.meterCategory);
      return acc;
    }, {});

    // Convert to array and sort by cost
    const sorted = Object.values(resourceCosts)
      .map((r: any) => ({
        ...r,
        meterCategories: Array.from(r.meterCategories),
      }))
      .sort((a: any, b: any) => b.totalCost - a.totalCost)
      .slice(0, limit);

    return sorted;
  }
}
