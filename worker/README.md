# Blog View Counter - Cloudflare Worker Setup

This directory contains the Cloudflare Worker for tracking blog post view counts using Cloudflare KV storage.

## Prerequisites

- Cloudflare account
- Node.js and npm installed
- Wrangler CLI (Cloudflare's CLI tool)

## Step 1: Install Wrangler

If you haven't already, install Wrangler globally:

```bash
npm install -g wrangler
```

Or install it locally in your project:

```bash
npm install --save-dev wrangler
```

## Step 2: Authenticate with Cloudflare

Log in to your Cloudflare account:

```bash
wrangler login
```

This will open a browser window for authentication.

## Step 3: Create a KV Namespace

Create a KV namespace for storing view counts:

```bash
wrangler kv namespace create "BLOG_VIEWS"
```

This will output something like:

```
🌀 Creating namespace with title "blog-view-counter-BLOG_VIEWS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "BLOG_VIEWS", id = "abc123def456..." }
```

**Important:** Copy the `id` value from the output!

### For Preview Environment (Optional)

If you want a separate namespace for testing:

```bash
wrangler kv namespace create "BLOG_VIEWS" --preview
```

## Step 4: Update wrangler.toml

Open `worker/wrangler.toml` and replace `YOUR_KV_NAMESPACE_ID` with the actual ID from Step 3:

```toml
[[kv_namespaces]]
binding = "BLOG_VIEWS"
id = "abc123def456..."  # Replace with your actual ID
```

If you created a preview namespace, add it too:

```toml
[[kv_namespaces]]
binding = "BLOG_VIEWS"
id = "your-production-id"
preview_id = "your-preview-id"
```

## Step 4a: Add a Deduplication Salt

The worker hashes each requester IP with a salt to deduplicate views server-side. Generate a random salt and store it locally by running:

```bash
npm run generate:dedup-salt
```

This creates/updates `worker/.dev.vars` (ignored by git) with a fresh `DEDUP_SALT` for `wrangler dev`.

For production/staging deployments, set the same value as a Cloudflare secret:

```bash
cd worker
wrangler secret put DEDUP_SALT
# paste the salt printed by the script above
```

Keep this salt private and rotate it if it ever leaks.

Why all this dedup salt? Basically, hashing keeps IPs private, the per-IP-per-slug KV entry gives server-side dedup, and forcing an external salt lets us rotate the hash basis without redeploying code. Treat this as a lightweight, privacy-preserving dedup baseline; we can always revisit it if more accuracy or longer retention is needed.

## Step 4b: Configure an API Key (Optional but Recommended)

To prevent arbitrary POST requests, the worker can require an `X-Worker-Api-Key` header. Use the helper script to generate and store the key locally:

```bash
npm run generate:view-counter-api-key
```

This writes `VIEW_COUNTER_API_KEY=...` to `worker/.dev.vars` and `PUBLIC_VIEW_COUNTER_API_KEY=...` to `.env` and `.env.production`.

Then set the same value in production using Wrangler secrets:

```bash
cd worker
wrangler secret put VIEW_COUNTER_API_KEY
```

> [!WARNING] If you embed the key in the client, motivated users can still copy it from requests, so combine this with rate limiting and monitoring. For stricter protection, inject the header via Cloudflare Rules/Transform or Cloudflare Access so the browser never sees the key.

## Step 4c: Configure Allowed Origins

Set the list of origins (comma-separated) that are allowed to call the worker. Example:

```
ALLOWED_ORIGINS=https://sumit.ml,http://localhost:4321
```

Add this line to `worker/.dev.vars` for local development. For production/staging, set `ALLOWED_ORIGINS` via the Cloudflare Workers dashboard (Settings → Variables) or pass `--var ALLOWED_ORIGINS=...` when deploying with Wrangler. Include every production domain, preview URL, and dev host you rely on.

> [!IMPORTANT] In the dashboard, the variable name must be exactly `ALLOWED_ORIGINS` (no `=`). Each value must include the scheme (e.g., `https://`). Typos here will cause the worker to return 500 on every CORS preflight. Please manually go to the worker's settings and check the value of the variable to ensure it is correct & does not end up throwing 500 errors in your network tab.

## Step 5: Test Locally

Test the worker locally before deploying:

```bash
cd worker
wrangler dev
```

This will start a local server (usually at `http://localhost:8787`).

### Test the API

**Increment a view count:**
```bash
curl -X POST http://localhost:8787/views/test-blog-post
```

**Get a view count:**
```bash
curl http://localhost:8787/views/test-blog-post
```

You should see responses like:
```json
{"slug":"test-blog-post","views":1}
```

## Step 6: Deploy to Cloudflare

Once testing is successful, deploy the worker:

```bash
wrangler deploy
```

After deployment, Wrangler will output your worker's URL:
```
Published blog-view-counter (X.XX sec)
  https://blog-view-counter.YOUR_SUBDOMAIN.workers.dev
```

**Copy this URL!** You'll need it for the next step.

## Step 7: Configure Your Astro Site

### Option A: Using Environment Variables (Recommended)

1. Create a `.env` file in your Astro project root (if it doesn't exist):

```bash
# In the root of the directory
touch .env
```

2. Add your worker URL:

```env
PUBLIC_WORKER_URL=https://blog-view-counter.YOUR_SUBDOMAIN.workers.dev
PUBLIC_VIEW_COUNTER_API_KEY=your-random-string
```

3. Also add it to your `.env.production` for production builds:

```env
PUBLIC_WORKER_URL=https://blog-view-counter.YOUR_SUBDOMAIN.workers.dev
PUBLIC_VIEW_COUNTER_API_KEY=your-random-string
```

4. **Important:** Add these environment variables to your Cloudflare Pages project:
   - Go to your Cloudflare Pages dashboard
   - Select your project
   - Go to Settings → Environment variables
   - Add `PUBLIC_WORKER_URL` with your worker URL
   - Add `PUBLIC_VIEW_COUNTER_API_KEY` with the same value configured in the worker
   - Set it for both Production and Preview environments

### Option B: Direct Configuration

Alternatively, update the default URL in `src/pages/blog/[...slug].astro`:

```typescript
const WORKER_URL = 'https://blog-view-counter.YOUR_SUBDOMAIN.workers.dev';
```

## Step 8: Update CORS Settings (Production)

For production, you should restrict CORS to your actual domain. Edit `worker/view-counter.js`:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sumit.ml', // Your domain
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

Then redeploy:

```bash
wrangler deploy
```

## Step 9: Deploy Your Astro Site

Commit and push your changes:

```bash
git add .
git commit -m "Add blog view counter"
git push origin feature/blog-view-stats
```

Cloudflare Pages will automatically deploy your changes.

## Testing in Production

After deployment, visit one of your blog posts:
- `https://sumit.ml/blog/inside-a-transformer/`

You should see a view count appear near the publication date!

## Monitoring View Counts

### View All Keys in KV

```bash
wrangler kv key list --binding=BLOG_VIEWS
```

### Get a Specific Count

```bash
wrangler kv key get "views:inside-a-transformer" --binding=BLOG_VIEWS
```

### Manually Set a Count (for testing)

```bash
wrangler kv key put "views:test-post" "100" --binding=BLOG_VIEWS
```

### Delete a Count

```bash
wrangler kv key delete "views:test-post" --binding=BLOG_VIEWS
```

## Troubleshooting

### Issue: "Error: Unknown binding: BLOG_VIEWS"

**Solution:** Make sure you've created the KV namespace and updated the ID in `wrangler.toml`.

### Issue: CORS errors in browser

**Solution:** 
1. Check that the worker is deployed and accessible
2. Verify CORS headers in `view-counter.js`
3. Make sure the worker URL is correct in your Astro config

### Issue: View count shows "--"

**Solution:**
1. Open browser DevTools → Console
2. Check for any JavaScript errors
3. Verify the worker URL in Network tab
4. Test the worker directly: `curl https://your-worker.workers.dev/views/test`

### Issue: Views not incrementing

**Solution:**
1. Check browser cache - try in incognito mode
2. Verify POST requests are reaching the worker (Network tab)
3. Check KV namespace has the correct binding

## Cost Considerations

Cloudflare's free tier includes:
- **Workers:** 100,000 requests/day
- **KV:** 100,000 reads/day, 1,000 writes/day, 1 GB storage

For a personal blog, this should be more than sufficient. View counts are:
- 1 write per unique page view
- 0 reads (we return the count directly from the write operation)

## Optional: Custom Domain for Worker (I haven't done this yet, but in case you want to)

If you want a cleaner URL like `https://api.sumit.ml/views/{slug}`:

1. Go to Cloudflare Dashboard → Workers & Pages → your worker
2. Click "Triggers" → "Add Custom Domain"
3. Configure your subdomain (e.g., `api.sumit.ml`)
4. Update the `PUBLIC_WORKER_URL` in your environment variables

## Architecture Overview

```
┌─────────────────┐
│  Blog Post Page │
│  (Astro SSG)    │
└────────┬────────┘
         │
         │ POST /views/{slug}
         │ (on page load)
         ▼
┌─────────────────────┐
│ Cloudflare Worker   │
│ (view-counter.js)   │
└────────┬────────────┘
         │
         │ Increment & Store
         ▼
┌─────────────────────┐
│  Cloudflare KV      │
│  Key: views:{slug}  │
│  Value: count       │
└─────────────────────┘
```

## Next Steps

- **Analytics:** Could consider adding more detailed analytics (referrers, unique visitors, etc.)
- **Rate Limiting:** Maybe add rate limiting to prevent abuse (in case you want some practice with rate limiting)
- **Cache:** Implement caching to reduce KV reads (more a skill practice than a necessity since this is a static blog site)
- **Dashboard:** Build an admin dashboard to view all blog stats (only if you're jobless)
