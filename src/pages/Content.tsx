import { useState, useEffect } from 'react';
import { Instagram, Eye, Heart, MessageCircle, Share2, Bookmark, TrendingUp, X, Play, Info, Calendar, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateMockPosts, extractProductMentions } from '../utils/contentGenerator';
import { runAttribution } from '../utils/attributionEngine';

interface Post {
  id: string;
  platform: string;
  post_type: string;
  posted_at: string;
  caption: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  attributed_revenue: number;
  attributed_sales: number;
}

interface Attribution {
  id: string;
  confidence: number;
  method: string;
  sale: {
    product_name: string;
    amount: number;
    sale_date: string;
  };
}

export default function Content() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('REVENUE');

  useEffect(() => {
    checkConnection();
    loadPosts();
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .maybeSingle();

    setIsConnected(!!data);
  };

  const loadPosts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('posted_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    setConnecting(true);
    setShowConnectModal(false);
    setImporting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await supabase
        .from('platform_connections')
        .upsert({
          user_id: user.id,
          platform: 'instagram',
          status: 'CONNECTED',
          connected_at: new Date().toISOString(),
        });

      const mockPosts = generateMockPosts(28);

      const postsToInsert = mockPosts.map((post) => ({
        user_id: user.id,
        platform: post.platform,
        post_type: post.postType,
        posted_at: post.postedAt,
        caption: post.caption,
        thumbnail_url: post.thumbnailUrl,
        views: post.views,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        saves: post.saves,
        engagement_rate: post.engagementRate,
      }));

      await supabase
        .from('social_posts')
        .insert(postsToInsert);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        await runAttribution(user.id);
      } catch (attrError) {
        console.log('Attribution will run later:', attrError);
      }

      await loadPosts();
      setIsConnected(true);
      setImporting(false);
      setConnecting(false);
    } catch (error) {
      console.error('Error connecting:', error);
      setImporting(false);
      setConnecting(false);
      setIsConnected(true);
      await loadPosts();
    }
  };

  const loadAttributions = async (postId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('attributions')
      .select(`
        id,
        confidence,
        method,
        sale:sales (
          product_name,
          amount,
          sale_date
        )
      `)
      .eq('post_id', postId)
      .order('confidence', { ascending: false });

    if (error) {
      console.error('Error loading attributions:', error);
      return;
    }

    // Map the data to match our Attribution type
    const mappedData = (data || []).map((item: any) => ({
      id: item.id,
      confidence: item.confidence,
      method: item.method,
      sale: Array.isArray(item.sale) && item.sale.length > 0 ? item.sale[0] : {
        product_name: 'Unknown',
        amount: 0,
        sale_date: new Date().toISOString()
      }
    }));

    setAttributions(mappedData);
  };

  const openPostDetail = (post: Post) => {
    setSelectedPost(post);
    setShowDetailModal(true);
    loadAttributions(post.id);
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return {
        label: 'Likely',
        className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
      };
    } else if (confidence >= 0.5) {
      return {
        label: 'Possible',
        className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
      };
    } else {
      return {
        label: 'Uncertain',
        className: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
      };
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const filterAndSortPosts = () => {
    let filtered = [...posts];

    if (platformFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.platform === platformFilter);
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.post_type === typeFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'REVENUE') {
        return b.attributed_revenue - a.attributed_revenue;
      } else if (sortBy === 'ENGAGEMENT') {
        return b.engagement_rate - a.engagement_rate;
      } else {
        return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
      }
    });

    return filtered;
  };

  const filteredPosts = filterAndSortPosts();

  const exportContentReport = () => {
    const report = `CONTENT PERFORMANCE REPORT
Generated: ${new Date().toLocaleString()}

OVERVIEW
--------
Total Posts: ${posts.length}
Total Revenue Attributed: $${posts.reduce((sum, p) => sum + p.attributed_revenue, 0).toFixed(2)}
Total Sales Attributed: ${posts.reduce((sum, p) => sum + p.attributed_sales, 0)}
Average Engagement Rate: ${(posts.reduce((sum, p) => sum + p.engagement_rate, 0) / posts.length).toFixed(2)}%

TOP PERFORMING POSTS
--------------------
${filteredPosts.slice(0, 10).map((p, idx) =>
`${idx + 1}. ${p.post_type} - ${new Date(p.posted_at).toLocaleDateString()}
   Revenue: $${p.attributed_revenue.toFixed(2)}
   Sales: ${p.attributed_sales}
   Engagement: ${p.engagement_rate.toFixed(1)}%
   Caption: ${p.caption.substring(0, 100)}...
`).join('\n')}

POST TYPE BREAKDOWN
-------------------
Reels: ${posts.filter(p => p.post_type === 'REEL').length}
Posts: ${posts.filter(p => p.post_type === 'POST').length}
Stories: ${posts.filter(p => p.post_type === 'STORY').length}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (importing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Importing Posts...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This may take a minute. We're analyzing your content and running attribution.
          </p>
        </div>
      </div>
    );
  }

  if (!isConnected || posts.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Content Performance
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Track which posts drive the most revenue
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Instagram className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Connect Instagram to Start
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Import your posts to see which content drives the most sales and engagement.
              We'll analyze your performance and show you what's working.
            </p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Connect Instagram
            </button>
          </div>
        </div>

        {showConnectModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !connecting && setShowConnectModal(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Instagram className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
                Connect Instagram
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                We'll import your posts and performance metrics to track which content generates
                revenue.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConnectModal(false)}
                  disabled={connecting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Content Performance
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {posts.length} posts • ${posts.reduce((sum, p) => sum + p.attributed_revenue, 0).toFixed(0)} total revenue
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportContentReport}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="ALL">All Platforms</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TIKTOK">TikTok</option>
            <option value="YOUTUBE">YouTube</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="ALL">All Types</option>
            <option value="POST">Posts</option>
            <option value="REEL">Reels</option>
            <option value="STORY">Stories</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="REVENUE">Most Revenue</option>
            <option value="ENGAGEMENT">Most Engagement</option>
            <option value="RECENT">Most Recent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            onClick={() => openPostDetail(post)}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
          >
            <div
              className="h-64 relative"
              style={{ background: post.thumbnail_url }}
            >
              {post.post_type === 'REEL' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-900 ml-1" />
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded-full text-xs font-medium">
                <Instagram className="w-3 h-3" />
                <span>{post.post_type}</span>
              </div>
              <div className="absolute top-3 right-3 text-xs text-white bg-black/50 px-2 py-1 rounded">
                {getRelativeTime(post.posted_at)}
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {post.caption}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{(post.views / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{post.engagement_rate.toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div
                    className={`text-lg font-bold ${
                      post.attributed_revenue > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {formatCurrency(post.attributed_revenue)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {post.attributed_sales} {post.attributed_sales === 1 ? 'sale' : 'sales'}
                  </div>
                </div>
                <button className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPost && showDetailModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full my-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/5 bg-gray-100 dark:bg-gray-900 relative">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
                <div
                  className="w-full aspect-square"
                  style={{ background: selectedPost.thumbnail_url }}
                >
                  {selectedPost.post_type === 'REEL' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-900 ml-1" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Instagram className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedPost.post_type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date(selectedPost.posted_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:w-3/5 p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Post Details</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors hidden lg:flex"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedPost.caption}
                  </p>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Views</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPost.views.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Likes</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPost.likes.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Comments</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPost.comments.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Shares</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPost.shares.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Bookmark className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Saves</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPost.saves.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Engagement</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPost.engagement_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Sales Attributed to This Post
                    </h3>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg z-10">
                        Sales are attributed when products from this post are purchased within 7 days
                        of posting.
                      </div>
                    </div>
                  </div>

                  {attributions.length > 0 ? (
                    <>
                      <div className="space-y-2 mb-4">
                        {attributions.map((attr) => {
                          const badge = getConfidenceBadge(attr.confidence);
                          return (
                            <div
                              key={attr.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900 dark:text-white">
                                  {attr.sale.product_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(attr.sale.sale_date).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {formatCurrency(attr.sale.amount)}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${badge.className}`}>
                                  {badge.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="text-sm text-green-900 dark:text-green-300 font-medium">
                          Total: {formatCurrency(selectedPost.attributed_revenue)} from{' '}
                          {selectedPost.attributed_sales}{' '}
                          {selectedPost.attributed_sales === 1 ? 'sale' : 'sales'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">
                        No sales attributed yet. Sales are matched when products from this post are
                        purchased within 7 days.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Products Featured
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {extractProductMentions(selectedPost.caption).map((product, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-sm"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
