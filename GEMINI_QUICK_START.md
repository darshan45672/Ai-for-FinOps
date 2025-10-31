# Gemini Integration Quick Start

## 🚀 Get Started in 3 Steps

### 1️⃣ Get Your API Key (2 minutes)
1. Visit: **https://aistudio.google.com/**
2. Sign in with Google
3. Click "Get API key" → "Create API key"
4. Copy the key (starts with `AIza...`)

### 2️⃣ Configure Environment
```bash
cd /Users/darshandineshbhandary/GitHub/Ai-for-FinOps/ai
```

Edit `.env` and replace `your_api_key_here`:
```bash
GEMINI_API_KEY=AIzaSyD...your-actual-key
```

### 3️⃣ Test It!
```bash
# Terminal 1 (Database)
cd ../database
npm run start:dev

# Terminal 2 (AI Service)
cd ../ai
npm run start:dev
```

## 🧪 Test Commands

Once services are running, test via frontend or WebSocket client:

**Test 1: Simple Question**
```
Message: "How many resource groups do I have?"
Expected: "You have X resource groups..."
```

**Test 2: Resource Query**
```
Message: "Show me all my virtual machines"
Expected: List of VMs with details
```

**Test 3: Cost Query**
```
Message: "What are my Azure costs for the last month?"
Expected: Cost breakdown by service
```

## 📊 What to Look For

### Success Indicators
✅ Logs show: `[GeminiService] Gemini service initialized successfully`
✅ Logs show: `[ChatGeminiService] Loaded 4 function declarations`
✅ You get natural language responses
✅ Function calls appear in logs when asking resource questions

### Common Issues
❌ "GEMINI_API_KEY is not configured" → Add key to `.env`
❌ "API key not valid" → Check key format (should start with `AIza`)
❌ Connection refused → Make sure database service is running
❌ No function calls → Database service might be down

## 🔧 Quick Debug

View real-time logs:
```bash
cd ai
tail -f ../logs/ai.log
```

Enable debug mode in `.env`:
```bash
LOG_LEVEL=debug
```

## 🎯 Success Criteria

You'll know it's working when:
1. AI service starts without errors
2. You ask "How many resource groups do I have?"
3. Logs show function call to `get_resource_groups_count`
4. You get a response like: "You have 5 resource groups..."

## 📚 More Info
See `/docs/GEMINI_MIGRATION.md` for complete documentation.

## 🆘 Need Help?
Check logs in `/logs/ai.log` for detailed error messages.

---

**Current Status**: ✅ Code ready! Just need your Gemini API key to test.
