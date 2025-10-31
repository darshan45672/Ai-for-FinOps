/**
 * Function declaration schema types (matching Google GenAI SDK)
 */
export enum FunctionDeclarationSchemaType {
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
}

/**
 * Represents an MCP tool schema from an MCP server
 */
export interface McpTool {
  name: string;
  description: string;
  inputSchema?: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  serverName: string;
}

/**
 * MCP Server information
 */
export interface McpServerInfo {
  name: string;
  description: string;
  category: string;
  tools: McpTool[];
}

/**
 * Gemini-compatible function declaration schema property
 */
export interface FunctionDeclarationSchemaProperty {
  type: FunctionDeclarationSchemaType;
  description: string;
  enum?: string[];
  items?: FunctionDeclarationSchemaProperty;
  properties?: Record<string, FunctionDeclarationSchemaProperty>;
  required?: string[];
}

/**
 * Tool definition in Gemini format
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT;
    properties: Record<string, FunctionDeclarationSchemaProperty>;
    required: string[];
  };
  metadata?: {
    serverName: string;
    category: string;
    estimatedLatency?: number;
    requiresAuth?: boolean;
  };
}

/**
 * Result of tool execution
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  errorDetails?: any;
  durationMs: number;
  toolName: string;
  serverName?: string;
  timestamp: Date;
}

/**
 * Options for tool discovery
 */
export interface ToolDiscoveryOptions {
  refreshCache?: boolean;
  categories?: string[];
  serverNames?: string[];
  includeCustomTools?: boolean;
}

/**
 * Tool usage statistics
 */
export interface ToolUsageStats {
  toolName: string;
  callCount: number;
  successCount: number;
  failureCount: number;
  avgDurationMs: number;
  lastUsed?: Date;
}

/**
 * Azure MCP Server names (available in environment)
 */
export enum AzureMcpServer {
  APP_CONFIG = 'mcp_azure_mcp_appconfig',
  CONFIDENTIAL_LEDGER = 'mcp_azure_mcp_confidentialledger',
  GRAFANA = 'mcp_azure_mcp_grafana',
  MANAGED_LUSTRE = 'mcp_azure_mcp_managedlustre',
  REDIS = 'mcp_azure_mcp_redis',
  SQL = 'mcp_azure_mcp_sql',
  WORKBOOKS = 'mcp_azure_mcp_workbooks',
  RESOURCES = 'azure_resources',
}

/**
 * Tool category for organization
 */
export enum ToolCategory {
  DATABASE = 'database',
  CACHE = 'cache',
  STORAGE = 'storage',
  MONITORING = 'monitoring',
  CONFIGURATION = 'configuration',
  SECURITY = 'security',
  RESOURCES = 'resources',
  GENERAL = 'general',
}
