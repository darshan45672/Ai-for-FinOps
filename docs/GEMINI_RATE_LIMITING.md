# Gemini API Rate Limiting - Quick Guide

## Error 429: Resource Exhausted

### What It Means
You've exceeded the Gemini API rate limits for your tier.

### Common Causes
1. **Too many requests in short time** - Rapid-fire queries
2. **Free tier limits** - ~15 requests/minute, ~1500/day
3. **Large context windows** - Each message iteration counts as a request
4. **Function calling** - Multiple iterations = multiple API calls

---

## Solutions Implemented ✅

### 1. Automatic Retry with Exponential Backoff
**File:** `/ai/src/chat/chat-gemini.service.ts`

**What it does:**
- Automatically retries on 429 errors
- Waits 1s, 2s, 4s between retries
- Up to 3 retry attempts
- User-friendly error messages

**Code:**
```typescript
while (retries < maxRetries) {
  try {
    response = await client.models.generateContent({...});
    break; // Success
  } catch (error: any) {
    if (error.status === 429 && retries < maxRetries - 1) {
      const waitTime = Math.pow(2, retries) * 1000;
      this.logger.warn(`Rate limit hit, retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      retries++;
    } else {
      throw error;
    }
  }
}
```

### 2. User-Friendly Error Messages
Instead of technical errors, users see:
```
"API rate limit reached. Please wait a moment and try again. 
If this persists, consider upgrading your Gemini API quota."
```

---

## Manual Solutions

### Option 1: Wait and Retry ⏰
**Fastest:** Wait 1-2 minutes for quota to reset
- Free tier: Resets every minute
- Rate limits are rolling windows

### Option 2: Upgrade API Tier 💳
**Best for production:**

Visit: https://aistudio.google.com/app/apikey

**Free Tier:**
- 15 requests/minute
- 1,500 requests/day
- Best for: Testing, development

**Pay-as-you-go:**
- 360 requests/minute
- No daily limit
- ~$0.35 per 1M input tokens
- ~$1.05 per 1M output tokens
- Best for: Production use

**Enterprise:**
- Higher limits
- SLA guarantees
- Priority support

### Option 3: Reduce API Calls 📉

**Strategies:**

1. **Shorter conversations:**
   ```
   - Clear conversation history more often
   - Reduce MAX_ITERATIONS (currently 10)
   ```

2. **Optimize tool usage:**
   ```typescript
   // In chat-gemini.service.ts
   private readonly MAX_ITERATIONS = 5; // Reduce from 10
   ```

3. **Cache responses:**
   ```
   - Cache common queries
   - Reuse tool results
   - Store AI responses for similar questions
   ```

4. **Batch requests:**
   ```
   - Combine multiple questions
   - Process in queue
   - Throttle user requests
   ```

---

## Monitoring Rate Limits

### Check Current Usage
**Google AI Studio:**
https://aistudio.google.com/app/apikey

**View:**
- Requests today
- Requests this minute
- Quota remaining
- Usage graphs

### Add Logging
Already implemented in our code:
```typescript
this.logger.warn(`Rate limit hit (429), retrying...`);
```

Check logs:
```bash
tail -f logs/ai.log | grep "Rate limit"
```

---

## Preventing Rate Limits

### 1. Request Throttling
Add a delay between requests:

```typescript
// In chat.gateway.ts
private async handleChatMessage(...) {
  // Add 100ms delay between messages
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Process message...
}
```

### 2. Request Queue
Implement a queue system:

```typescript
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  
  async add(fn: () => Promise<any>) {
    this.queue.push(fn);
    if (!this.processing) {
      await this.process();
    }
  }
  
  private async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      await fn();
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
    }
    this.processing = false;
  }
}
```

### 3. Rate Limiter
Use a rate limiting library:

```bash
npm install rate-limiter-flexible
```

```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 15, // 15 requests
  duration: 60, // per 60 seconds
});

// Before each API call
await rateLimiter.consume(userId);
```

---

## Cost Optimization

### Current Setup (Free Tier)
- **Cost:** $0/month
- **Limits:** 15 req/min, 1500/day
- **Best for:** Development, testing

### Recommended for Production
- **Tier:** Pay-as-you-go
- **Expected cost:** ~$10-50/month (1M tokens)
- **Limits:** 360 req/min, unlimited daily
- **Benefits:** Predictable performance

### Calculate Your Costs
**Formula:**
```
Input tokens: ~5,000 per message (with context)
Output tokens: ~500 per response
Cost per message: ~$0.002

100 messages/day = $0.20/day = $6/month
500 messages/day = $1/day = $30/month
```

---

## Testing Rate Limits

### Trigger Rate Limit (for testing)
```bash
# Send 20 rapid requests
for i in {1..20}; do
  curl -X POST http://localhost:3004 \
    -H "Content-Type: application/json" \
    -d '{"message": "test"}' &
done
```

### Expected Behavior
1. First ~15 requests: ✅ Success
2. Next requests: ⚠️ Rate limit hit
3. Auto-retry: ⏰ Wait 1s, retry
4. If still rate limited: ⏰ Wait 2s, retry
5. If still rate limited: ⏰ Wait 4s, retry
6. After 3 retries: ❌ User error message

---

## Quick Fix Checklist

When you hit a rate limit:

- [ ] **Wait 60 seconds** - Quota resets every minute
- [ ] **Check API key quota** - Visit AI Studio
- [ ] **Restart AI service** - Apply retry logic
- [ ] **Reduce conversation length** - Clear history
- [ ] **Consider upgrading** - If persistent issue

---

## Environment Variables

Add to `.env` for rate limit configuration:

```bash
# Gemini API settings
GEMINI_RATE_LIMIT_RPM=15        # Requests per minute
GEMINI_MAX_RETRIES=3            # Retry attempts
GEMINI_RETRY_DELAY_BASE=1000    # Base delay in ms

# Auto-upgrade reminder
GEMINI_FREE_TIER=true           # Show upgrade message
```

---

## Summary

✅ **Implemented:**
- Automatic retry with exponential backoff
- User-friendly error messages
- Rate limit logging

⏳ **Next Steps (if needed):**
1. Wait 1-2 minutes and retry
2. Check your quota in AI Studio
3. Consider upgrading API tier
4. Implement request throttling
5. Add request queue

📚 **Resources:**
- Google AI Studio: https://aistudio.google.com/app/apikey
- Gemini API Pricing: https://ai.google.dev/pricing
- Error 429 Docs: https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429

---

**Date:** October 31, 2025  
**Status:** ✅ Rate Limiting Handled  
**Version:** 1.0
