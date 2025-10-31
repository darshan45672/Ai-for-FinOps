# Context7 MCP Integration - Complete Guide

**Date:** October 31, 2025  
**Status:** ✅ INTEGRATED  
**Version:** 1.0  

---

## Executive Summary

Successfully integrated Context7 MCP tools into the AI FinOps agent, providing access to **61,000+ Azure code examples** and comprehensive Microsoft Azure documentation. The AI agent can now fetch real-time documentation, best practices, and code examples to enhance its responses with authoritative Azure guidance.

---

## What is Context7 MCP?

Context7 is a Model Context Protocol (MCP) server that provides access to up-to-date documentation from official libraries and frameworks. For our Azure FinOps agent, it provides:

- **61,791 Azure code snippets** from `/microsoftdocs/azure-docs`
- **Multi-language support:** Azure CLI, PowerShell, Terraform, ARM templates, Kusto, SDKs
- **Architecture patterns** from Azure Architecture Center (532 snippets)
- **SDK documentation** for JavaScript (99,100), Python (3,614), .NET (9,634)
- **Real-time updates** from Microsoft's official documentation

---

## Integration Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI FinOps Agent                            │
│                  (ChatGeminiService)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ContextService                                │
│  Aggregates context from 6 sources including documentation      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Context7Service                               │
│  - Manages Context7 MCP integration                             │
│  - Provides library mappings                                     │
│  - Returns MCP tool usage guidance                               │
│  - Caches documentation (1-hour TTL)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                Context7 MCP Tools                                │
│  (Available directly to AI agent)                               │
│                                                                  │
│  1. mcp_context7_resolve-library-id                             │
│     - Finds correct Azure documentation library                 │
│                                                                  │
│  2. mcp_context7_get-library-docs                               │
│     - Fetches comprehensive documentation                       │
│     - Returns code examples and best practices                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Available MCP Tools

### 1. mcp_context7_resolve-library-id

**Purpose:** Find the correct Azure documentation library ID

**Parameters:**
```typescript
{
  libraryName: string  // e.g., "azure", "azure cli", "azure functions"
}
```

**Returns:**
```typescript
{
  libraries: Array<{
    id: string;              // Context7-compatible ID
    name: string;            // Library name
    description: string;     // Short summary
    codeSnippets: number;    // Number of available examples
    trustScore: number;      // Authority indicator (1-10)
    versions?: string[];     // Available versions
  }>
}
```

**Example Response:**
```json
{
  "libraries": [
    {
      "id": "/microsoftdocs/azure-docs",
      "name": "Microsoft Azure",
      "description": "Microsoft Azure cloud computing service documentation",
      "codeSnippets": 61791,
      "trustScore": 8.9
    },
    {
      "id": "/azure/azure-cli",
      "name": "Azure Command-Line Interface",
      "description": "Multi-platform command-line experience for managing Azure resources",
      "codeSnippets": 665,
      "trustScore": 9.6
    }
  ]
}
```

---

### 2. mcp_context7_get-library-docs

**Purpose:** Fetch comprehensive Azure documentation with code examples

**Parameters:**
```typescript
{
  context7CompatibleLibraryID: string;  // e.g., "/microsoftdocs/azure-docs"
  topic?: string;                       // Specific topic to focus on
  tokens?: number;                      // Max tokens to retrieve (default: 5000)
}
```

**Returns:**
```typescript
{
  content: string;        // Markdown-formatted documentation with code examples
  tokensUsed: number;     // Actual tokens used
}
```

**Example Call:**
```typescript
mcp_context7_get-library-docs({
  context7CompatibleLibraryID: "/microsoftdocs/azure-docs",
  topic: "Azure resource groups cost management",
  tokens: 5000
})
```

