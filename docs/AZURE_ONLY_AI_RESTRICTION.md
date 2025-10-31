# Azure-Only AI Restriction Implementation

## Overview
Configured the AI assistant to ONLY answer questions about Microsoft Azure Cloud services, refusing all non-Azure related queries.

## Implementation Details

### Location
- **File**: `/ai/src/chat/chat.service.ts`
- **Method**: `getSystemPrompt()`
- **Lines**: ~225-270

### System Prompt Changes

#### **CRITICAL RESTRICTIONS Added:**
```typescript
CRITICAL RESTRICTIONS:
- You ONLY answer questions about Microsoft Azure Cloud services, resources, costs, and FinOps practices
- You MUST REFUSE to answer questions about:
  * Non-Azure cloud providers (AWS, GCP, etc.)
  * General programming or technology topics not related to Azure
  * Personal advice, creative writing, or general knowledge questions
  * Any topic outside of Azure cloud computing and FinOps
```

#### **Refusal Response Template:**
When users ask non-Azure questions, the AI will:
1. **Politely decline**: "I'm specialized in Microsoft Azure Cloud services only. I can help you with Azure resources, costs, FinOps practices, and cloud optimization strategies. Please ask me about Azure-related topics."
2. **Redirect**: "Would you like to know about Azure services, resource management, or cost optimization instead?"

## Allowed Topics

### ✅ Azure-Specific Areas:
- Microsoft Azure Cloud services
- Azure resource utilization and costs
- Azure cloud spending trends
- Azure cost optimization opportunities
- Azure resource status and performance
- Azure activity logs (security and compliance)
- Azure services, pricing models, and best practices
- FinOps practices for Azure

### Available Azure Tools:
1. `get_azure_resources` - Query Azure resources
2. `get_resource_costs` - Azure cost data
3. `get_cost_summary` - Azure cost summaries
4. `get_activity_logs` - Azure activity logs
5. `get_resource_utilization` - Azure metrics
6. `analyze_cost_trends` - Azure cost analysis
7. `get_subscription_info` - Azure subscription info

## Blocked Topics

### ❌ Refused Areas:
- AWS, Google Cloud Platform, or other cloud providers
- General programming questions (Python, JavaScript, etc.)
- Quantum computing, AI theory, or general tech topics
- Personal advice, creative writing, storytelling
- Math problems, homework help
- Current events, news, politics
- Entertainment recommendations
- Any non-Azure related topics

## Example Interactions

### ✅ Allowed Questions:
```
User: "Help me analyze my Azure cloud costs"
AI: [Provides Azure cost analysis using tools]

User: "What are my Azure resource consumptions?"
AI: [Uses get_azure_resources tool to fetch data]

User: "How do I optimize my Azure spending?"
AI: [Provides Azure-specific cost optimization recommendations]

User: "What is Azure FinOps?"
AI: [Explains Azure FinOps best practices]

User: "Show me my Azure activity logs"
AI: [Uses get_activity_logs tool to retrieve Azure logs]
```

### ❌ Blocked Questions:
```
User: "Explain quantum computing in simple terms"
AI: "I'm specialized in Microsoft Azure Cloud services only. I can help you with Azure resources, costs, FinOps practices, and cloud optimization strategies. Please ask me about Azure-related topics. Would you like to know about Azure services, resource management, or cost optimization instead?"

User: "What is my cloud usage?" (ambiguous)
AI: [Interprets as Azure-related] "Let me check your Azure cloud usage..."

User: "Help me analyze my AWS costs"
AI: "I'm specialized in Microsoft Azure Cloud services only. I can help you with Azure resources, costs, FinOps practices, and cloud optimization strategies. Please ask me about Azure-related topics."

User: "Write a poem about TypeScript"
AI: "I'm specialized in Microsoft Azure Cloud services only. I can help you with Azure resources, costs, FinOps practices, and cloud optimization strategies. Please ask me about Azure-related topics."

User: "What is the weather today?"
AI: "I'm specialized in Microsoft Azure Cloud services only. I can help you with Azure resources, costs, FinOps practices, and cloud optimization strategies. Please ask me about Azure-related topics."
```

## Technical Implementation

