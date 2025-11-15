import express from 'express';
import pg from 'pg';

const { Pool } = pg;
const router = express.Router();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/instagram-posts/ltk-connected - Get posts with LTK links
router.get('/ltk-connected', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        platform,
        post_type,
        caption,
        post_url,
        posted_at,
        engagement_rate,
        likes,
        comments,
        shares,
        has_ltk_link,
        detected_links
      FROM social_posts
      WHERE has_ltk_link = true
      ORDER BY posted_at DESC
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching LTK-connected posts:', error);
    res.status(500).json({ error: 'Failed to fetch LTK-connected posts' });
  }
});

// GET /api/instagram-posts/recent - Get recent Instagram posts
router.get('/recent', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        platform,
        post_type,
        caption,
        post_url,
        posted_at,
        engagement_rate,
        likes,
        comments,
        shares,
        has_ltk_link,
        detected_links
      FROM social_posts
      WHERE platform = 'instagram'
      ORDER BY posted_at DESC
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent Instagram posts:', error);
    res.status(500).json({ error: 'Failed to fetch recent Instagram posts' });
  }
});

// GET /api/instagram-posts/stats - Get Instagram post statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN has_ltk_link = true THEN 1 END) as ltk_posts,
        AVG(engagement_rate) as avg_engagement,
        SUM(likes) as total_likes,
        SUM(comments) as total_comments,
        SUM(shares) as total_shares
      FROM social_posts
      WHERE platform = 'instagram'
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching Instagram stats:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram stats' });
  }
});

export default router;