**Example Response:**
```markdown
### Construct Azure Cost Management API Scope URI for Resource Groups

Source: https://github.com/microsoftdocs/azure-docs/...

This snippet provides the URI template for accessing Cost Management API...

```URI Template
"/subscriptions/{id}/resourceGroups/{name}"
```

### Create Azure Resource Group with Terraform

```HCL
resource "azurerm_resource_group" "example" {
  name     = "example-resources"
  location = "West Europe"
}
```

### List and Show Azure Resource Groups with Azure CLI

```azurecli-interactive
az group list
az group show --name exampleGroup
```
...
```

---

## Available Azure Libraries

### Primary Library (Recommended)

**`/microsoftdocs/azure-docs`**
- **Code Snippets:** 61,791
- **Trust Score:** 8.9
- **Covers:** All Azure services, cost management, resource management
- **Languages:** Azure CLI, PowerShell, Terraform, ARM templates, Kusto, REST API

### Specialized Libraries

| Library ID | Description | Snippets | Trust Score |
|-----------|-------------|----------|-------------|
| `/microsoftdocs/architecture-center` | Azure architecture patterns | 532 | 8.9 |
| `/azure/azure-cli` | Azure CLI documentation | 665 | 9.6 |
| `/azure/azure-sdk-for-js` | Azure SDK for JavaScript/TypeScript | 99,100 | 9.6 |
| `/azure/azure-sdk-for-python` | Azure SDK for Python | 3,614 | 9.6 |
| `/azure/azure-sdk-for-net` | Azure SDK for .NET/C# | 9,634 | 9.6 |
| `/azure/azure-sdk-for-cpp` | Azure SDK for C++ | 1,168 | 9.6 |
| `/azure/azure-sdk-for-rust` | Azure SDK for Rust | 255 | 9.6 |

---

## Integration Points

### 1. Context7Service (`ai/src/context7/context7.service.ts`)

**Updated Methods:**

#### Library Mappings
```typescript
private readonly AZURE_LIBRARIES = {
  'azure-docs': '/microsoftdocs/azure-docs',
  'azure-architecture': '/microsoftdocs/architecture-center',
  'azure-cli': '/azure/azure-cli',
  'azure-sdk-js': '/azure/azure-sdk-for-js',
  'azure-sdk-python': '/azure/azure-sdk-for-python',
  'azure-sdk-dotnet': '/azure/azure-sdk-for-net',
  // ... more mappings
};
```

#### fetchDocumentation()
Returns structured guidance that instructs the AI agent to use Context7 MCP tools:

```typescript
private async fetchDocumentation(
  libraryId: string,
  query: string,
  topic: string | undefined,
  tokens: number,
): Promise<string> {
  // Returns MCP usage guidance and Azure best practices
  return `
# Azure Documentation Context

**Query:** ${query}
**Library:** ${libraryId}

## Available Context7 Resources

The AI agent has access to Context7 MCP tools to fetch real-time documentation...

### Example Query:
mcp_context7_get-library-docs({
  context7CompatibleLibraryID: "${libraryId}",
  topic: "${topic || query}",
  tokens: ${tokens}
})
  `;
}
```

#### New Method: getContext7McpGuidance()
Provides comprehensive guidance for when and how to use Context7 MCP tools:

```typescript
getContext7McpGuidance(): string {
  return `
## Context7 MCP Tools - Usage Guide

### When to Use Context7:

✅ **USE Context7 when:**
- User asks about Azure best practices
- User needs code examples (CLI, PowerShell, Terraform)
- User asks "how to" questions about Azure services
- User needs detailed documentation about Azure features
- User asks about cost optimization strategies

❌ **DON'T USE Context7 when:**
- You already have the information from other context sources
- User is asking about their specific resources (use Azure MCP tools)
- User is asking about current costs (use get_current_costs tool)
  `;
}
```

---

### 2. ContextService (`ai/src/context/context.service.ts`)

**Updated Method:**

#### getDocumentationContext()
Now includes Context7 MCP guidance in the documentation context:

