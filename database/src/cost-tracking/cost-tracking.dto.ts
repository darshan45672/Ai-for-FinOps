import { IsString, IsOptional, IsNumber, IsDateString, IsObject, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// Service Cost DTOs
export class CreateServiceCostDto {
  @IsString()
  subscriptionId: string;

  @IsString()
  serviceName: string;

  @IsString()
  serviceType: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  cost: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsOptional()
  @IsString()
  meterCategory?: string;

  @IsOptional()
  @IsString()
  meterName?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unitOfMeasure?: string;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsObject()
  tags?: any;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  resourceGroup?: string;
}

export class ServiceCostFiltersDto {
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  resourceGroup?: string;
}

// AI Usage Cost DTOs
export class CreateAiUsageCostDto {
  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsString()
  userId: string;

  @IsString()
  aiProvider: string;

  @IsString()
  modelName: string;

  @IsNumber()
  promptTokens: number;

  @IsNumber()
  completionTokens: number;

  @IsNumber()
  totalTokens: number;

  @IsNumber()
  estimatedCost: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsOptional()
  @IsNumber()
  promptTokenPrice?: number;

  @IsOptional()
  @IsNumber()
  completionTokenPrice?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolsUsed?: string[];

  @IsOptional()
  @IsNumber()
  responseTime?: number;

  @IsOptional()
  @IsBoolean()
  wasSuccessful?: boolean;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class AiUsageCostFiltersDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  aiProvider?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// User Cost Allocation DTOs
export class CreateUserCostAllocationDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  azureServiceCosts: number;

  @IsNumber()
  aiApiCosts: number;

  @IsNumber()
  totalCost: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsOptional()
  @IsObject()
  costBreakdown?: any;

  @IsOptional()
  @IsObject()
  resourceUsage?: any;
}

export class UserCostAllocationFiltersDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  subscriptionId?: string;
}

// Resource Cost Breakdown DTOs
export class CreateResourceCostBreakdownDto {
  @IsString()
  subscriptionId: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsString()
  resourceName: string;

  @IsString()
  resourceType: string;

  @IsString()
  resourceGroup: string;

  @IsDateString()
  date: string;

  @IsString()
  meterCategory: string;

  @IsOptional()
  @IsString()
  meterSubCategory?: string;

  @IsString()
  meterName: string;

  @IsOptional()
  @IsString()
  meterId?: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unitOfMeasure: string;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  cost: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsOptional()
  @IsString()
  pricingModel?: string;

  @IsOptional()
  @IsString()
  chargeType?: string;

  @IsOptional()
  @IsObject()
  tags?: any;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  availabilityZone?: string;
}

export class ResourceCostBreakdownFiltersDto {
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  resourceGroup?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  meterCategory?: string;
}
