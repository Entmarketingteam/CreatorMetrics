/**
 * Content Matcher: Links Instagram posts to LTK sales data
 * 
 * Three-tier matching algorithm:
 * 1. Direct URL match (ltk.it/xxxxx or shopltk.com links in captions)
 * 2. Time-window match (±48 hours from IG post to LTK click)
 * 3. Keyword similarity (product names in caption vs LTK products)
 */

export interface InstagramPost {
  id: string;
  platform: string;
  external_post_id: string;
  post_url?: string;
  caption?: string;
  published_at: string;
  post_type: string;
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  engagement_rate?: number;
}

export interface LTKPost {
  id: string;
  ltk_id: string;
  permalink?: string;
  published_at: string;
  clicks?: number;
  revenue?: number;
  items_sold?: number;
  conversion_rate?: number;
}

export interface MatchedContent {
  instagram: InstagramPost;
  ltk: LTKPost | null;
  matchType: 'direct_url' | 'time_window' | 'keyword' | 'none';
  confidence: number;
  combinedMetrics: {
    impressions?: number;
    reach?: number;
    engagement?: number;
    clicks?: number;
    revenue?: number;
    itemsSold?: number;
    conversionRate?: number;
    roas?: number; // Return on Ad Spend (revenue per engagement)
  };
}

/**
 * Extract LTK links from Instagram caption or bio
 */
export function extractLTKLinks(text: string): string[] {
  if (!text) return [];
  
  const links: string[] = [];
  
  // Match ltk.it/xxxxx patterns
  const ltkItPattern = /ltk\.it\/([a-zA-Z0-9_-]+)/gi;
  const ltkItMatches = text.matchAll(ltkItPattern);
  for (const match of ltkItMatches) {
    links.push(match[1]); // Store just the slug
  }
  
  // Match shopltk.com patterns
  const shopLtkPattern = /shopltk\.com\/([a-zA-Z0-9_/-]+)/gi;
  const shopLtkMatches = text.matchAll(shopLtkPattern);
  for (const match of shopLtkMatches) {
    links.push(match[1]);
  }
  
  // Match liketoknow.it patterns (legacy)
  const ltkLegacyPattern = /liketoknow\.it\/([a-zA-Z0-9_/-]+)/gi;
  const ltkLegacyMatches = text.matchAll(ltkLegacyPattern);
  for (const match of ltkLegacyMatches) {
    links.push(match[1]);
  }
  
  return [...new Set(links)]; // Remove duplicates
}

/**
 * Tier 1: Direct URL matching
 */
function matchByDirectURL(igPost: InstagramPost, ltkPosts: LTKPost[]): LTKPost | null {
  const links = extractLTKLinks(igPost.caption || '');
  if (links.length === 0) return null;
  
  // Find LTK post with matching permalink slug
  for (const ltkPost of ltkPosts) {
    if (!ltkPost.permalink) continue;
    
    for (const link of links) {
      if (ltkPost.permalink.includes(link)) {
        return ltkPost;
      }
    }
  }
  
  return null;
}

/**
 * Tier 2: Time-window matching (±48 hours)
 */
function matchByTimeWindow(igPost: InstagramPost, ltkPosts: LTKPost[]): LTKPost | null {
  const igDate = new Date(igPost.published_at);
  const windowMs = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  
  const candidatePosts = ltkPosts.filter(ltkPost => {
    const ltkDate = new Date(ltkPost.published_at);
    const timeDiff = Math.abs(ltkDate.getTime() - igDate.getTime());
    return timeDiff <= windowMs;
  });
  
  if (candidatePosts.length === 0) return null;
  
  // Return the closest one by time
  return candidatePosts.reduce((closest, current) => {
    const closestDiff = Math.abs(new Date(closest.published_at).getTime() - igDate.getTime());
    const currentDiff = Math.abs(new Date(current.published_at).getTime() - igDate.getTime());
    return currentDiff < closestDiff ? current : closest;
  });
}

/**
 * Tier 3: Keyword similarity matching
 */
