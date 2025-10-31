# Get Your Gemini API Key - Step by Step

## 📍 Direct Link
**https://aistudio.google.com/app/apikey**

## 🎯 Visual Steps

### Step 1: Open Google AI Studio
1. Click this link: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. You'll see the "API keys" page

### Step 2: Sign In
- Use your Google account (any Gmail account works)
- If not signed in, click "Sign in" button
- Authorize the application

### Step 3: Create API Key
You'll see one of these options:

**Option A: If you have a Google Cloud project**
1. Click "Create API key in existing project"
2. Select your project from dropdown
3. Click "Create API key"

**Option B: If you don't have a project (most common)**
1. Click "Create API key"
2. The system will automatically create a project for you
3. Default project name: "Generative Language Client"

### Step 4: Copy Your Key
1. A popup appears with your API key
2. Key format: `AIzaSy...` (39 characters)
3. Click the **copy icon** 📋
4. Save it somewhere safe temporarily

### Step 5: Enable the API (if prompted)
If you see "Enable API" button:
1. Click "Enable Generative Language API"
2. Wait ~30 seconds for activation
3. Refresh the page
4. Your API key should now be visible

## 📝 Add to Your Project

### Copy the key and run:
```bash
cd /Users/darshandineshbhandary/GitHub/Ai-for-FinOps/ai
```

### Open .env and update:
```bash
# Before
GEMINI_API_KEY=your_api_key_here

# After (example - use YOUR actual key)
GEMINI_API_KEY=AIzaSyD_example_key_not_real_get_yours
```

## ✅ Verify It Works

### Test command:
```bash
npm run start:dev
```

### Expected output:
```
[GeminiService] Gemini service initialized successfully
[GeminiService] Using model: gemini-2.0-flash
```

### If you see this error:
```
Error: GEMINI_API_KEY is not configured
```
**Solution**: Double-check the key is correctly pasted in `.env`

### If you see this error:
```
Error: API key not valid
```
**Solutions**:
1. Make sure you copied the full key (should be ~39 characters)
2. Check for extra spaces before/after the key
3. Verify the API is enabled in Google Cloud Console
4. Try creating a new API key

## 🔒 Security Tips

1. **Don't share your API key** - It's like a password
2. **Don't commit to Git** - Already in `.gitignore` ✅
3. **Use different keys** - Separate for dev/staging/prod
4. **Rotate periodically** - Can revoke and create new ones

## 📊 Free Tier Limits

Your free API key includes:
- ✅ 15 requests per minute
- ✅ 1,500 requests per day
- ✅ 1 million tokens per minute

This is enough for:
- Development and testing
- Small production apps
- Learning and experimentation

## 🚀 Next Steps

Once you have your key:
1. ✅ Add to `/ai/.env`
2. ✅ Start database service: `cd database && npm run start:dev`
3. ✅ Start AI service: `cd ai && npm run start:dev`
4. ✅ Test: "How many resource groups do I have?"

## 📞 Need Help?

**Can't access the site?**
- Try incognito/private mode
- Clear browser cache
- Try different browser
- Check if you're behind corporate firewall

**API not working?**
- Wait 2-3 minutes after creating (propagation time)
- Check Google Cloud Console for API status
- Verify billing is enabled (free tier doesn't require card)

**Still stuck?**
- Google AI Studio Help: https://ai.google.dev/docs
- Check `/logs/ai.log` for detailed errors

---

**Ready?** Get your key now: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) 🚀
