import { Module } from '@nestjs/common';
import { Context7Service } from './context7.service';

/**
 * Context7 Module
 * 
 * Provides RAG (Retrieval-Augmented Generation) capabilities
 * by integrating with Context7 MCP server to fetch Azure documentation.
 * 
 * Features:
 * - Azure documentation search
 * - Best practices retrieval
 * - Code examples
 * - API schema discovery
 * - 1-hour caching for performance
 */
@Module({
  providers: [Context7Service],
  exports: [Context7Service],
})
export class Context7Module {}
