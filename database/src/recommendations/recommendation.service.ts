import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationType, RecommendationStatus } from '@prisma/client';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new recommendation
   */
  async createRecommendation(data: {
    userId: string;
    conversationId?: string;
    type: string;
    resourceId?: string;
    recommendation: string;
    potentialSavings?: number;
    status?: string;
  }) {
    try {
      const recommendation = await this.prisma.recommendation.create({
        data: {
          userId: data.userId,
          conversationId: data.conversationId,
          type: data.type as RecommendationType,
          resourceId: data.resourceId,
          recommendation: data.recommendation,
          potentialSavings: data.potentialSavings,
          status: (data.status as RecommendationStatus) || RecommendationStatus.PENDING,
        },
      });

      this.logger.log(`Recommendation created for user ${data.userId}`);

      return recommendation;
    } catch (error: any) {
      this.logger.error(`Failed to create recommendation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get recommendations for a user
   */
  async getUserRecommendations(userId: string, limit: number = 10, status?: string) {
    try {
      const where: any = { userId };
      
      if (status) {
        where.status = status as RecommendationStatus;
      }

      const recommendations = await this.prisma.recommendation.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      this.logger.log(`Retrieved ${recommendations.length} recommendations for user ${userId}`);

      return recommendations;
    } catch (error: any) {
      this.logger.error(`Failed to get user recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(id: string, status: string) {
    try {
      const recommendation = await this.prisma.recommendation.update({
        where: { id },
        data: {
          status: status as RecommendationStatus,
        },
      });

      this.logger.log(`Recommendation ${id} status updated to ${status}`);

      return recommendation;
    } catch (error: any) {
      this.logger.error(`Failed to update recommendation status: ${error.message}`);
      throw error;
    }
  }
}
