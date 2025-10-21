import { supabase } from '../lib/supabase';

export interface Sale {
  id: string;
  product_name: string;
  amount: number;
  sale_date: string;
  platform: string;
}

export interface Post {
  id: string;
  caption: string;
  posted_at: string;
  platform: string;
}

export interface Attribution {
  sale_id: string;
  post_id: string;
  confidence: number;
  method: 'PRODUCT_MATCH' | 'TIME_WINDOW' | 'PLATFORM_MATCH';
}

const ATTRIBUTION_WINDOW_DAYS = 7;
const SHORT_WINDOW_DAYS = 3;

const extractProductKeywords = (text: string): string[] => {
  return text
    .toLowerCase()
    .split(/[\s,!.?]+/)
    .filter((word) => word.length > 3);
};

const hasProductMatch = (productName: string, caption: string): boolean => {
  const productKeywords = extractProductKeywords(productName);
  const captionLower = caption.toLowerCase();

  return productKeywords.some((keyword) => captionLower.includes(keyword));
};

const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const isWithinWindow = (postDate: string, saleDate: string, windowDays: number): boolean => {
  const post = new Date(postDate);
  const sale = new Date(saleDate);

  if (post > sale) return false;

  const daysDiff = getDaysDifference(postDate, saleDate);
  return daysDiff <= windowDays;
};

export const runAttribution = async (userId: string): Promise<{
  attributionsCreated: number;
  postsUpdated: number;
}> => {
  try {
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId)
      .order('sale_date', { ascending: false });

    if (salesError) throw salesError;
    if (!sales || sales.length === 0) return { attributionsCreated: 0, postsUpdated: 0 };

    const { data: posts, error: postsError } = await supabase
      .from('social_posts')
      .select('*')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false });

    if (postsError) throw postsError;
    if (!posts || posts.length === 0) return { attributionsCreated: 0, postsUpdated: 0 };

    await supabase
      .from('attributions')
      .delete()
      .eq('user_id', userId);

    const attributions: Attribution[] = [];
    const postRevenueMap = new Map<string, { revenue: number; sales: number }>();

    for (const sale of sales) {
      const eligiblePosts = posts.filter(
        (post) => new Date(post.posted_at) < new Date(sale.sale_date)
      );

      let bestMatch: { post: typeof posts[0]; confidence: number; method: Attribution['method'] } | null = null;

      for (const post of eligiblePosts) {
        if (hasProductMatch(sale.product_name, post.caption) &&
            isWithinWindow(post.posted_at, sale.sale_date, ATTRIBUTION_WINDOW_DAYS)) {
          if (!bestMatch || bestMatch.confidence < 0.95) {
            bestMatch = { post, confidence: 0.95, method: 'PRODUCT_MATCH' };
          }
        }
        else if (isWithinWindow(post.posted_at, sale.sale_date, ATTRIBUTION_WINDOW_DAYS)) {
          const postsInWindow = eligiblePosts.filter((p) =>
            isWithinWindow(p.posted_at, sale.sale_date, ATTRIBUTION_WINDOW_DAYS)
          );
          if (postsInWindow.length === 1 && (!bestMatch || bestMatch.confidence < 0.60)) {
            bestMatch = { post, confidence: 0.60, method: 'TIME_WINDOW' };
          }
        }
        else if (isWithinWindow(post.posted_at, sale.sale_date, SHORT_WINDOW_DAYS)) {
          const platformMatch = post.caption.toLowerCase().includes(sale.platform.toLowerCase());
          if (platformMatch && (!bestMatch || bestMatch.confidence < 0.50)) {
            bestMatch = { post, confidence: 0.50, method: 'PLATFORM_MATCH' };
          }
        }
      }

      if (bestMatch) {
        attributions.push({
          sale_id: sale.id,
          post_id: bestMatch.post.id,
          confidence: bestMatch.confidence,
          method: bestMatch.method,
        });

        const current = postRevenueMap.get(bestMatch.post.id) || { revenue: 0, sales: 0 };
        postRevenueMap.set(bestMatch.post.id, {
          revenue: current.revenue + sale.amount,
          sales: current.sales + 1,
        });
      }
    }

    if (attributions.length > 0) {
      const attributionRecords = attributions.map((attr) => ({
        user_id: userId,
        sale_id: attr.sale_id,
        post_id: attr.post_id,
        confidence: attr.confidence,
        method: attr.method,
      }));

      const { error: insertError } = await supabase
        .from('attributions')
        .insert(attributionRecords);

      if (insertError) throw insertError;
    }

    let postsUpdated = 0;
    for (const [postId, stats] of postRevenueMap.entries()) {
      const { error: updateError } = await supabase
        .from('social_posts')
        .update({
          attributed_revenue: stats.revenue,
          attributed_sales: stats.sales,
        })
        .eq('id', postId);

      if (!updateError) postsUpdated++;
    }

    return {
      attributionsCreated: attributions.length,
      postsUpdated,
    };
  } catch (error) {
    console.error('Attribution error:', error);
    throw error;
  }
};
