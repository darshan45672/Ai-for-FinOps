import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CostSnapshotService } from './cost-snapshot.service';

@Controller('cost-snapshots')
export class CostSnapshotController {
  constructor(private readonly costSnapshotService: CostSnapshotService) {}

  /**
   * Create a cost snapshot
   * POST /cost-snapshots
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCostSnapshot(@Body() data: {
    userId: string;
    subscriptionId: string;
    date: Date;
    totalCost: number;
    serviceBreakdown: Record<string, number>;
    topResources: any[];
  }) {
    return this.costSnapshotService.createCostSnapshot(data);
  }

  /**
   * Get cost trends for a user
   * GET /cost-snapshots/:userId/trends?days=30
   */
  @Get(':userId/trends')
  async getCostTrends(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.costSnapshotService.getCostTrends(userId, numDays);
  }

  /**
   * Get all cost snapshots for a user
   * GET /cost-snapshots/:userId
   */
  @Get(':userId')
  async getUserCostSnapshots(@Param('userId') userId: string) {
    return this.costSnapshotService.getUserCostSnapshots(userId);
  }
}
