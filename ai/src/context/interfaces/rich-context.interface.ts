/**
 * Rich Context Interfaces
 * 
 * Defines the structure of rich context that will be injected
 * into the AI system instructions before each response.
 */

export interface UserContext {
  id: string;
  email: string;
  name: string | null;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultSubscriptionId?: string | null;
  defaultRegion?: string | null;
  costAlertThreshold?: number | null;
  notificationPreferences?: Record<string, any> | null;
}

export interface AzureSubscription {
  id: string;
  name: string;
  currentSpend: number;
  budget: number;
  percentUsed: number;
}

export interface AzureResource {
  name: string;
  cost: number;
  type: string;
  resourceGroup?: string;
  location?: string;
}

export interface AzureAlert {
  severity: string;
  message: string;
  resourceId?: string;
  timestamp: Date;
}

export interface AzureContext {
  subscription: AzureSubscription;
  topResources: AzureResource[];
  activeAlerts: AzureAlert[];
  resourceHealth: Array<{
    resourceId: string;
    status: string;
    summary: string;
  }>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ConversationContext {
  id: string;
  history: ConversationMessage[];
  currentTopic?: string | null;
  entitiesDiscussed: string[];
  pendingActions: string[];
}

export interface CostTrend {
  date: string;
  cost: number;
  change?: number; // Percentage change from previous period
}

export interface Recommendation {
  id: string;
  type: string;
  resourceId?: string | null;
  recommendation: string;
  potentialSavings?: number | null;
  status: string;
  createdAt: Date;
}

export interface HistoricalContext {
  costTrends: CostTrend[];
  recommendations: Recommendation[];
  pastDecisions: Array<{
    decision: string;
    timestamp: Date;
    outcome?: string;
  }>;
}

export interface DocumentationContext {
  relevantDocs: string;
  apiSchemas: Array<{
    service: string;
    operation: string;
    schema: Record<string, any>;
  }>;
  bestPractices: string[];
  codeExamples: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  category: 'custom' | 'azure-mcp' | 'system';
}

export interface ToolContext {
  available: ToolDefinition[];
  recentlyUsed: string[];
  executionStats: Record<string, {
    successCount: number;
    failureCount: number;
    avgDurationMs: number;
  }>;
}

/**
 * Rich Context
 * 
 * Complete context object that combines all context types
 * for injection into AI system instructions
 */
export interface RichContext {
  user: UserContext;
  azure: AzureContext;
  conversation: ConversationContext;
  history: HistoricalContext;
  documentation: DocumentationContext;
  tools: ToolContext;
  timestamp: Date;
}

/**
 * Context Build Options
 * 
 * Options for customizing context building
 */
export interface ContextBuildOptions {
  includeHistory?: boolean;
  includeDocumentation?: boolean;
  includeTools?: boolean;
  historyLimit?: number; // Number of messages to include
  documentationTokens?: number; // Max tokens for documentation
}