function matchByKeywords(igPost: InstagramPost, ltkPosts: LTKPost[]): LTKPost | null {
  if (!igPost.caption) return null;
  
  const igWords = extractKeywords(igPost.caption);
  if (igWords.length === 0) return null;
  
  let bestMatch: LTKPost | null = null;
  let bestScore = 0;
  
  for (const ltkPost of ltkPosts) {
    // For now, we'll just use time-based matching since we don't have product keywords in LTK data yet
    // This can be enhanced when we have product title/description from LTK
    const score = 0;
    
    if (score > bestScore && score > 0.3) { // Require at least 30% similarity
      bestScore = score;
      bestMatch = ltkPost;
    }
  }
  
  return bestMatch;
}

function extractKeywords(text: string): string[] {
  // Remove URLs, hashtags, mentions
  const cleaned = text
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/#[^\s]+/g, '')
    .replace(/@[^\s]+/g, '');
  
  // Extract words (simple tokenization)
  const words = cleaned.match(/\b[a-z]{3,}\b/g) || [];
  
  // Remove common stop words
  const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'are', 'was']);
  return words.filter(w => !stopWords.has(w));
}

/**
 * Main matching function
 */
export function matchInstagramToLTK(
  igPosts: InstagramPost[],
  ltkPosts: LTKPost[]
): MatchedContent[] {
  const matches: MatchedContent[] = [];
  
  for (const igPost of igPosts) {
    // Try tier 1: Direct URL match
    let ltkMatch = matchByDirectURL(igPost, ltkPosts);
    let matchType: MatchedContent['matchType'] = 'none';
    let confidence = 0;
    
    if (ltkMatch) {
      matchType = 'direct_url';
      confidence = 0.95; // Very high confidence for direct URL matches
    } else {
      // Try tier 2: Time window match
      ltkMatch = matchByTimeWindow(igPost, ltkPosts);
      if (ltkMatch) {
        matchType = 'time_window';
        confidence = 0.7; // Medium-high confidence for time-based matches
      } else {
        // Try tier 3: Keyword match
        ltkMatch = matchByKeywords(igPost, ltkPosts);
        if (ltkMatch) {
          matchType = 'keyword';
          confidence = 0.5; // Lower confidence for keyword matches
        }
      }
    }
    
    // Calculate combined metrics
    const engagement = (igPost.likes || 0) + (igPost.comments || 0) + (igPost.shares || 0) + (igPost.saves || 0);
    const revenue = ltkMatch?.revenue || 0;
    const roas = engagement > 0 ? revenue / engagement : 0;
    
    matches.push({
      instagram: igPost,
      ltk: ltkMatch,
      matchType,
      confidence,
      combinedMetrics: {
        impressions: igPost.impressions,
        reach: igPost.reach,
        engagement,
        clicks: ltkMatch?.clicks,
        revenue: ltkMatch?.revenue,
        itemsSold: ltkMatch?.items_sold,
        conversionRate: ltkMatch?.conversion_rate,
        roas,
      },
    });
  }
  
  // Sort by revenue (highest first), then by engagement
  return matches.sort((a, b) => {
    const revDiff = (b.combinedMetrics.revenue || 0) - (a.combinedMetrics.revenue || 0);
    if (revDiff !== 0) return revDiff;
    return (b.combinedMetrics.engagement || 0) - (a.combinedMetrics.engagement || 0);
  });
}

/**
 * Calculate overall attribution stats
 */
export function calculateAttributionStats(matches: MatchedContent[]) {
  const stats = {
    totalPosts: matches.length,
    matchedPosts: matches.filter(m => m.ltk !== null).length,
    totalRevenue: 0,
    totalEngagement: 0,
    totalItemsSold: 0,
    avgRevenuePerPost: 0,
    avgEngagementPerPost: 0,
    topPerformer: null as MatchedContent | null,
  };
  
  let highestRevenue = 0;
  
  for (const match of matches) {
    stats.totalRevenue += match.combinedMetrics.revenue || 0;
    stats.totalEngagement += match.combinedMetrics.engagement || 0;
    stats.totalItemsSold += match.combinedMetrics.itemsSold || 0;
    
    const revenue = match.combinedMetrics.revenue || 0;
    if (revenue > highestRevenue) {
      highestRevenue = revenue;
      stats.topPerformer = match;
    }
  }
  
  stats.avgRevenuePerPost = stats.totalPosts > 0 ? stats.totalRevenue / stats.totalPosts : 0;
  stats.avgEngagementPerPost = stats.totalPosts > 0 ? stats.totalEngagement / stats.totalPosts : 0;
  
  return stats;
}
