# LTK Endpoint Discovery Using HAR Files

This guide shows you how to discover **ALL** LTK API endpoints by capturing your browser's network traffic.

## What is a HAR File?

A HAR (HTTP Archive) file is a JSON-formatted archive of your browser's network activity. It captures every HTTP request made while you browse a website.

## Step 1: Export HAR File from Browser

### Chrome/Edge
1. Go to https://creator.shopltk.com and log in
2. Open DevTools (**F12**)
3. Click the **Network** tab
4. Click the **⚙️ gear icon** → Check **"Preserve log"** 
5. **Use EVERY feature** of the LTK dashboard:
   - Performance Analytics
   - Earnings & Commissions
   - Products & Collections
   - Posts & Content
   - Settings & Account
   - Shop & Favorites
   - Any other pages you can find
6. Right-click in Network tab → **"Save all as HAR with content"**
7. Save as `ltk-capture.har`

### Firefox
1. Same steps, but:
2. Right-click → **"Save All As HAR"**

## Step 2: Upload HAR File to Project

Upload your `ltk-capture.har` file to this project directory (or a subdirectory like `docs/`).

## Step 3: Parse the HAR File

Run the HAR parser to extract all LTK endpoints:

```bash
tsx server/utils/harParser.ts ltk-capture.har
```

This will:
- Parse the HAR file
- Extract ALL unique LTK API endpoints
- Generate a detailed report
- Save report to `ltk-endpoints-report.md` (same directory as HAR file)

## Example Output

```
Found 127 LTK API requests in HAR file

# LTK API Endpoints Discovered

Total unique endpoints: 45

## CREATOR-ANALYTICS

### GET /api/creator-analytics/v1/performance_stats
- Full URL: https://api-gateway.rewardstyle.com/api/creator-analytics/v1/performance_stats
- Called: 12 times
- Status: 200
- Query Params: start, end, currency

### GET /api/creator-analytics/v1/items_sold
- Full URL: https://api-gateway.rewardstyle.com/api/creator-analytics/v1/items_sold
- Called: 8 times
- Status: 200
- Query Params: limit, next, start, end, currency

## PUB

### GET /api/pub/v1/favorites
- Full URL: https://api-gateway.rewardstyle.com/api/pub/v1/favorites
- Called: 5 times
- Status: 200
- Query Params: limit, sort

✅ Report saved to: ltk-endpoints-report.md
```

## Step 4: Review the Report

Open `ltk-endpoints-report.md` to see:
- **All unique endpoints** discovered
- **Query parameters** each endpoint accepts
- **How many times** each was called
- **HTTP status codes**
- **Grouped by API category**

## Step 5: Add New Endpoints

For each endpoint in the report that's NOT yet in `server/routes/ltkProxy.ts`:

1. Add a new route handler
2. Add the method to `src/lib/ltkApiClient.ts`
3. Test it on the `/ltk-test` page

## Tips for Comprehensive Discovery

**To find the most endpoints:**
- Spend 5-10 minutes clicking through EVERY page
- Try different date ranges
- Sort/filter data in different ways
- View different tabs and sections
- Click on products, posts, analytics
- Use search features
- Access settings pages

**The more you click, the more endpoints you'll discover!** 🎯

## Security Note

HAR files contain **sensitive data** including:
- Your authentication tokens
- Personal information
- API responses

**DO NOT:**
- Share HAR files publicly
- Commit them to version control
- Send them to untrusted parties

**ONLY** use HAR files locally for endpoint discovery.
