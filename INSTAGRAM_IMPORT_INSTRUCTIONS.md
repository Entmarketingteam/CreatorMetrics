# Instagram Import Instructions

## Overview
The Instagram Import feature allows you to import Instagram post data from Meta Business Suite CSV exports into your CreatorMetrics dashboard for post-to-sale attribution analysis.

## Database Migration Required

**IMPORTANT**: Before using the import feature, you must apply the database migration through your Supabase dashboard.

### Migration Steps:
1. Log into your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the migration file: `supabase/migrations/20251113030000_add_reach_and_external_post_id.sql`

This migration adds two new columns to the `social_posts` table:
- `reach` (integer): Number of unique accounts that saw the post
- `external_post_id` (text): Instagram's unique post identifier

It also creates a unique index to prevent duplicate imports.

## How to Export from Meta Business Suite

1. Go to Meta Business Suite (business.facebook.com)
2. Navigate to **Insights** → **Content**
3. Select the posts you want to export (or select all)
4. Click **Export** → **Export table data**
5. Choose **CSV format**
6. Download the file

## How to Import

1. Navigate to **Instagram Import** in the sidebar
2. Drag and drop your CSV file or click to browse
3. Click **Import Posts**
4. Wait for the import to complete
5. View results summary showing:
   - Number of posts imported
   - Any errors encountered

## What Gets Imported

The import maps Meta CSV fields to your database:

| Meta CSV Field | Database Field | Description |
|----------------|----------------|-------------|
| Post ID | external_post_id | Instagram's unique identifier |
| Publish time | posted_at | When the post was published |
| Description | caption | The post caption (exact copy) |
| Permalink | thumbnail_url | Instagram post URL |
| Post type | post_type | POST, REEL, or STORY |
| Views | views | Total plays/views |
| Reach | reach | Unique accounts reached |
| Likes | likes | Number of likes |
| Comments | comments | Number of comments |
| Shares | shares | Number of shares |
| Saves | saves | Number of saves |

## Engagement Rate Calculation

Engagement rate is automatically calculated as:
```
(Likes + Comments + Saves + Shares) / Reach × 100
```

If reach is 0, it falls back to views for the calculation.

## Duplicate Prevention

The import uses upsert logic based on `(user_id, platform, external_post_id)`:
- If a post with the same Post ID already exists, it will be updated
- New posts will be inserted
- This means you can safely re-import the same CSV file

## Batch Processing

Large CSV files are processed in batches of 50 posts for optimal performance.

## Post-to-Sale Attribution

After importing your Instagram posts, the attribution engine can match sales to specific posts based on:
- Product keywords in captions
- Time windows (7-day default)
- Platform matching

View attribution results on the **Content** page.

## Supported CSV Formats

The parser handles:
- **Timestamps**: "MM/DD/YYYY HH:mm" (24-hour format)
- **Numbers**: Plain integers or locale formats (1,234 or 1.234,56)
- **Multi-line captions**: Preserves newlines and formatting
- **Special characters**: BOM, CRLF line endings, quoted fields

## Troubleshooting

### "Database error: column does not exist"
- You need to apply the database migration (see above)

### "Error parsing row"
- Check that your CSV is from Meta Business Suite
- Ensure required fields (Post ID, Publish time) are present

### Posts not showing on Content page
- Verify the import completed successfully
- Check that posts have valid Post IDs and timestamps
- Refresh the Content page

## Need Help?

If you encounter issues:
1. Check the error messages in the import results
2. Verify your CSV file format matches Meta Business Suite exports
3. Ensure the database migration was applied successfully
