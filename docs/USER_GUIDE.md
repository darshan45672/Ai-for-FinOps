# User Guide - AI for FinOps

## Overview

Welcome to AI for FinOps! This guide will help you get started with the platform, understand its features, and make the most of the AI-powered Azure cost optimization capabilities.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Chat Interface](#chat-interface)
3. [Common Use Cases](#common-use-cases)
4. [Cost Optimization Workflows](#cost-optimization-workflows)
5. [Understanding Recommendations](#understanding-recommendations)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Getting Started

### 1. Create an Account

1. Navigate to http://localhost:3000 (or your production URL)
2. Click **"Sign Up"**
3. Enter your details:
   - Email address
   - Full name
   - Secure password
4. Click **"Register"**
5. You'll be automatically logged in

**Alternative**: Use **GitHub OAuth** for quick sign-up.

### 2. Configure Azure Credentials

Before using Azure features, you need to connect your Azure account:

1. Click your profile icon (top right)
2. Select **"Settings"**
3. Navigate to **"Azure Integration"**
4. Enter your Azure credentials:
   - **Subscription ID**: Found in Azure Portal → Subscriptions
   - **Tenant ID**: Found in Azure Portal → Microsoft Entra ID → Overview
   - **Client ID**: From your Azure App Registration
   - **Client Secret**: From your Azure App Registration (create if needed)
5. Click **"Save Credentials"**
6. Test connection: **"Test Azure Connection"**

**Note**: The AI will guide you through this process if you try to query Azure data without credentials configured.

### 3. Start Your First Conversation

1. Click **"New Chat"** in the sidebar
2. Type a question like:
   ```
   "What are my Azure costs this month?"
   ```
3. Press Enter or click Send
4. Wait for the AI to analyze and respond
5. Continue the conversation naturally

---

## Chat Interface

### Interface Overview

```
┌─────────────────────────────────────────────────────────┐
│  [☰] AI for FinOps              [Profile] [Settings]   │
├──────────────┬──────────────────────────────────────────┤
│              │  💬 Chat Title                           │
│ Conversations│  ────────────────────────────────────    │
│              │  You: What are my costs?                 │
│ + New Chat   │  ────────────────────────────────────    │
│              │  AI: Your total Azure costs this month   │
│ Recent:      │  are $456.78. Here's the breakdown...    │
│ • Cost       │  [Chart/Table]                           │
│   Analysis   │  ────────────────────────────────────    │
│ • Resource   │  You: Which resources cost the most?     │
│   Review     │  ────────────────────────────────────    │
│ • Security   │  AI: Analyzing your resources...         │
│   Audit      │  [Loading Animation]                     │
│              │                                          │
│              │  ┌────────────────────────────────────┐  │
│              │  │ Type your message...               │  │
│              │  │                                    │  │
│              │  └────────────────────────────────────┘  │
│              │                              [Send] ↑    │
└──────────────┴──────────────────────────────────────────┘
```

### Features

**Sidebar**
- **New Chat**: Start a fresh conversation
- **Recent Conversations**: Access previous chats
- **Search**: Find specific conversations

**Chat Area**
- **Message History**: Scroll through past messages
- **Real-time Responses**: Watch AI think and respond
- **Rich Formatting**: Tables, charts, code blocks
- **Action Buttons**: Copy, regenerate, share responses

**Input Area**
- **Text Input**: Type your questions
- **Multiline Support**: Shift+Enter for new lines
- **Keyboard Shortcuts**: Enter to send
- **Attachments** (Coming Soon): Upload files

---

## Common Use Cases

### 1. Cost Analysis

**Query**: "What are my Azure costs this month?"

**What the AI Does:**
1. Queries Azure Cost Management API
2. Aggregates costs by service
3. Identifies top spending resources
4. Presents formatted summary

**Expected Response:**
```
Your total Azure costs for November 2025 are $456.78.

Breakdown by Service:
• Compute (VMs):         $200.50 (44%)
• Networking:            $206.03 (45%)
• Storage:               $50.25  (11%)

Top Resources:
1. vm-prod-01           $150.00
2. appgw-frontend       $125.00
3. storage-backups      $45.00

Would you like me to provide cost optimization recommendations?
```

---

### 2. Resource Discovery

**Query**: "List all my virtual machines"

**What the AI Does:**
1. Discovers Azure MCP tools
2. Executes Azure Resource Graph query
3. Filters for VM resources
4. Formats results

**Expected Response:**
```
I found 12 virtual machines across your subscriptions:

Production (8 VMs):
• vm-prod-01    | Standard_D4s_v3 | eastus    | Running
• vm-prod-02    | Standard_D4s_v3 | eastus    | Running
• vm-prod-03    | Standard_D2s_v3 | westus    | Stopped

Development (4 VMs):
• vm-dev-01     | Standard_B2s    | eastus    | Running
• vm-dev-02     | Standard_B2s    | eastus    | Stopped (Deallocated)

💡 Tip: 2 VMs are stopped but not deallocated, still incurring costs.
```

---

### 3. Cost Trends

**Query**: "Show me cost trends over the last 30 days"

**What the AI Does:**
1. Queries cost snapshot database
2. Retrieves historical data
3. Analyzes trends
4. Creates visualization

**Expected Response:**
```
Here's your cost trend for the last 30 days:

[Cost Chart - Line Graph]
Day 1:  $420
Day 15: $445
Day 30: $457

Analysis:
• Average daily cost: $442
• Trend: ↑ Increasing (+8.8%)
• Highest day: Nov 28 ($475)
• Lowest day: Nov 3 ($405)

The increase is primarily driven by:
1. New VM deployments (+$25/day)
2. Increased storage usage (+$8/day)

Recommendation: Review the new VMs for right-sizing opportunities.
```

---

### 4. Resource Optimization

**Query**: "Find resources I'm not using"

**What the AI Does:**
1. Queries all resources
2. Checks utilization metrics
3. Identifies unused resources
4. Calculates potential savings

**Expected Response:**
```
I found 8 underutilized or unused resources:

Stopped VMs (Not Deallocated):
• vm-test-03 - Stopped for 45 days
  Potential savings: $120/month

Unused Storage Accounts:
• storage-old-backups - No activity in 90 days
  Potential savings: $25/month

Orphaned Disks:
• disk-unattached-01 - Not attached to any VM
  Potential savings: $15/month

Total Potential Savings: $160/month ($1,920/year)

Would you like me to create action items for these resources?
```

---

### 5. Security Analysis

**Query**: "Check for security issues in my resources"

**What the AI Does:**
1. Queries Azure Security Center / Defender
2. Analyzes configurations
3. Identifies vulnerabilities
4. Prioritizes by severity

**Expected Response:**
```
Security Analysis Complete:

High Priority (3):
⚠️ Storage account 'prod-data' has public access enabled
⚠️ VM 'web-server-01' missing latest security patches
⚠️ Network security group allows 0.0.0.0/0 on port 22

Medium Priority (7):
⚡ 5 VMs without Azure Backup configured
⚡ 2 Key Vaults without soft-delete enabled

Low Priority (12):
• Outdated diagnostic settings
• Missing resource tags

I recommend addressing high-priority issues immediately. 
Would you like detailed remediation steps?
```

---

### 6. Documentation Queries

**Query**: "How do I configure auto-scaling for Azure App Service?"

**What the AI Does:**
1. Recognizes documentation request
2. Queries Context7 MCP for Azure docs
3. Retrieves official guidance
4. Presents step-by-step instructions

**Expected Response:**
```
Here's how to configure auto-scaling for Azure App Service:

Prerequisites:
• Standard (S1) or higher App Service Plan
• Performance metrics enabled

Steps:

1. Navigate to App Service in Azure Portal
2. Select "Scale out (App Service plan)"
3. Choose "Custom autoscale"
4. Configure scale conditions:

   Scale Out (Add instances):
   • Metric: CPU Percentage
   • Operator: Greater than
   • Threshold: 70%
   • Duration: 5 minutes
   • Action: Increase count by 1

   Scale In (Remove instances):
   • Metric: CPU Percentage
   • Operator: Less than
   • Threshold: 30%
   • Duration: 5 minutes
   • Action: Decrease count by 1

5. Set instance limits:
   • Minimum: 2
   • Maximum: 10
   • Default: 2

6. Click "Save"

Best Practices:
✓ Set minimum of 2 for high availability
✓ Monitor scale actions in Activity Log
✓ Use Application Insights for detailed metrics
✓ Test scaling with load testing tools

Would you like help configuring any specific metrics?

Source: Official Azure App Service documentation
```

---

### 7. Complex Multi-Step Analysis

**Query**: "Find all App Services, check their pricing tiers, and recommend cost optimizations"

**What the AI Does:**
1. **Iteration 1**: Query Azure for App Services
2. **Iteration 2**: Get pricing details for each
3. **Iteration 3**: Analyze configurations and usage
4. **Iteration 4**: Generate recommendations
5. **Final Response**: Formatted summary

**Expected Response:**
```
App Service Analysis Complete:

Found 5 App Services:

1. webapp-prod-api
   • Current Tier: P1v3 (Premium)
   • Cost: $146/month
   • Usage: 15% CPU, 30% Memory
   • Recommendation: Downgrade to S1 (Standard)
   • Potential Savings: $92/month

2. webapp-prod-frontend
   • Current Tier: P1v3 (Premium)
   • Cost: $146/month
   • Usage: 45% CPU, 60% Memory
   • Recommendation: Keep current tier (justified usage)

3. webapp-dev-test
   • Current Tier: P1v3 (Premium)
   • Cost: $146/month
   • Usage: 5% CPU, 10% Memory
   • Recommendation: Downgrade to B1 (Basic) or use Free tier
   • Potential Savings: $136/month

4. webapp-staging
   • Current Tier: S1 (Standard)
   • Cost: $73/month
   • Usage: 20% CPU, 25% Memory
   • Recommendation: Already optimized

5. webapp-demo
   • Current Tier: P1v3 (Premium)
   • Cost: $146/month
   • Usage: 2% CPU, 5% Memory
   • Recommendation: Consider Free tier or shut down
   • Potential Savings: $146/month

Total Potential Savings: $374/month ($4,488/year)

I've saved these recommendations to your account. 
Would you like me to help implement any of these changes?
```

---

## Cost Optimization Workflows

### Daily Routine

1. **Morning Check-In**
   ```
   "What were my costs yesterday?"
   ```

2. **Weekly Review**
   ```
   "Show cost trends for the last 7 days"
   "Any anomalies or unexpected spikes?"
   ```

3. **Monthly Planning**
   ```
   "Compare this month's costs to last month"
   "What are my top 10 most expensive resources?"
   "Give me cost optimization recommendations"
   ```

### Optimization Workflow

1. **Discovery**
   ```
   "Find underutilized resources"
   ```

2. **Analysis**
   ```
   "Why is this resource expensive?"
   "What's the right size for my workload?"
   ```

3. **Action**
   ```
   "Create a plan to optimize vm-prod-03"
   "What are the steps to implement this recommendation?"
   ```

4. **Tracking**
   ```
   "Show my accepted recommendations and their status"
   "Update recommendation #123 as completed"
   ```

---

## Understanding Recommendations

### Recommendation Types

1. **COST_OPTIMIZATION**
   - Right-sizing VMs
   - Storage tier changes
   - Unused resource cleanup
   - Reserved instance opportunities

2. **SECURITY**
   - Public access issues
   - Missing security features
   - Vulnerability patches
   - Compliance violations

3. **PERFORMANCE**
   - Scaling recommendations
   - Configuration improvements
   - Architecture optimizations

4. **RELIABILITY**
   - Backup configurations
   - High availability setup
   - Disaster recovery planning

5. **OPERATIONAL_EXCELLENCE**
   - Monitoring improvements
   - Automation opportunities
   - Best practice adoption

### Recommendation Statuses

- **PENDING**: New recommendation, awaiting review
- **ACCEPTED**: You've agreed to implement
- **REJECTED**: Decided not to implement
- **COMPLETED**: Successfully implemented
- **IGNORED**: Dismissed for now

### Managing Recommendations

**View All Recommendations**
```
"Show me all pending recommendations"
"What cost optimizations do you recommend?"
```

**Update Status**
```
"Mark recommendation #45 as accepted"
"I've completed the VM downgrade recommendation"
```

**Filter Recommendations**
```
"Show only security recommendations"
"What cost optimizations have I accepted?"
```

---

## Best Practices

### 1. Regular Check-ins

- **Daily**: Quick cost review (2 minutes)
- **Weekly**: Trend analysis (10 minutes)
- **Monthly**: Comprehensive review (30 minutes)

### 2. Effective Queries

**Good Questions:**
```
✓ "What are my Azure costs this month?"
✓ "Find VMs in the production resource group"
✓ "Show cost trends for the last 30 days"
✓ "Check for security issues in eastus region"
```

**Less Effective:**
```
✗ "Costs?" (too vague)
✗ "Fix everything" (too broad)
✗ "Why is it expensive?" (needs context)
```

### 3. Context Matters

The AI remembers your conversation. Build on previous messages:

```
You: "List all VMs in production"
AI:  [Shows 10 VMs]

You: "Which ones are the most expensive?"
AI:  [Analyzes costs for those 10 VMs specifically]

You: "Give me optimization recommendations for the top 3"
AI:  [Provides targeted recommendations]
```

### 4. Act on Recommendations

- Review recommendations weekly
- Prioritize by potential savings
- Test in development before production
- Track implementation progress

### 5. Tag Resources

Use Azure tags for better insights:
```
environment: production
cost-center: engineering
owner: team-backend
auto-shutdown: true
```

The AI uses tags to provide better context and recommendations.

---

## Troubleshooting

### Issue: AI doesn't respond

**Possible Causes:**
- Network connectivity issues
- Service temporarily down
- Rate limit exceeded (429 error)

**Solutions:**
1. Check internet connection
2. Refresh page (F5)
3. Wait 30 seconds and try again
4. Check service status in logs

---

### Issue: "Failed to fetch Azure data"

**Possible Causes:**
- Azure credentials not configured
- Invalid credentials
- Insufficient permissions

**Solutions:**
1. Go to Settings → Azure Integration
2. Verify all credentials are correct
3. Click "Test Connection"
4. Ensure your Azure account has Reader access minimum

---

### Issue: AI provides outdated information

**Possible Causes:**
- Redis cache serving stale data

**Solutions:**
1. Use specific time-based queries:
   ```
   "What are my costs TODAY?"
   ```
2. Cache automatically refreshes based on TTL
3. Fresh queries pull latest data from Azure

---

### Issue: Slow responses

**Possible Causes:**
- Complex query requiring multiple Azure API calls
- First-time query (cache miss)
- High API usage

**Solutions:**
1. Be patient - complex queries take 5-10 seconds
2. Subsequent similar queries will be faster (cached)
3. Break complex queries into smaller parts

---

### Issue: "Context not found" error

**Possible Causes:**
- Conversation not properly saved
- Database connection issue

**Solutions:**
1. Start a new conversation
2. Previous history may be lost (temporary issue)
3. Contact support if issue persists

---

## FAQ

**Q: Is my data secure?**  
A: Yes. All data is encrypted in transit (HTTPS) and at rest. Azure credentials are stored in Azure Key Vault. See our [Security Policy](../SECURITY.md) for details.

**Q: How accurate are the cost estimates?**  
A: Cost data comes directly from Azure Cost Management API in real-time. Historical data is collected daily via automated jobs.

**Q: Can I use this with multiple Azure subscriptions?**  
A: Yes! The AI can query across all subscriptions you have access to. Configure each subscription in Settings.

**Q: Does the AI take actions automatically?**  
A: No. The AI only provides recommendations. All changes to Azure resources must be manually approved and implemented by you.

**Q: What if I disagree with a recommendation?**  
A: You can reject or ignore recommendations. The AI learns from your feedback to provide better suggestions over time.

**Q: Can I export reports?**  
A: (Coming Soon) Report export functionality is planned for a future release.

**Q: How is this different from Azure Advisor?**  
A: AI for FinOps combines Azure Advisor insights with real-time conversation, historical context, documentation grounding, and personalized recommendations based on your specific usage patterns.

**Q: Can multiple team members use the same account?**  
A: Currently, each user needs their own account. Multi-user tenancy is planned for future releases.

**Q: How much does it cost to run this?**  
A: See [Deployment Guide](./DEPLOYMENT_GUIDE.md#cost-optimization) for estimated Azure infrastructure costs (~$350/month for production setup).

**Q: Can I contribute or customize?**  
A: Yes! The project is open-source. See [Contributing Guidelines](../CONTRIBUTING.md) for details.

---

## Getting Help

### Resources

- **Documentation**: `/docs` folder
- **API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Testing Guide**: [END_TO_END_TESTING_GUIDE.md](./END_TO_END_TESTING_GUIDE.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Support Channels

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas
- **Email**: support@ai-finops.com (if configured)

### In-App Help

Ask the AI itself!
```
"How do I configure Azure credentials?"
"What can you help me with?"
"Show me examples of questions I can ask"
```

The AI is designed to be self-documenting and helpful!

---

## Conclusion

AI for FinOps is designed to make Azure cost management simple, intelligent, and conversational. The more you use it, the better it understands your environment and provides personalized insights.

**Next Steps:**
1. ✅ Configure Azure credentials
2. ✅ Start your first conversation
3. ✅ Review daily/weekly cost trends
4. ✅ Implement first cost optimization
5. ✅ Track savings over time

**Happy optimizing!** 🚀💰

---

**Last Updated:** November 1, 2025  
**Version:** 1.0.0  
**Feedback:** We'd love to hear from you! Share your experience and suggestions.
