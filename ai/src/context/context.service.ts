import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { Context7Service } from '../context7/context7.service';
import {
  RichContext,
  UserContext,
  AzureContext,
  ConversationContext,
  HistoricalContext,
  DocumentationContext,
  ToolContext,
  ContextBuildOptions,
  ConversationMessage,
} from './interfaces/rich-context.interface';

/**
 * Context Service
 * 
 * Builds rich context for AI responses by combining:
 * - User preferences and settings
 * - Azure environment data (costs, resources, alerts)
 * - Conversation history and memory
 * - Historical trends and patterns
 * - Documentation from Context7 (RAG)
 * - Available tools and capabilities
 * 
 * Implements caching strategy:
 * - User context: 5 minutes
 * - Azure context: 10 minutes (expensive queries)
 * - Documentation: 1 hour (via Context7Service)
 * - Historical data: No caching (always from DB)
 */
@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);
  
  // Cache TTLs (in seconds)
  private readonly USER_CONTEXT_TTL = 300; // 5 minutes
  private readonly AZURE_CONTEXT_TTL = 600; // 10 minutes
  
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private httpService: HttpService,
    private context7Service: Context7Service,
  ) {}

  /**
   * Build complete rich context for AI
   * 
   * @param userId User ID
   * @param conversationId Conversation ID
   * @param query User's current query (for relevant documentation)
   * @param options Context build options
   * @returns Complete rich context object
   */
  async buildContext(
    userId: string,
    conversationId: string,
    query: string,
    options: ContextBuildOptions = {},
  ): Promise<RichContext> {
    const {
      includeHistory = true,
      includeDocumentation = true,
      includeTools = true,
      historyLimit = 20,
      documentationTokens = 5000,
    } = options;

    this.logger.log(`Building context for user: ${userId}, conversation: ${conversationId}`);

    try {
      // Fetch all context sources in parallel for performance
      const [
        userContext,
        azureContext,
        conversationContext,
        historicalContext,
        documentationContext,
        toolContext,
      ] = await Promise.all([
        this.getUserContext(userId),
        this.getAzureContext(userId),
        this.getConversationContext(conversationId, historyLimit),
        includeHistory ? this.getHistoricalContext(userId) : this.getEmptyHistoricalContext(),
        includeDocumentation ? this.getDocumentationContext(query, documentationTokens) : this.getEmptyDocumentationContext(),
        includeTools ? this.getToolContext() : this.getEmptyToolContext(),
      ]);

      const richContext: RichContext = {
        user: userContext,
        azure: azureContext,
        conversation: conversationContext,
        history: historicalContext,
        documentation: documentationContext,
        tools: toolContext,
        timestamp: new Date(),
      };

      this.logger.log(`Context built successfully with ${conversationContext.history.length} messages, ${toolContext.available.length} tools`);

      return richContext;
    } catch (error) {
      this.logger.error(`Failed to build context: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user context (preferences, settings)
   * Cached for 5 minutes
   */
  private async getUserContext(userId: string): Promise<UserContext> {
    const cacheKey = `user_context:${userId}`;
    
    // Check cache first
    const cached = await this.cacheManager.get<UserContext>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for user context: ${userId}`);
      return cached;
    }

    this.logger.debug(`Fetching user context from database: ${userId}`);

    try {
      // Fetch from database service
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.DATABASE_SERVICE_URL}/users/${userId}`)
      );

      const user = response.data;
      
      const userContext: UserContext = {
        id: user.id,
        email: user.email,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        preferences: {
          defaultSubscriptionId: user.defaultSubscriptionId,
          defaultRegion: user.defaultRegion,
          costAlertThreshold: user.costAlertThreshold ? parseFloat(user.costAlertThreshold) : null,
          notificationPreferences: user.notificationPreferences,
        },
      };

      // Cache the result
      await this.cacheManager.set(cacheKey, userContext, this.USER_CONTEXT_TTL);

      return userContext;
    } catch (error) {
      this.logger.error(`Failed to fetch user context: ${error.message}`);
      
      // Return minimal context on error
      return {
        id: userId,
        email: 'unknown@example.com',
        name: 'Unknown User',
        preferences: {},
      };
    }
  }

  /**
   * Get Azure context (costs, resources, alerts)
   * Cached for 10 minutes (expensive queries)
   */
  private async getAzureContext(userId: string): Promise<AzureContext> {
    const cacheKey = `azure_context:${userId}`;
    
    // Check cache first
    const cached = await this.cacheManager.get<AzureContext>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for Azure context: ${userId}`);
      return cached;
    }

    this.logger.debug(`Fetching Azure context: ${userId}`);

    try {
      // Fetch current spend and resources
      // This would use Azure MCP tools in production
      
      const azureContext: AzureContext = {
        subscription: {
          id: 'placeholder-sub-id',
          name: 'Production',
          currentSpend: 0,
          budget: 5000,
          percentUsed: 0,
        },
        topResources: [],
        activeAlerts: [],
        resourceHealth: [],
      };

      // Cache the result
      await this.cacheManager.set(cacheKey, azureContext, this.AZURE_CONTEXT_TTL);

      return azureContext;
    } catch (error) {
      this.logger.error(`Failed to fetch Azure context: ${error.message}`);
      
      // Return empty context on error
      return {
        subscription: {
          id: 'unknown',
          name: 'Unknown',
          currentSpend: 0,
          budget: 0,
          percentUsed: 0,
        },
        topResources: [],
        activeAlerts: [],
        resourceHealth: [],
      };
    }
  }

  /**
   * Get conversation context (history, topics, entities)
   * Always fetched fresh from database
   */
  private async getConversationContext(
    conversationId: string,
    historyLimit: number,
  ): Promise<ConversationContext> {
    this.logger.debug(`Fetching conversation context: ${conversationId}`);

    try {
      // Fetch conversation from database
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.DATABASE_SERVICE_URL}/conversations/${conversationId}`)
      );

      const conversation = response.data;
      
      // Fetch recent messages
      const messagesResponse = await firstValueFrom(
        this.httpService.get(
          `${process.env.DATABASE_SERVICE_URL}/conversations/${conversationId}/messages?limit=${historyLimit}`
        )
      );

      const messages = messagesResponse.data;
      
      const history: ConversationMessage[] = messages.map((msg: any) => ({
        role: msg.role.toLowerCase(),
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));

      // Extract metadata
      const metadata = conversation.metadata || {};

      return {
        id: conversationId,
        history,
        currentTopic: metadata.currentTopic,
        entitiesDiscussed: metadata.entitiesDiscussed || [],
        pendingActions: metadata.pendingActions || [],
      };
    } catch (error) {
      this.logger.error(`Failed to fetch conversation context: ${error.message}`);
      
      // Return empty context on error
      return {
        id: conversationId,
        history: [],
        entitiesDiscussed: [],
        pendingActions: [],
      };
    }
  }

  /**
   * Get historical context (cost trends, recommendations, past decisions)
   * Always fetched fresh from database
   */
  private async getHistoricalContext(userId: string): Promise<HistoricalContext> {
    this.logger.debug(`Fetching historical context: ${userId}`);

    try {
      // Fetch cost trends (last 30 days)
      const trendsResponse = await firstValueFrom(
        this.httpService.get(`${process.env.DATABASE_SERVICE_URL}/cost-snapshots/${userId}/trends?days=30`)
      );

      const costTrends = trendsResponse.data.map((snapshot: any) => ({
        date: snapshot.date,
        cost: parseFloat(snapshot.totalCost),
      }));

      // Fetch recent recommendations
      const recsResponse = await firstValueFrom(
        this.httpService.get(`${process.env.DATABASE_SERVICE_URL}/recommendations/${userId}?limit=10`)
      );

      const recommendations = recsResponse.data.map((rec: any) => ({
        id: rec.id,
        type: rec.type,
        resourceId: rec.resourceId,
        recommendation: rec.recommendation,
        potentialSavings: rec.potentialSavings ? parseFloat(rec.potentialSavings) : null,
        status: rec.status,
        createdAt: new Date(rec.createdAt),
      }));

      return {
        costTrends,
        recommendations,
        pastDecisions: [],
      };
    } catch (error) {
      this.logger.error(`Failed to fetch historical context: ${error.message}`);
      return this.getEmptyHistoricalContext();
    }
  }

  /**
   * Get documentation context from Context7 (RAG)
   */
  private async getDocumentationContext(
    query: string,
    tokens: number,
  ): Promise<DocumentationContext> {
    this.logger.debug(`Fetching documentation context for query: ${query.substring(0, 50)}...`);

    try {
      // Search Azure docs using Context7
      const docs = await this.context7Service.searchAzureDocs(query, { tokens });
      
      // Get best practices
      const bestPractices = await this.context7Service.getBestPractices(query);
      
      return {
        relevantDocs: docs.content,
        apiSchemas: [],
        bestPractices,
        codeExamples: [],
      };
    } catch (error) {
      this.logger.error(`Failed to fetch documentation context: ${error.message}`);
      return this.getEmptyDocumentationContext();
    }
  }

  /**
   * Get tool context (available tools, usage stats)
   */
  private async getToolContext(): Promise<ToolContext> {
    this.logger.debug('Fetching tool context');

    try {
      // This will be populated by Azure MCP Gateway in later phase
      return {
        available: [],
        recentlyUsed: [],
        executionStats: {},
      };
    } catch (error) {
      this.logger.error(`Failed to fetch tool context: ${error.message}`);
      return this.getEmptyToolContext();
    }
  }

  /**
   * Save conversation message to database
   */
  async saveConversation(
    conversationId: string,
    message: { role: string; content: string; toolsUsed?: string[] },
  ): Promise<void> {
    this.logger.debug(`Saving message to conversation: ${conversationId}`);

    try {
      await firstValueFrom(
        this.httpService.post(
          `${process.env.DATABASE_SERVICE_URL}/conversations/${conversationId}/messages`,
          message,
        )
      );
    } catch (error) {
      this.logger.error(`Failed to save conversation: ${error.message}`);
    }
  }

  /**
   * Update conversation metadata (topics, entities, actions)
   */
  async updateConversationMetadata(
    conversationId: string,
    metadata: {
      currentTopic?: string;
      entitiesDiscussed?: string[];
      pendingActions?: string[];
    },
  ): Promise<void> {
    this.logger.debug(`Updating conversation metadata: ${conversationId}`);

    try {
      await firstValueFrom(
        this.httpService.patch(
          `${process.env.DATABASE_SERVICE_URL}/conversations/${conversationId}`,
          { metadata },
        )
      );
    } catch (error) {
      this.logger.error(`Failed to update conversation metadata: ${error.message}`);
    }
  }

  // Helper methods to return empty contexts

  private getEmptyHistoricalContext(): HistoricalContext {
    return {
      costTrends: [],
      recommendations: [],
      pastDecisions: [],
    };
  }

  private getEmptyDocumentationContext(): DocumentationContext {
    return {
      relevantDocs: '',
      apiSchemas: [],
      bestPractices: [],
      codeExamples: [],
    };
  }

  private getEmptyToolContext(): ToolContext {
    return {
      available: [],
      recentlyUsed: [],
      executionStats: {},
    };
  }
}
