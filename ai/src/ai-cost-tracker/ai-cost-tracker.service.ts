import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface GeminiPricing {
  promptTokenPrice: number; // per 1000 tokens
  completionTokenPrice: number; // per 1000 tokens
}

@Injectable()
export class AiCostTrackerService {
  private readonly logger = new Logger(AiCostTrackerService.name);
  private readonly databaseServiceUrl: string;
  private readonly pricing: Map<string, GeminiPricing> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.databaseServiceUrl = configService.get<string>('DATABASE_SERVICE_URL') || 'http://localhost:3002';
    
    // Initialize pricing for different Gemini models
    // Prices as of November 2025 (per 1000 tokens)
    this.pricing.set('gemini-2.0-flash', {
      promptTokenPrice: 0.00001875, // $0.00001875 per 1K tokens
      completionTokenPrice: 0.000075, // $0.000075 per 1K tokens
    });
    
    this.pricing.set('gemini-1.5-pro', {
      promptTokenPrice: 0.00125, // $0.00125 per 1K tokens
      completionTokenPrice: 0.005, // $0.005 per 1K tokens
    });
    
    this.pricing.set('gemini-1.5-flash', {
      promptTokenPrice: 0.00001875,
      completionTokenPrice: 0.000075,
    });

    // Allow custom pricing from environment variables
    const customPromptPrice = this.configService.get<string>('GEMINI_PROMPT_TOKEN_PRICE');
    const customCompletionPrice = this.configService.get<string>('GEMINI_COMPLETION_TOKEN_PRICE');
    
    if (customPromptPrice && customCompletionPrice) {
      this.logger.log('Using custom Gemini pricing from environment variables');
    }
  }

  /**
   * Calculate cost based on token usage and model
   */
  calculateCost(modelName: string, tokenUsage: TokenUsage): number {
    const pricing = this.pricing.get(modelName);
    
    if (!pricing) {
      this.logger.warn(`No pricing found for model ${modelName}, using default Gemini 2.0 Flash pricing`);
      const defaultPricing = this.pricing.get('gemini-2.0-flash')!;
      return this.calculateCostWithPricing(tokenUsage, defaultPricing);
    }

    return this.calculateCostWithPricing(tokenUsage, pricing);
  }

  /**
   * Calculate cost with specific pricing
   */
  private calculateCostWithPricing(tokenUsage: TokenUsage, pricing: GeminiPricing): number {
    const promptCost = (tokenUsage.promptTokens / 1000) * pricing.promptTokenPrice;
    const completionCost = (tokenUsage.completionTokens / 1000) * pricing.completionTokenPrice;
    return promptCost + completionCost;
  }

  /**
   * Track AI usage cost and send to database service
   */
  async trackUsage(data: {
    conversationId?: string;
    messageId?: string;
    userId: string;
    aiProvider: string;
    modelName: string;
    tokenUsage: TokenUsage;
    toolsUsed?: string[];
    responseTime?: number;
    wasSuccessful?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const pricing = this.pricing.get(data.modelName);
      const estimatedCost = this.calculateCost(data.modelName, data.tokenUsage);

      const costData = {
        conversationId: data.conversationId,
        messageId: data.messageId,
        userId: data.userId,
        aiProvider: data.aiProvider,
        modelName: data.modelName,
        promptTokens: data.tokenUsage.promptTokens,
        completionTokens: data.tokenUsage.completionTokens,
        totalTokens: data.tokenUsage.totalTokens,
        estimatedCost,
        currency: 'USD',
        promptTokenPrice: pricing?.promptTokenPrice,
        completionTokenPrice: pricing?.completionTokenPrice,
        toolsUsed: data.toolsUsed || [],
        responseTime: data.responseTime,
        wasSuccessful: data.wasSuccessful ?? true,
        errorMessage: data.errorMessage,
      };

      this.logger.debug(
        `Tracking AI usage: ${data.modelName} - ${data.tokenUsage.totalTokens} tokens = $${estimatedCost.toFixed(6)}`
      );

      // Send to database service asynchronously (don't block)
      this.sendToDatabaseService(costData).catch(error => {
        this.logger.error(`Failed to send AI cost data to database: ${error.message}`);
      });
    } catch (error: any) {
      this.logger.error(`Error tracking AI usage: ${error.message}`);
      // Don't throw - we don't want to break the AI response if cost tracking fails
    }
  }

  /**
   * Send cost data to database service
   */
  private async sendToDatabaseService(costData: any): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.databaseServiceUrl}/cost-tracking/ai-usage-costs`,
          costData,
          {
            timeout: 5000, // 5 second timeout
          }
        )
      );

      this.logger.debug(`AI cost data sent to database. Status: ${response.status}`);
    } catch (error: any) {
      this.logger.error(`Failed to send AI cost data: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Get pricing information for a model
   */
  getPricing(modelName: string): GeminiPricing | undefined {
    return this.pricing.get(modelName);
  }

  /**
   * Get all supported models and their pricing
   */
  getAllPricing(): Record<string, GeminiPricing> {
    const result: Record<string, GeminiPricing> = {};
    this.pricing.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}