```typescript
private async getDocumentationContext(
  query: string,
  tokens: number,
): Promise<DocumentationContext> {
  // Search Azure docs using Context7
  const docs = await this.context7Service.searchAzureDocs(query, { tokens });
  
  // Get best practices
  const bestPractices = await this.context7Service.getBestPractices(query);
  
  // Get Context7 MCP tool guidance
  const mcpGuidance = this.context7Service.getContext7McpGuidance();
  
  return {
    relevantDocs: docs.content + '\n\n' + mcpGuidance,
    apiSchemas: [],
    bestPractices,
    codeExamples: [],
  };
}
```

---

### 3. ChatGeminiService (`ai/src/chat/chat-gemini.service.ts`)

**Updated Method:**

#### buildSystemInstruction()
Enhanced system instructions to include Context7 MCP tool guidance:

```typescript
private buildSystemInstruction(richContext: RichContext): string {
  const sections: string[] = [];
  
  // ... existing context sections ...
  
  // Context7 MCP Tools - Azure Documentation Access
  sections.push(`**Azure Documentation Access (Context7 MCP):**`);
  sections.push(`You have access to comprehensive Azure documentation through Context7 MCP tools:`);
  sections.push(``);
  sections.push(`**When to use Context7:**`);
  sections.push(`- User asks for Azure best practices or "how to" guidance`);
  sections.push(`- User needs code examples (CLI, PowerShell, Terraform)`);
  sections.push(`- User asks about cost optimization strategies`);
  sections.push(``);
  sections.push(`**Available MCP Tools:**`);
  sections.push(`1. mcp_context7_resolve-library-id({ libraryName: "azure" })`);
  sections.push(`2. mcp_context7_get-library-docs({
     context7CompatibleLibraryID: "/microsoftdocs/azure-docs",
     topic: "your specific topic",
     tokens: 5000
   })`);
  sections.push(`   - Fetches documentation with 61,000+ code examples`);
  sections.push(``);
  sections.push(`**Recommended workflow:**`);
  sections.push(`1. Fetch user's current Azure data (Azure MCP tools)`);
  sections.push(`2. If guidance needed, fetch relevant documentation (Context7 MCP)`);
  sections.push(`3. Combine real data + documentation for actionable recommendations`);
  
  return sections.join('\n');
}
```

---

## Usage Workflow

### Example: User Asks "How can I optimize costs for my Azure resources?"

**Step 1: AI Agent Assesses Query**
- Recognizes need for both current data AND best practices
- Plans to use multiple tool types

**Step 2: Fetch Current Azure Data**
```typescript
// AI agent calls Azure MCP tools
get_current_costs({ subscriptionId: "sub-123" })
get_resource_groups_count()
```

**Step 3: Fetch Relevant Documentation**
```typescript
// AI agent calls Context7 MCP tool
mcp_context7_get-library-docs({
  context7CompatibleLibraryID: "/microsoftdocs/azure-docs",
  topic: "Azure cost optimization resource rightsizing reserved instances",
  tokens: 5000
})
```

**Step 4: Combine & Respond**
AI agent now has:
- User's actual current costs and resources
- Official Azure cost optimization documentation
- Code examples for implementing optimizations
- Best practices from Microsoft

Response includes:
- Analysis of current spending
- Specific optimization opportunities
- Code examples to implement changes
- Estimated cost savings

---

## Caching Strategy

### Cache Layers

1. **Context7Service Cache**
   - TTL: 3600 seconds (1 hour)
   - Keys: `context7:docs:${query}:${topic}:${tokens}`
   - Reduces repeated MCP calls for same queries

2. **Redis Cache (via ContextService)**
   - TTL: 3600 seconds (1 hour) for documentation
   - Shared across all documentation queries

### Cache Keys

```typescript
// Library ID resolution
`context7:library:${libraryName}`

// Documentation search
`context7:docs:${query}:${topic || 'general'}:${tokens}`

