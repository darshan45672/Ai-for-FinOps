# Context7 MCP - Quick Reference Card

## 🎯 What is Context7?

Access to **61,000+ Azure code examples** from official Microsoft documentation through MCP tools.

---

## 🛠️ Available MCP Tools

### 1. Resolve Library ID
```typescript
mcp_context7_resolve-library-id({ 
  libraryName: "azure" 
})
```
**Returns:** List of Azure documentation libraries with trust scores

---

### 2. Get Documentation
```typescript
mcp_context7_get-library-docs({
  context7CompatibleLibraryID: "/microsoftdocs/azure-docs",
  topic: "Azure resource groups cost management",
  tokens: 5000
})
```
**Returns:** Markdown documentation with code examples

---

## 📚 Top Azure Libraries

| Library | Snippets | Use For |
|---------|----------|---------|
| `/microsoftdocs/azure-docs` | 61,791 | General Azure (⭐ Default) |
| `/azure/azure-sdk-for-js` | 99,100 | JavaScript/TypeScript |
| `/azure/azure-sdk-for-python` | 3,614 | Python |
| `/azure/azure-sdk-for-net` | 9,634 | .NET/C# |
| `/azure/azure-cli` | 665 | CLI commands |
| `/microsoftdocs/architecture-center` | 532 | Architecture patterns |

---

## ✅ When to Use Context7

**USE when user asks for:**
- ✅ "How do I...?" (guidance)
- ✅ "Show me code for..." (examples)
- ✅ "What's the best way to...?" (best practices)
- ✅ Cost optimization strategies
- ✅ Multi-language code examples

**DON'T USE when:**
- ❌ User asks about their specific resources
- ❌ User asks for current costs
- ❌ Info already in context

---

## 🔄 Recommended Workflow

```
1. Fetch user's current data (Azure MCP tools)
   ↓
2. Fetch relevant documentation (Context7 MCP)
   ↓
3. Combine real data + docs
   ↓
4. Provide actionable recommendations
```

---

## 💾 Caching

- **TTL:** 1 hour
- **Key Format:** `context7:docs:${query}:${topic}:${tokens}`
- **Performance:**
  - Cache hit: <100ms
  - Cache miss: 1-3 seconds

---

## 🧪 Test Query

```typescript
mcp_context7_get-library-docs({
  context7CompatibleLibraryID: "/microsoftdocs/azure-docs",
  topic: "Azure cost optimization",
  tokens: 3000
})
```

**Expected:** Returns Azure cost optimization strategies with CLI/PowerShell/Terraform examples

---

## 📝 Example Response

```markdown
### Create Azure Resource Group with CLI
```bash
az group create --name myRG --location eastus
```

### Create Azure Resource Group with PowerShell
```powershell
New-AzResourceGroup -Name myRG -Location eastus
```

### Create Azure Resource Group with Terraform
```hcl
resource "azurerm_resource_group" "example" {
  name     = "myRG"
  location = "eastus"
}
```
```

---

## 🚀 Benefits

- ✅ 61,000+ official code examples
- ✅ Multi-language support
- ✅ Always up-to-date
- ✅ Authoritative (Microsoft docs)
- ✅ Fast (1-hour caching)

---

## 📍 Where It's Integrated

1. **Context7Service** - MCP guidance and library mappings
2. **ContextService** - Includes guidance in documentation context
3. **ChatGeminiService** - System instructions include Context7 usage

---

## 🔧 Services Status

```bash
# Database Service
http://localhost:3002 ✅

# AI Service  
http://localhost:3004 ✅

# Redis Cache
localhost:6379 ✅
```

---

## 📖 Full Documentation

See `/docs/CONTEXT7_MCP_INTEGRATION.md` for complete guide

---

**Integration Status:** ✅ COMPLETE  
**Last Updated:** October 31, 2025
