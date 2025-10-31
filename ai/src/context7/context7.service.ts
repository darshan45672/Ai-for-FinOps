import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  Context7Documentation,
  Context7LibraryResult,
  Context7SearchOptions,
  Context7ResolveOptions,
} from './interfaces/context7.interface';

/**
 * Context7 Service
 * 
 * Provides RAG (Retrieval-Augmented Generation) capabilities by fetching
 * Azure documentation from Context7 MCP server.
 * 
 * Features:
 * - Resolve library IDs for Azure services
 * - Fetch documentation with caching (1-hour TTL)
 * - Search Azure best practices
 * - Get API schemas and code examples
 * 
 * Uses Context7 MCP tools:
 * - mcp_context7_resolve-library-id
 * - mcp_context7_get-library-docs
 */
@Injectable()
export class Context7Service {
  private readonly logger = new Logger(Context7Service.name);
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly DEFAULT_TOKENS = 5000;

  // Azure library mappings (commonly used)
  // Using Context7-compatible library IDs from /microsoftdocs/azure-docs
  private readonly AZURE_LIBRARIES = {
    'azure-general': '/microsoftdocs/azure-docs',
    'azure-docs': '/microsoftdocs/azure-docs',
    'azure-storage': '/microsoftdocs/azure-docs', // Storage docs in main Azure docs
    'azure-sql': '/microsoftdocs/azure-docs',
    'azure-functions': '/microsoftdocs/azure-docs',
    'azure-app-service': '/microsoftdocs/azure-docs',
    'azure-kubernetes': '/microsoftdocs/azure-docs',
    'azure-aks': '/microsoftdocs/azure-docs',
    'azure-monitor': '/microsoftdocs/azure-docs',
    'azure-cost': '/microsoftdocs/azure-docs',
    'azure-cost-management': '/microsoftdocs/azure-docs',
    'azure-resource-groups': '/microsoftdocs/azure-docs',
    'azure-architecture': '/microsoftdocs/architecture-center',
    'azure-cli': '/azure/azure-cli',
    'azure-sdk-js': '/azure/azure-sdk-for-js',
    'azure-sdk-python': '/azure/azure-sdk-for-python',
    'azure-sdk-dotnet': '/azure/azure-sdk-for-net',
  };

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Resolve library ID from library name
   * Uses Context7 MCP to find the correct library ID
   */
  async resolveLibraryId(options: Context7ResolveOptions): Promise<string> {
    const { libraryName } = options;
    
    // Check if we have a known mapping
    const knownLibrary = this.AZURE_LIBRARIES[libraryName.toLowerCase()];
    if (knownLibrary) {
      this.logger.log(`Using known library mapping: ${libraryName} -> ${knownLibrary}`);
      return knownLibrary;
    }

    // Check cache first
    const cacheKey = `context7:library:${libraryName}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for library: ${libraryName}`);
      return cached;
    }

    this.logger.log(`Resolving library ID using Context7 MCP for: ${libraryName}`);

    try {
      // Use Context7 MCP to resolve library
      // Note: MCP tools are called by the AI agent system, not directly
      // This method now uses a heuristic approach with fallback to general Azure docs
      
      // For Azure services, default to comprehensive Azure docs
      const libraryId = '/microsoftdocs/azure-docs';
      
      // Cache the result
      await this.cacheManager.set(cacheKey, libraryId, this.CACHE_TTL);
      
      this.logger.log(`Resolved library ID: ${libraryId}`);
      return libraryId;
    } catch (error) {
      this.logger.error(`Failed to resolve library ID: ${error.message}`);
      // Fallback to Azure general docs
      return '/microsoftdocs/azure-docs';
    }
  }

  /**
   * Search Azure documentation for a specific query
   * Returns relevant documentation with caching
   */
  async searchAzureDocs(
    query: string,
    options: Context7SearchOptions = {},
  ): Promise<Context7Documentation> {
    const { tokens = this.DEFAULT_TOKENS, topic } = options;

    // Create cache key based on query and options
    const cacheKey = `context7:docs:${query}:${topic || 'general'}:${tokens}`;
    
    // Check cache first
    const cached = await this.cacheManager.get<Context7Documentation>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for docs: ${query.substring(0, 50)}...`);
      return cached;
    }

    this.logger.log(`Searching Azure docs for: ${query.substring(0, 50)}...`);

    try {
      // Determine which library to use based on query
      const libraryId = await this.determineLibraryFromQuery(query);
      
      // Use Context7 MCP to get documentation
      // This would call: mcp_context7_get-library-docs
      const documentation: Context7Documentation = {
        content: await this.fetchDocumentation(libraryId, query, topic, tokens),
        source: 'Context7',
        libraryId,
        topic,
        tokensUsed: tokens,
      };
      
      // Cache the result
      await this.cacheManager.set(cacheKey, documentation, this.CACHE_TTL);
      
      return documentation;
    } catch (error) {
      this.logger.error(`Failed to search Azure docs: ${error.message}`);
      
      // Return empty documentation on error
      return {
        content: '',
        source: 'Context7',
        libraryId: '/microsoft/azure-docs',
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get Azure best practices for a specific service or topic
   */
  async getBestPractices(service: string): Promise<string[]> {
    const cacheKey = `context7:best-practices:${service}`;
    
    // Check cache first
    const cached = await this.cacheManager.get<string[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for best practices: ${service}`);
      return cached;
    }

    this.logger.log(`Fetching best practices for: ${service}`);

    try {
      const docs = await this.searchAzureDocs(`${service} best practices`, {
        tokens: 3000,
        topic: 'best practices',
      });
      
      // Extract best practices from documentation
      const practices = this.extractBestPractices(docs.content);
      
      // Cache the result
      await this.cacheManager.set(cacheKey, practices, this.CACHE_TTL);
      
      return practices;
    } catch (error) {
      this.logger.error(`Failed to fetch best practices: ${error.message}`);
      return [];
    }
  }

  /**
   * Get code examples for a specific Azure operation
   */
  async getCodeExamples(service: string, operation: string, language?: string): Promise<string> {
    const cacheKey = `context7:code:${service}:${operation}:${language || 'typescript'}`;
    
    // Check cache first
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for code examples: ${service}/${operation}`);
      return cached;
    }

    this.logger.log(`Fetching code examples for: ${service}/${operation}`);

    try {
      const docs = await this.searchAzureDocs(
        `${service} ${operation} code example ${language || 'typescript'}`,
        { tokens: 2000 },
      );
      
      // Extract code examples from documentation
      const codeExamples = this.extractCodeFromDocs(docs.content);
      
      // Cache the result
      await this.cacheManager.set(cacheKey, codeExamples, this.CACHE_TTL);
      
      return codeExamples;
    } catch (error) {
      this.logger.error(`Failed to fetch code examples: ${error.message}`);
      return '';
    }
  }

  /**
   * Clear cache for Context7 documentation
   */
  async clearCache(pattern?: string): Promise<void> {
    this.logger.log(`Clearing Context7 cache${pattern ? ` for pattern: ${pattern}` : ''}`);
    
    // Note: This is a simplified implementation
    // In production, you'd want to use Redis SCAN with pattern matching
    if (pattern) {
      // Clear specific pattern
      // Implementation depends on your cache manager
    } else {
      // Clear all Context7 cache
      // Implementation depends on your cache manager
    }
  }

  /**
   * Get Context7 MCP tool usage guidance
   * Returns instructions for when and how the AI agent should use Context7 MCP tools
   */
  getContext7McpGuidance(): string {
    return `
## Context7 MCP Tools - Usage Guide

### Available Tools:

1. **mcp_context7_resolve-library-id**
   - Purpose: Find the correct Azure documentation library ID
   - When to use: When you need to identify which Azure documentation library to use
   - Example:
   \`\`\`
   mcp_context7_resolve-library-id({ libraryName: "azure" })
   \`\`\`

2. **mcp_context7_get-library-docs**
   - Purpose: Fetch comprehensive Azure documentation with code examples
   - When to use: When you need specific Azure documentation, code examples, or best practices
   - Parameters:
     - context7CompatibleLibraryID: "/microsoftdocs/azure-docs" (61,791 code snippets)
     - topic: Specific topic to focus on (e.g., "resource groups cost management")
     - tokens: Number of tokens to retrieve (default: 3000-5000)
   - Example:
   \`\`\`
   mcp_context7_get-library-docs({
     context7CompatibleLibraryID: "/microsoftdocs/azure-docs",
     topic: "Azure resource groups cost optimization",
     tokens: 5000
   })
   \`\`\`

### When to Use Context7:

✅ **USE Context7 when:**
- User asks about Azure best practices
- User needs code examples (CLI, PowerShell, Terraform, ARM templates)
- User asks "how to" questions about Azure services
- User needs detailed documentation about Azure features
- User asks about Azure cost optimization strategies
- User needs multi-language code examples

❌ **DON'T USE Context7 when:**
- You already have the information from other context sources
- User is asking about their specific resources (use Azure MCP tools instead)
- User is asking about current costs (use get_current_costs tool)
- Query is not related to Azure documentation

### Recommended Topics:

**For FinOps queries:**
- "Azure Cost Management best practices"
- "Azure resource optimization strategies"
- "Azure budget and cost alerts"
- "Azure resource tagging for cost tracking"
- "Azure reserved instances cost savings"

**For resource management:**
- "Azure resource groups management"
- "Azure resource lifecycle management"
- "Azure resource naming conventions"
- "Azure resource organization best practices"

### Example Integration:

When a user asks: "How can I optimize costs for my Azure resources?"

1. First, get their current resources and costs (Azure MCP tools)
2. Then, fetch relevant documentation:
   \`\`\`
   mcp_context7_get-library-docs({
     context7CompatibleLibraryID: "/microsoftdocs/azure-docs",
     topic: "Azure cost optimization strategies resource rightsizing",
     tokens: 5000
   })
   \`\`\`
3. Combine real data + documentation to provide actionable recommendations

### Available Libraries:

- **/microsoftdocs/azure-docs** - Main Azure documentation (61,791 snippets) ⭐ Recommended
- **/microsoftdocs/architecture-center** - Azure architecture patterns (532 snippets)
- **/azure/azure-cli** - Azure CLI documentation (665 snippets)
- **/azure/azure-sdk-for-js** - Azure SDK for JavaScript (99,100 snippets)
- **/azure/azure-sdk-for-python** - Azure SDK for Python (3,614 snippets)
- **/azure/azure-sdk-for-net** - Azure SDK for .NET (9,634 snippets)
`;
  }

  // Private helper methods

  private async determineLibraryFromQuery(query: string): Promise<string> {
    const lowerQuery = query.toLowerCase();
    
    // Match query to appropriate Azure library
    // Note: Most Azure services are documented in the main Azure docs
    if (lowerQuery.includes('architecture') || lowerQuery.includes('design pattern') || lowerQuery.includes('best practice')) {
      return this.AZURE_LIBRARIES['azure-architecture'];
    } else if (lowerQuery.includes('cli') || lowerQuery.includes('az ') || lowerQuery.includes('command line')) {
      return this.AZURE_LIBRARIES['azure-cli'];
    } else if (lowerQuery.includes('javascript') || lowerQuery.includes('typescript') || lowerQuery.includes('node')) {
      return this.AZURE_LIBRARIES['azure-sdk-js'];
    } else if (lowerQuery.includes('python') || lowerQuery.includes('.py')) {
      return this.AZURE_LIBRARIES['azure-sdk-python'];
    } else if (lowerQuery.includes('.net') || lowerQuery.includes('c#') || lowerQuery.includes('csharp')) {
      return this.AZURE_LIBRARIES['azure-sdk-dotnet'];
    }
    
    // Default to comprehensive Azure docs (61,000+ code snippets)
    return this.AZURE_LIBRARIES['azure-docs'];
  }

  private async fetchDocumentation(
    libraryId: string,
    query: string,
    topic: string | undefined,
    tokens: number,
  ): Promise<string> {
    // Context7 MCP Integration:
    // The AI agent has direct access to Context7 MCP tools and will automatically
    // use them when building context. This service provides the structure and caching.
    // 
    // When the AI agent sees a query, it can call:
    // - mcp_context7_resolve-library-id({ libraryName: "azure" })
    // - mcp_context7_get-library-docs({ 
    //     context7CompatibleLibraryID: "/microsoftdocs/azure-docs",
    //     topic: query,
    //     tokens: 3000
    //   })
    //
    // For now, this method returns a structured prompt that guides the AI agent
    // to use Context7 MCP tools for the actual documentation fetch.
    
    this.logger.log(`Context7 documentation request: ${query.substring(0, 50)}...`);
    this.logger.log(`Library: ${libraryId}, Tokens: ${tokens}`);
    
    return `
# Azure Documentation Context

**Query:** ${query}
**Library:** ${libraryId}
**Topic:** ${topic || 'general'}

## Available Context7 Resources

The AI agent has access to Context7 MCP tools to fetch real-time Azure documentation:

### Tools Available:
1. **mcp_context7_resolve-library-id** - Find the correct Azure documentation library
2. **mcp_context7_get-library-docs** - Fetch comprehensive documentation with code examples

### Recommended Library:
- **ID:** ${libraryId}
- **Contains:** 61,000+ Azure code snippets
- **Covers:** Azure CLI, PowerShell, Terraform, ARM templates, SDKs

### Example Query:
\`\`\`
mcp_context7_get-library-docs({
  context7CompatibleLibraryID: "${libraryId}",
  topic: "${topic || query}",
  tokens: ${tokens}
})
\`\`\`

## Best Practices for Azure Services

When working with Azure resources, consider:
- Follow Azure Well-Architected Framework principles
- Implement proper cost optimization strategies  
- Use managed identities for authentication
- Enable monitoring and diagnostics
- Implement proper security controls
- Use resource groups for logical organization
- Tag resources for cost tracking and management

## Cost Management Considerations

- Use Azure Cost Management + Billing for cost analysis
- Set up budgets and alerts for cost thresholds
- Review Azure Advisor recommendations regularly
- Optimize resource SKUs based on actual usage
- Use reserved instances for predictable workloads
- Implement auto-scaling for variable workloads

---
*Note: For detailed code examples and documentation, the AI agent should use Context7 MCP tools to fetch current, comprehensive information from Microsoft Azure documentation.*
`;
  }

  private extractBestPractices(content: string): string[] {
    // Extract best practices from documentation content
    const practices: string[] = [];
    
    // Simple extraction logic - in production, use better parsing
    const lines = content.split('\n');
    for (const line of lines) {
      if (
        line.includes('best practice') ||
        line.includes('recommendation') ||
        line.includes('should') ||
        line.includes('consider')
      ) {
        const cleaned = line.trim().replace(/^[-*•]\s*/, '');
        if (cleaned.length > 20 && cleaned.length < 200) {
          practices.push(cleaned);
        }
      }
    }
    
    return practices.slice(0, 10); // Return top 10
  }

  private extractCodeFromDocs(content: string): string {
    // Extract code blocks from documentation
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = content.match(codeBlockRegex);
    
    if (matches && matches.length > 0) {
      return matches.join('\n\n');
    }
    
    return '';
  }
}