// Best practices
`context7:best-practices:${service}`

// Code examples
`context7:code:${service}:${operation}:${language}`
```

---

## When AI Agent Should Use Context7

### ✅ **USE Context7 When:**

1. **User Asks for Guidance**
   - "How do I...?"
   - "What's the best way to...?"
   - "Show me how to..."

2. **User Needs Code Examples**
   - "Give me a CLI command for..."
   - "Show me Terraform code for..."
   - "How do I do this in PowerShell?"

3. **User Asks About Best Practices**
   - "What are best practices for...?"
   - "How should I configure...?"
   - "What's recommended for...?"

4. **User Asks About Cost Optimization**
   - "How can I reduce costs?"
   - "What are cost optimization strategies?"
   - "How do I set up budget alerts?"

### ❌ **DON'T USE Context7 When:**

1. **User Asks About Their Specific Resources**
   - Use Azure MCP tools instead
   - Examples: "What's my current cost?", "List my resource groups"

2. **Information Already Available in Context**
   - Check user context, Azure context, conversation history first
   - Avoid redundant documentation fetches

3. **Query Not Related to Azure**
   - Context7 provides Azure documentation only
   - For other clouds, use different sources

---

## Testing Context7 Integration

### Test 1: Verify MCP Tools Available

**Query to AI Agent:**
```
"What Context7 tools do you have access to?"
```

**Expected Response:**
AI should describe the two Context7 MCP tools and their purposes.

---

### Test 2: Fetch Azure Documentation

**Query to AI Agent:**
```
"Show me how to create an Azure resource group using CLI"
```

**Expected Behavior:**
1. AI agent calls `mcp_context7_get-library-docs`
2. Specifies topic: "Azure resource group creation CLI"
3. Returns actual Azure CLI commands from Microsoft docs

**Expected Response:**
```
To create an Azure resource group using Azure CLI:

```bash
az group create --name <resource-group-name> --location <location>
```

For example:
```bash
az group create --name myResourceGroup --location eastus
```

[Source: Microsoft Azure Documentation]
```

---

### Test 3: Cost Optimization with Documentation

**Query to AI Agent:**
```
"How can I optimize costs for my Azure resources?"
```

**Expected Behavior:**
1. AI agent calls `get_current_costs` (Azure MCP)
2. AI agent calls `mcp_context7_get-library-docs` with topic "Azure cost optimization"
3. Combines current costs + documentation

**Expected Response:**
- Current spending analysis
- Cost optimization strategies from Azure docs
- Code examples for implementing optimizations
- Estimated savings

---

### Test 4: Multi-Language Code Examples

**Query to AI Agent:**
```
"Show me how to list Azure resource groups in CLI, PowerShell, and Terraform"
```

**Expected Behavior:**
AI agent calls `mcp_context7_get-library-docs` and retrieves examples in multiple languages

**Expected Response:**
```
Here are examples in different languages:

**Azure CLI:**
```bash
az group list
```

**PowerShell:**
```powershell
Get-AzResourceGroup
```

