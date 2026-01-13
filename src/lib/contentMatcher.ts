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
  rs_url?: string; // Required for matching Instagram Story links (format: https://rstyle.me/+XXXXX)
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
 * Extract ltk.app.link short codes from Instagram Story link stickers
 * 
 * Instagram Stories use link stickers that contain URLs like:
 * - https://ltk.app.link/XXXXX
 * - ltk.app.link/XXXXX
 * 
 * Returns array of short codes found in the text
 */
export function extractLTKAppLinkCodes(text: string): string[] {
  if (!text) return [];
  
  const codes: string[] = [];
  
  // Match ltk.app.link/XXXXX patterns (with or without protocol)
  const ltkAppLinkPattern = /ltk\.app\.link\/([a-zA-Z0-9_-]+)/gi;
  const matches = text.matchAll(ltkAppLinkPattern);
  for (const match of matches) {
    codes.push(match[1]); // Store just the short code
  }
  
  return [...new Set(codes)]; // Remove duplicates
}

/**
 * Extract short code from rs_url
 * 
 * rs_url format: https://rstyle.me/+XXXXX or rstyle.me/+XXXXX
 * Returns the short code (the part after the +)
 */
export function extractRSUrlShortCode(rsUrl: string): string | null {
  if (!rsUrl) return null;
  
  // Match rstyle.me/+XXXXX pattern
  const rsUrlPattern = /rstyle\.me\/\+([a-zA-Z0-9_-]+)/i;
  const match = rsUrl.match(rsUrlPattern);
  
  return match ? match[1] : null;
}

/**
 * Match Instagram Story link codes to LTK commissions using rs_url
 * 
 * This utility matches:
 * - Instagram Story link stickers containing ltk.app.link/XXXXX
 * - To LTK commissions with rs_url containing rstyle.me/+XXXXX
 * 
 * The short code in the Instagram URL should match the short code in the rs_url
 * 
 * @param instagramStoryLinks - Array of ltk.app.link short codes from Instagram Stories
 * @param ltkCommissions - Array of LTK commission objects with rs_url field
 * @returns Map of Instagram Story link codes to matched LTK commission data
 */
export function matchStoryLinksToCommissions(
  instagramStoryLinks: string[],
  ltkCommissions: Array<{ rs_url?: string; [key: string]: any }>
): Map<string, any> {
  const matches = new Map<string, any>();
  
  // Create a map of rs_url short codes to commission data
  const rsUrlMap = new Map<string, any>();
  for (const commission of ltkCommissions) {
    if (commission.rs_url) {
      const shortCode = extractRSUrlShortCode(commission.rs_url);
      if (shortCode) {
        rsUrlMap.set(shortCode, commission);
      }
    }
  }
  
  // Match Instagram Story link codes to rs_url short codes
  for (const storyCode of instagramStoryLinks) {
    if (rsUrlMap.has(storyCode)) {
      matches.set(storyCode, rsUrlMap.get(storyCode));
    }
  }
  
  return matches;
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
    // Calculate keyword overlap score
    let ltkWords: string[] = [];
    
    // Extract words from LTK permalink if available
    if (ltkPost.permalink) {
      ltkWords = extractURLKeywords(ltkPost.permalink);
    }
    
    // If we have metadata with product info, extract those too
    // This would be enhanced with actual product titles/descriptions from LTK API
    
    if (ltkWords.length === 0) continue;
    
    // Calculate Jaccard similarity (intersection over union)
    const igSet = new Set(igWords);
    const ltkSet = new Set(ltkWords);
    const intersection = new Set([...igSet].filter(x => ltkSet.has(x)));
    const union = new Set([...igSet, ...ltkSet]);
    
    const score = intersection.size / union.size;
    
    if (score > bestScore && score > 0.2) { // Lowered threshold to 20% for better recall
      bestScore = score;
      bestMatch = ltkPost;
    }
  }
  
  return bestMatch;
}

/**
 * Extract meaningful keywords from LTK permalink URLs
 */
function extractURLKeywords(urlString: string): string[] {
  try {
    // Try parsing as URL
    let pathSegments: string[] = [];
    
    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      const url = new URL(urlString);
      // Extract path segments (e.g., /shop/nike-sneakers → ['shop', 'nike', 'sneakers'])
      pathSegments = url.pathname.split('/').filter(Boolean);
    } else {
      // Handle slug-only strings (e.g., "ltk-12345" or "shop/summer-dress")
      pathSegments = urlString.split('/').filter(Boolean);
    }
    
    // Extract words from each segment
    let words: string[] = [];
    for (const segment of pathSegments) {
      // Split on hyphens, underscores, camelCase
      const segmentWords = segment
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
        .split(/[-_\s]+/) // Split on hyphens, underscores, spaces
        .map(w => w.toLowerCase())
        .filter(w => w.length >= 3); // Only keep words 3+ chars
      
      words = words.concat(segmentWords);
    }
    
    // Remove common URL words
    const stopWords = new Set(['shop', 'ltk', 'www', 'com', 'http', 'https', 'index', 'page']);
    return words.filter(w => !stopWords.has(w));
  } catch (err) {
    // If parsing fails, just extract keywords normally
    return extractKeywords(urlString);
  }
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
