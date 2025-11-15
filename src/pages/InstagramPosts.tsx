import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Instagram, ExternalLink, TrendingUp, Calendar, Heart, MessageCircle, Share2, Link as LinkIcon } from 'lucide-react';

interface SocialPost {
  id: string;
  platform: string;
  post_type: string;
  caption: string;
  post_url: string;
  posted_at: string;
  engagement_rate: number;
  likes: number;
  comments: number;
  shares: number;
  has_ltk_link: boolean;
  detected_links: string[];
}

export default function InstagramPosts() {
  const navigate = useNavigate();
  const [ltkPosts, setLtkPosts] = useState<SocialPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ltk' | 'recent'>('ltk');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts with LTK links
      const ltkResponse = await fetch('/api/instagram-posts/ltk-connected');
      if (ltkResponse.ok) {
        const ltkData = await ltkResponse.json();
        setLtkPosts(ltkData);
      }

      // Fetch recent posts
      const recentResponse = await fetch('/api/instagram-posts/recent');
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentPosts(recentData);
      }
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'reel': return '🎬';
      case 'story': return '📖';
      case 'carousel': return '🖼️';
      default: return '📸';
    }
  };

  const PostCard = ({ post }: { post: SocialPost }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow" data-testid={`card-post-${post.id}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl" data-testid={`icon-post-type-${post.id}`}>
              {getPostTypeIcon(post.post_type)}
            </span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md font-medium" data-testid={`badge-post-type-${post.id}`}>
              {post.post_type}
            </span>
            {post.has_ltk_link && (
              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-md font-medium flex items-center gap-1" data-testid={`badge-ltk-${post.id}`}>
                <LinkIcon className="w-3 h-3" />
                LTK Link
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1" data-testid={`text-date-${post.id}`}>
            <Calendar className="w-3 h-3" />
            {formatDate(post.posted_at)}
          </p>
        </div>
        {post.post_url && (
          <button 
            onClick={() => window.open(post.post_url, '_blank')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            data-testid={`button-view-post-${post.id}`}
          >
            <ExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3" data-testid={`text-caption-${post.id}`}>
        {post.caption}
      </p>

      {post.detected_links && post.detected_links.length > 0 && (
        <div className="mb-4 space-y-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Detected Links:</p>
          <div className="flex flex-wrap gap-2">
            {post.detected_links.map((link, idx) => (
              <span 
                key={idx} 
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md font-mono"
                data-testid={`badge-link-${post.id}-${idx}`}
              >
                {link}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2" data-testid={`metric-likes-${post.id}`}>
          <Heart className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{post.likes.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2" data-testid={`metric-comments-${post.id}`}>
          <MessageCircle className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{post.comments.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2" data-testid={`metric-shares-${post.id}`}>
          <Share2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{post.shares.toLocaleString()}</span>
        </div>
      </div>

      {post.engagement_rate > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <TrendingUp className="w-3 h-3" />
          <span data-testid={`text-engagement-${post.id}`}>
            {post.engagement_rate}% engagement rate
          </span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading Instagram posts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const avgEngagement = recentPosts.length > 0
    ? (recentPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / recentPosts.length).toFixed(1)
    : '0';

  const displayPosts = activeTab === 'ltk' ? ltkPosts : recentPosts;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/content-analytics')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Instagram className="w-8 h-8 text-pink-600" />
                Instagram Posts
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View posts with LTK links and recent Instagram content
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-testid="card-stat-ltk">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Posts with LTK Links</h3>
              <LinkIcon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-ltk-count">
              {ltkPosts.length}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-testid="card-stat-recent">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Posts</h3>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-recent-count">
              {recentPosts.length}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-testid="card-stat-engagement">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Engagement</h3>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-avg-engagement">
              {avgEngagement}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('ltk')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'ltk'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                data-testid="tab-ltk"
              >
                LTK Connected ({ltkPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'recent'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                data-testid="tab-recent"
              >
                Recent Posts ({recentPosts.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {displayPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12" data-testid={activeTab === 'ltk' ? 'card-no-ltk' : 'card-no-recent'}>
                {activeTab === 'ltk' ? (
                  <>
                    <LinkIcon className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                      No posts with LTK links found
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Import Instagram data with LTK links to see them here
                    </p>
                  </>
                ) : (
                  <>
                    <Instagram className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                      No recent Instagram posts found
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Import Instagram data to see your recent posts here
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