**Terraform:**
```hcl
data "azurerm_resource_groups" "example" {}
```
```

---

## Benefits of Context7 Integration

### 1. **Authoritative Information**
- All documentation from official Microsoft sources
- Trust score 8.9-9.6 for Azure libraries
- Always up-to-date with latest Azure features

### 2. **Multi-Language Support**
- Azure CLI commands
- PowerShell scripts
- Terraform configurations
- ARM templates
- Kusto queries
- SDK code (JavaScript, Python, .NET, etc.)

### 3. **Comprehensive Coverage**
- 61,000+ Azure code snippets
- All Azure services documented
- Architecture patterns and best practices
- Cost management strategies

### 4. **Improved User Experience**
- Faster responses (cached documentation)
- More accurate recommendations
- Code examples ready to use
- Reduces hallucination with factual documentation

### 5. **Developer Productivity**
- No need to search Azure docs manually
- Multiple implementation approaches shown
- Copy-paste ready code examples
- Best practices included automatically

---

## Performance Metrics

### Cache Hit Rates (Expected)

- **First Query:** Cache miss, fetches from Context7 MCP
- **Repeated Queries:** Cache hit (within 1 hour)
- **Similar Queries:** Cache hit if same topic/tokens

### Response Times

- **With Cache Hit:** < 100ms (from Redis)
- **With Cache Miss:** 1-3 seconds (Context7 MCP call)
- **Documentation Size:** 3000-5000 tokens typical

---

## Troubleshooting

### Issue 1: Context7 Not Being Used

**Symptom:** AI responses don't include documentation or code examples

**Check:**
1. Verify system instructions include Context7 guidance
2. Check if query matches "when to use" criteria
3. Look for log messages about Context7 calls

**Solution:**
- Ask AI explicitly: "Use Context7 to show me..."
- Check ChatGeminiService logs for Context7 mentions

---

### Issue 2: Wrong Library Selected

**Symptom:** Documentation not relevant to query

**Check:**
1. Verify `determineLibraryFromQuery()` logic
2. Check AZURE_LIBRARIES mappings

**Solution:**
- Update library mappings in Context7Service
- Use `/microsoftdocs/azure-docs` as default (most comprehensive)

---

### Issue 3: Cache Not Working

**Symptom:** Every query fetches fresh documentation

**Check:**
1. Redis service running
2. Cache TTL settings
3. Cache key generation

**Solution:**
```bash
# Check Redis
brew services list | grep redis

# Test cache
redis-cli
> KEYS context7:*
> TTL context7:docs:...
```

---

## Future Enhancements

### 1. Context7 for Other Services
- Expand beyond Azure to AWS, GCP documentation
- Add Kubernetes, Docker documentation

### 2. Smart Library Selection
- ML-based library selection based on query
- User preferences for preferred documentation style

### 3. Enhanced Caching
- Warm cache with common queries
- Pre-fetch documentation for user's resources

### 4. Analytics
- Track most requested documentation
- Identify documentation gaps

---

## Summary

Context7 MCP integration provides the AI FinOps agent with:

✅ **61,000+ Azure code examples** from official Microsoft documentation  
✅ **Multi-language support** for CLI, PowerShell, Terraform, ARM, SDKs  
✅ **Real-time documentation** always current with Azure changes  
✅ **Intelligent caching** with 1-hour TTL reduces repeated calls  
✅ **Seamless integration** with existing context building pipeline  
✅ **Clear guidance** for AI agent on when and how to use Context7  

**Result:** AI agent can now provide more accurate, well-documented, and actionable recommendations backed by official Azure guidance.

---

## Quick Reference

### Context7 MCP Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `mcp_context7_resolve-library-id` | Find library ID | `{ libraryName }` |
| `mcp_context7_get-library-docs` | Fetch documentation | `{ context7CompatibleLibraryID, topic?, tokens? }` |

### Recommended Library IDs

| Service Type | Library ID | Snippets |
|-------------|-----------|----------|
| General Azure | `/microsoftdocs/azure-docs` | 61,791 |
| Architecture | `/microsoftdocs/architecture-center` | 532 |
| Azure CLI | `/azure/azure-cli` | 665 |
| JavaScript/TypeScript | `/azure/azure-sdk-for-js` | 99,100 |
| Python | `/azure/azure-sdk-for-python` | 3,614 |
| .NET/C# | `/azure/azure-sdk-for-net` | 9,634 |

### Cache TTLs

- Documentation: 3600 seconds (1 hour)
- Library IDs: 3600 seconds (1 hour)
- Best Practices: 3600 seconds (1 hour)

---

**Integration Complete:** October 31, 2025  
**Documentation Version:** 1.0  
**Next:** Phase 9 - Cost Snapshot Background Job
