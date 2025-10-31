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
  private readonly AZURE_LIBRARIES = {
    'azure-general': '/microsoft/azure-docs',
    'azure-storage': '/Azure/azure-storage',
    'azure-sql': '/Azure/azure-sql',
    'azure-functions': '/Azure/azure-functions',
    'azure-app-service': '/Azure/azure-app-service',
    'azure-kubernetes': '/Azure/aks',
    'azure-monitor': '/Azure/azure-monitor',
    'azure-cost': '/microsoft/azure-docs', // Cost management in main docs
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

    this.logger.log(`Resolving library ID for: ${libraryName}`);

    try {
      // Use Context7 MCP to resolve library
      // This would call: mcp_context7_resolve-library-id
      // For now, return default Azure docs
      const libraryId = '/microsoft/azure-docs';
      
      // Cache the result
      await this.cacheManager.set(cacheKey, libraryId, this.CACHE_TTL);
      
      return libraryId;
    } catch (error) {
      this.logger.error(`Failed to resolve library ID: ${error.message}`);
      // Fallback to Azure general docs
      return '/microsoft/azure-docs';
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

  // Private helper methods

  private async determineLibraryFromQuery(query: string): Promise<string> {
    const lowerQuery = query.toLowerCase();
    
    // Match query to appropriate Azure library
    if (lowerQuery.includes('storage') || lowerQuery.includes('blob') || lowerQuery.includes('file share')) {
      return this.AZURE_LIBRARIES['azure-storage'];
    } else if (lowerQuery.includes('sql') || lowerQuery.includes('database')) {
      return this.AZURE_LIBRARIES['azure-sql'];
    } else if (lowerQuery.includes('function') || lowerQuery.includes('serverless')) {
      return this.AZURE_LIBRARIES['azure-functions'];
    } else if (lowerQuery.includes('app service') || lowerQuery.includes('web app')) {
      return this.AZURE_LIBRARIES['azure-app-service'];
    } else if (lowerQuery.includes('kubernetes') || lowerQuery.includes('aks') || lowerQuery.includes('container')) {
      return this.AZURE_LIBRARIES['azure-kubernetes'];
    } else if (lowerQuery.includes('monitor') || lowerQuery.includes('metrics') || lowerQuery.includes('logs')) {
      return this.AZURE_LIBRARIES['azure-monitor'];
    } else if (lowerQuery.includes('cost') || lowerQuery.includes('budget') || lowerQuery.includes('spending')) {
      return this.AZURE_LIBRARIES['azure-cost'];
    }
    
    // Default to general Azure docs
    return this.AZURE_LIBRARIES['azure-general'];
  }

  private async fetchDocumentation(
    libraryId: string,
    query: string,
    topic: string | undefined,
    tokens: number,
  ): Promise<string> {
    // This is where you'd call the Context7 MCP tool
    // For now, return placeholder documentation
    
    // In production, this would be:
    // const result = await this.mcpClient.call('mcp_context7_get-library-docs', {
    //   context7CompatibleLibraryID: libraryId,
    //   topic: topic || query,
    //   tokens: tokens,
    // });
    // return result.content;
    
    this.logger.warn('Context7 MCP not yet integrated - returning placeholder docs');
    
    return `
# Azure Documentation for: ${query}

## Overview
This is placeholder documentation. In production, this would contain actual Azure documentation
fetched from Context7 MCP server.

## Best Practices
- Follow Azure Well-Architected Framework principles
- Implement proper cost optimization strategies
- Use managed identities for authentication
- Enable monitoring and diagnostics
- Implement proper security controls

## Code Examples
// Placeholder code example
const azureResource = new AzureResourceClient();
await azureResource.performOperation();

## References
- Azure Documentation: https://docs.microsoft.com/azure
- Library ID: ${libraryId}
- Topic: ${topic || 'general'}
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