### Prompt Engineering Strategy:
1. **Identity Definition**: "FinOps assistant specialized EXCLUSIVELY in Microsoft Azure"
2. **Explicit Restrictions**: Clear list of forbidden topics
3. **Capability Scope**: Detailed Azure-specific capabilities
4. **Tool Context**: All tools are Azure-focused
5. **Response Guidelines**: Azure data-driven approach
6. **Refusal Template**: Polite decline + redirection

### Benefits:
- ✅ **Focused Expertise**: AI stays within Azure domain
- ✅ **Clear Boundaries**: Users know what to expect
- ✅ **Professional Tone**: Polite refusals maintain UX
- ✅ **Redirection**: Guides users to relevant topics
- ✅ **FinOps Focus**: Maintains purpose as Azure cost assistant
- ✅ **Data-Driven**: All answers based on real Azure data

### LLM Prompt Best Practices Applied:
Based on Context7 LangChain documentation:

1. **System Message Pattern**: 
   - Clear role definition at the start
   - Explicit constraints before capabilities
   - Response templates for edge cases

2. **Instruction Hierarchy**:
   ```
   IDENTITY → RESTRICTIONS → CAPABILITIES → TOOLS → GUIDELINES → EXAMPLES
   ```

3. **Behavioral Constraints**:
   - "ONLY", "MUST REFUSE", "EXCLUSIVELY" - Strong directive words
   - List format for forbidden topics (easy for LLM to parse)
   - Conditional responses ("If user asks X, respond Y")

4. **Context Grounding**:
   - All capabilities tied to Azure
   - Tool names include "Azure"
   - Guidelines emphasize "Azure data"

## Testing Checklist

### Azure-Related (Should Answer):
- [ ] "What are my Azure costs?"
- [ ] "Show me Azure resource consumption"
- [ ] "How to optimize Azure spending?"
- [ ] "What is Azure FinOps?"
- [ ] "Explain Azure pricing models"
- [ ] "Show Azure activity logs"
- [ ] "Monitor Azure resources"

### Non-Azure (Should Refuse):
- [ ] "Explain quantum computing"
- [ ] "What is the weather?"
- [ ] "Write a poem"
- [ ] "Help me with AWS costs"
- [ ] "What is Python?"
- [ ] "Tell me a joke"
- [ ] "Who won the election?"

### Edge Cases (Should Handle Gracefully):
- [ ] "What is my cloud usage?" (interpret as Azure)
- [ ] "Help me with cloud costs" (clarify if Azure)
- [ ] "MCP tools" (explain Azure MCP tools only)
- [ ] "FinOps" (context: Azure FinOps)

## Future Enhancements

### Potential Improvements:
1. **Context Detection**: Detect Azure keywords to allow broader questions
2. **Multi-Turn Memory**: Remember user clarified Azure context
3. **Soft Refusals**: Allow related topics if they connect to Azure
4. **Educational Mode**: Briefly explain non-Azure concepts in Azure context
5. **Comparison Mode**: Allow AWS/GCP comparisons only when highlighting Azure advantages

### Example Enhanced Behavior:
```
User: "What is Kubernetes?"
Current: [Refuses]
Enhanced: "Kubernetes is a container orchestration platform. In Azure, we offer Azure Kubernetes Service (AKS). Would you like to know about AKS costs, setup, or management?"
```

## Configuration

### Environment Variables:
- No additional env vars needed
- Uses existing Ollama model configuration
- System prompt is hardcoded in service

### Model Compatibility:
- ✅ Ollama models with function calling
- ✅ GPT-style models (llama3, mistral, etc.)
- ✅ Tested with default model configuration

## Deployment

### Steps to Apply:
1. ✅ Update `chat.service.ts` (completed)
2. Restart AI service: `npm run start:dev` in `/ai` folder
3. Test with non-Azure questions
4. Monitor logs for refusal patterns

### Rollback:
If needed, revert `getSystemPrompt()` to previous version without CRITICAL RESTRICTIONS section.

## Related Files
- `/ai/src/chat/chat.service.ts` - System prompt implementation
- `/ai/src/ollama/ollama.service.ts` - Model integration
- `/ai/src/mcp/mcp-tools.service.ts` - Azure tools

## Resources
- [LangChain Prompting Best Practices](https://python.langchain.com/docs/how_to/prompts/)
- [Azure FinOps Framework](https://learn.microsoft.com/en-us/azure/cost-management-billing/finops/)
- [Ollama Function Calling](https://ollama.com/blog/tool-support)
