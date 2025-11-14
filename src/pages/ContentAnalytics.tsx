import { useState, useEffect } from 'react';
import { Instagram, DollarSign, TrendingUp, Eye, Heart, BarChart3, Link2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLTKAuth } from '../hooks/useLTKAuth';
import { matchInstagramToLTK, calculateAttributionStats, extractLTKLinks, type MatchedContent, type InstagramPost, type LTKPost } from '../lib/contentMatcher';

type Period = '7D' | '30D' | '1Y';

const PERIODS = [
  { label: '7 days', value: '7D' },
  { label: '30 days', value: '30D' },
  { label: '1 year', value: '1Y' },
];

export default function ContentAnalytics() {
  const { user } = useAuth();
  const { isAuthenticated, createClient } = useLTKAuth();
  const [period, setPeriod] = useState<Period>('30D');
  const [loading, setLoading] = useState(true);
  const [igPosts, setIgPosts] = useState<InstagramPost[]>([]);
  const [ltkPosts, setLtkPosts] = useState<LTKPost[]>([]);
  const [matchedContent, setMatchedContent] = useState<MatchedContent[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchedContent | null>(null);

  const isLTKConnected = isAuthenticated;

  useEffect(() => {
    loadData();
  }, [user, isAuthenticated, period]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load Instagram posts from Supabase
      const daysAgo = period === '7D' ? 7 : period === '30D' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: socialPostsData, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'INSTAGRAM')
        .gte('posted_at', startDate.toISOString())
        .order('posted_at', { ascending: false });

      if (error) {
        console.error('Error loading Instagram posts:', error);
        setIgPosts([]);
      } else {
        const posts: InstagramPost[] = (socialPostsData || []).map((post: any) => ({
          id: post.id,
          platform: post.platform,
          external_post_id: post.external_post_id || post.id,
          post_url: post.post_url,
          caption: post.caption || '',
          published_at: post.posted_at,
          post_type: post.post_type,
          impressions: post.views || 0,
          reach: post.reach || post.views || 0,
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          saves: post.saves || 0,
          engagement_rate: post.engagement_rate || 0,
        }));
        setIgPosts(posts);
      }

      // Load LTK posts if connected
      if (isLTKConnected) {
        try {
          const client = createClient();
          if (!client) {
            setLtkPosts([]);
            return;
          }
          
          const endDate = new Date();
          const response = await client.getTopPerformersLTKs({
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            sort_dir: 'desc',
          });

          console.log('LTK top performers response:', response);

          const ltkData: LTKPost[] = (response.data || response.results || []).map((item: any, index: number) => ({
            id: item.id || `ltk-${index}`,
            ltk_id: item.ltk_id || item.id || `ltk-${index}`,
            permalink: item.permalink || item.url,
            published_at: item.published_at || item.created_at || new Date().toISOString(),
            clicks: item.clicks || item.total_clicks || 0,
            revenue: parseFloat(item.revenue || item.total_revenue || item.commission || 0),
            items_sold: item.items_sold || item.conversions || 0,
            conversion_rate: parseFloat(item.conversion_rate || item.cvr || 0),
          }));

          setLtkPosts(ltkData);
        } catch (ltkError) {
          console.error('Error loading LTK posts:', ltkError);
          setLtkPosts([]);
        }
      } else {
        setLtkPosts([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (igPosts.length > 0 && ltkPosts.length > 0) {
      const matches = matchInstagramToLTK(igPosts, ltkPosts);
      setMatchedContent(matches);
    } else if (igPosts.length > 0) {
      // Show IG posts without LTK data
      const matches: MatchedContent[] = igPosts.map(post => ({
        instagram: post,
        ltk: null,
        matchType: 'none',
        confidence: 0,
        combinedMetrics: {
          impressions: post.impressions,
          reach: post.reach,
          engagement: (post.likes || 0) + (post.comments || 0) + (post.shares || 0) + (post.saves || 0),
        },
      }));
      setMatchedContent(matches);
    }
  }, [igPosts, ltkPosts]);

  const stats = calculateAttributionStats(matchedContent);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getMatchBadge = (match: MatchedContent) => {
    if (!match.ltk) return null;
    
    const badgeStyles = {
      direct_url: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      time_window: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      keyword: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      none: '',
    };

    const labels = {
      direct_url: 'Direct Link',
      time_window: 'Time Match',
      keyword: 'Keyword Match',
      none: '',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-md font-medium ${badgeStyles[match.matchType]}`}>
        {labels[match.matchType]} ({Math.round(match.confidence * 100)}%)
      </span>
    );
  };

  if (!isLTKConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            LTK Not Connected
          </h2>
          <p className="text-yellow-800 dark:text-yellow-200 mb-4">
            To see which Instagram posts drive the most sales, connect your LTK account first.
          </p>
          <a
            href="/settings"
            className="inline-block px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
            data-testid="link-connect-ltk"
          >
            Connect LTK Account
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading content analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Content Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Instagram posts matched to LTK sales
          </p>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as Period)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                period === p.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              data-testid={`button-period-${p.value}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-posts">
            {stats.totalPosts}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <Link2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Matched Posts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-matched-posts">
            {stats.matchedPosts}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.totalPosts > 0 ? Math.round((stats.matchedPosts / stats.totalPosts) * 100) : 0}% match rate
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-revenue">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatCurrency(stats.avgRevenuePerPost)} avg/post
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Engagement</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-engagement">
            {formatNumber(stats.totalEngagement)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatNumber(Math.round(stats.avgEngagementPerPost))} avg/post
          </p>
        </div>
      </div>

      {/* Top Performer Highlight */}
      {stats.topPerformer && stats.topPerformer.ltk && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Performing Post</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Instagram Post</p>
              <p className="text-gray-800 dark:text-gray-200 line-clamp-2">
                {stats.topPerformer.instagram.caption}
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {formatNumber(stats.topPerformer.combinedMetrics.engagement || 0)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatNumber(stats.topPerformer.combinedMetrics.reach || 0)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.topPerformer.combinedMetrics.revenue || 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.topPerformer.combinedMetrics.itemsSold || 0} items sold
              </p>
              {getMatchBadge(stats.topPerformer)}
            </div>
          </div>
        </div>
      )}

      {/* Matched Content Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Posts ({matchedContent.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Match
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Engagement
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Items Sold
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  ROAS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {matchedContent.map((match, index) => (
                <tr
                  key={match.instagram.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedMatch(match)}
                  data-testid={`row-post-${index}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Instagram className="w-6 h-6 text-pink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {(match.instagram.caption || '').substring(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(match.instagram.published_at).toLocaleDateString()}
                        </p>
                        {extractLTKLinks(match.instagram.caption || '').length > 0 && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            🔗 Has LTK link
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getMatchBadge(match)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                    {formatNumber(match.combinedMetrics.engagement || 0)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-medium ${
                      (match.combinedMetrics.revenue || 0) > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {formatCurrency(match.combinedMetrics.revenue || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                    {match.combinedMetrics.itemsSold || '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                    {match.combinedMetrics.roas ? `$${match.combinedMetrics.roas.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMatch && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Post Details</h3>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Instagram Details */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-500" />
                Instagram Post
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                {selectedMatch.instagram.caption}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Published:</span>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedMatch.instagram.published_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                  <p className="text-gray-900 dark:text-white">{selectedMatch.instagram.post_type}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Reach:</span>
                  <p className="text-gray-900 dark:text-white">{formatNumber(selectedMatch.instagram.reach || 0)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Engagement:</span>
                  <p className="text-gray-900 dark:text-white">
                    {formatNumber(selectedMatch.combinedMetrics.engagement || 0)}
                  </p>
                </div>
              </div>
              
              {extractLTKLinks(selectedMatch.instagram.caption || '').length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">LTK Links Found:</p>
                  {extractLTKLinks(selectedMatch.instagram.caption || '').map((link, i) => (
                    <p key={i} className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                      {link}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* LTK Details */}
            {selectedMatch.ltk && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  LTK Performance
                </h4>
                <div className="mb-3">
                  {getMatchBadge(selectedMatch)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Clicks:</span>
                    <p className="text-gray-900 dark:text-white">{formatNumber(selectedMatch.ltk.clicks || 0)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Revenue:</span>
                    <p className="text-green-600 dark:text-green-400 font-semibold">
                      {formatCurrency(selectedMatch.ltk.revenue || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Items Sold:</span>
                    <p className="text-gray-900 dark:text-white">{selectedMatch.ltk.items_sold || 0}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Conversion Rate:</span>
                    <p className="text-gray-900 dark:text-white">
                      {((selectedMatch.ltk.conversion_rate || 0) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!selectedMatch.ltk && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 text-center text-gray-500 dark:text-gray-400">
                <p>No LTK data matched to this post</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
