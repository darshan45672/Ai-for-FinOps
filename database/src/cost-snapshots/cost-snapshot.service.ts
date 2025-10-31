import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CostSnapshotService {
  private readonly logger = new Logger(CostSnapshotService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new cost snapshot
   */
  async createCostSnapshot(data: {
    userId: string;
    subscriptionId: string;
    date: Date;
    totalCost: number;
    serviceBreakdown: Record<string, number>;
    topResources: any[];
  }) {
    try {
      const snapshot = await this.prisma.costSnapshot.upsert({
        where: {
          subscriptionId_date: {
            subscriptionId: data.subscriptionId,
            date: new Date(data.date),
          },
        },
        update: {
          totalCost: data.totalCost,
          serviceBreakdown: data.serviceBreakdown as any,
          topResources: data.topResources as any,
        },
        create: {
          userId: data.userId,
          subscriptionId: data.subscriptionId,
          date: new Date(data.date),
          totalCost: data.totalCost,
          serviceBreakdown: data.serviceBreakdown as any,
          topResources: data.topResources as any,
        },
      });

      this.logger.log(
        `Cost snapshot saved for user ${data.userId}, subscription ${data.subscriptionId}, date ${data.date}`
      );

      return snapshot;
    } catch (error: any) {
      this.logger.error(`Failed to create cost snapshot: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get cost trends for a user over specified number of days
   */
  async getCostTrends(userId: string, days: number = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshots = await this.prisma.costSnapshot.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
        select: {
          date: true,
          totalCost: true,
          subscriptionId: true,
          serviceBreakdown: true,
        },
      });

      this.logger.log(`Retrieved ${snapshots.length} cost snapshots for user ${userId}`);

      return snapshots;
    } catch (error: any) {
      this.logger.error(`Failed to get cost trends: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all cost snapshots for a user
   */
  async getUserCostSnapshots(userId: string) {
    try {
      const snapshots = await this.prisma.costSnapshot.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      });

      return snapshots;
    } catch (error: any) {
      this.logger.error(`Failed to get user cost snapshots: ${error.message}`);
      throw error;
    }
  }
}
