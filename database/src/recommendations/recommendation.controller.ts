import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  /**
   * Create a recommendation
   * POST /recommendations
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRecommendation(@Body() data: {
    userId: string;
    conversationId?: string;
    type: string;
    resourceId?: string;
    recommendation: string;
    potentialSavings?: number;
    status?: string;
  }) {
    return this.recommendationService.createRecommendation(data);
  }

  /**
   * Get recommendations for a user
   * GET /recommendations/:userId?limit=10&status=PENDING
   */
  @Get(':userId')
  async getUserRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    return this.recommendationService.getUserRecommendations(userId, numLimit, status);
  }

  /**
   * Update recommendation status
   * PUT /recommendations/:id/status
   */
  @Put(':id/status')
  async updateRecommendationStatus(
    @Param('id') id: string,
    @Body() data: { status: string },
  ) {
    return this.recommendationService.updateRecommendationStatus(id, data.status);
  }
}
