/**
 * Context7 Service Interfaces
 * 
 * Interfaces for interacting with Context7 MCP server
 * to fetch Azure documentation and code examples
 */

export interface Context7LibraryResult {
  libraryId: string;
  name: string;
  description: string;
  trustScore?: number;
  relevanceScore?: number;
}

export interface Context7Documentation {
  content: string;
  source: string;
  libraryId: string;
  topic?: string;
  tokensUsed: number;
}

export interface Context7CodeExample {
  code: string;
  language: string;
  description: string;
  source: string;
}

export interface Context7SearchOptions {
  tokens?: number; // Max tokens to retrieve (default: 5000)
  topic?: string; // Specific topic to focus on
}

export interface Context7ResolveOptions {
  libraryName: string;
}
