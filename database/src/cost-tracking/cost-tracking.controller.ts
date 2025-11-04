import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CostTrackingService } from './cost-tracking.service';
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

@Controller('cost-tracking')
export class CostTrackingController {
  constructor(private readonly costTrackingService: CostTrackingService) {}

  // ==================== Service Cost Endpoints ====================

  @Post('service-costs')
  @HttpCode(HttpStatus.CREATED)
  async saveServiceCost(@Body() data: CreateServiceCostDto) {
    return this.costTrackingService.saveServiceCost(data);
  }

  @Get('service-costs')
  async getServiceCosts(@Query() filters: ServiceCostFiltersDto) {
    return this.costTrackingService.getServiceCosts(filters);
  }

  @Get('service-costs/:serviceName/trends')
  async getServiceCostTrends(
    @Param('serviceName') serviceName: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.costTrackingService.getServiceCostTrends(serviceName, numDays);
  }

  @Get('service-costs/summary')
  async getServiceCostSummary(
    @Query('subscriptionId') subscriptionId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.costTrackingService.getServiceCostSummary(
      subscriptionId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // ==================== AI Usage Cost Endpoints ====================

  @Post('ai-usage-costs')
  @HttpCode(HttpStatus.CREATED)
  async saveAiUsageCost(@Body() data: CreateAiUsageCostDto) {
    return this.costTrackingService.saveAiUsageCost(data);
  }

  @Get('ai-usage-costs')
  async getAiUsageCosts(@Query() filters: AiUsageCostFiltersDto) {
    return this.costTrackingService.getAiUsageCosts(filters);
  }

  @Get('ai-usage-costs/summary/:userId')
  async getUserAiCostSummary(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.costTrackingService.getUserAiCostSummary(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // ==================== User Cost Allocation Endpoints ====================

  @Post('user-cost-allocations')
  @HttpCode(HttpStatus.CREATED)
  async saveUserCostAllocation(@Body() data: CreateUserCostAllocationDto) {
    return this.costTrackingService.saveUserCostAllocation(data);
  }

  @Get('user-cost-allocations/:userId')
  async getUserCostAllocations(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subscriptionId') subscriptionId?: string,
  ) {
    return this.costTrackingService.getUserCostAllocations({
      userId,
      startDate,
      endDate,
      subscriptionId,
    });
  }

  @Post('user-cost-allocations/:userId/calculate')
  @HttpCode(HttpStatus.OK)
  async calculateUserDailyCosts(
    @Param('userId') userId: string,
    @Query('date') date?: string,
  ) {
    const calcDate = date ? new Date(date) : new Date();
    return this.costTrackingService.calculateUserDailyCosts(userId, calcDate);
  }

  // ==================== Resource Cost Breakdown Endpoints ====================

  @Post('resource-cost-breakdowns')
  @HttpCode(HttpStatus.CREATED)
  async saveResourceCostBreakdown(@Body() data: CreateResourceCostBreakdownDto) {
    return this.costTrackingService.saveResourceCostBreakdown(data);
  }

  @Get('resource-cost-breakdowns')
  async getResourceCostBreakdowns(@Query() filters: ResourceCostBreakdownFiltersDto) {
    return this.costTrackingService.getResourceCostBreakdowns(filters);
  }

  @Get('resource-cost-breakdowns/top')
  async getTopCostResources(
    @Query('subscriptionId') subscriptionId: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    return this.costTrackingService.getTopCostResources(
      subscriptionId,
      numLimit,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
