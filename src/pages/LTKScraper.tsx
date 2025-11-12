import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Sparkles,
  Download,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Package
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface LTKPost {
  id: string;
  creator_handle: string;
  creator_profile_url: string;
  post_url: string;
  original_caption: string;
  category: string | null;
  scraped_at: string;
  products?: LTKProduct[];
  captions?: GeneratedCaption[];
}

interface LTKProduct {
  id: string;
  title: string;
  merchant: string;
  product_url: string;
  image_url: string | null;
}

interface GeneratedCaption {
  id: string;
  caption: string;
  caption_type: string;
  prompt_type: string;
  tone: string;
  hashtags: string[];
  word_count: number;
  char_count: number;
  created_at: string;
}

interface Stats {
  total_posts: number;
  total_captions: number;
  unique_creators: number;
}

export default function LTKScraper() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [maxPosts, setMaxPosts] = useState(10);
  const [posts, setPosts] = useState<LTKPost[]>([]);
  const [stats, setStats] = useState<Stats>({ total_posts: 0, total_captions: 0, unique_creators: 0 });
  const [selectedPost, setSelectedPost] = useState<LTKPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCaption, setCopiedCaption] = useState('');

  // Prompt configuration
  const [promptType, setPromptType] = useState('gift_guide');
  const [tone, setTone] = useState('casual');
  const [maxLength, setMaxLength] = useState(250);

  useEffect(() => {
    loadPosts();
    loadStats();
  }, [user]);

  const loadPosts = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts?user_id=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/stats?user_id=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleScrape = async () => {
    if (!url || !user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          max_posts: maxPosts,
          category: category || null,
          user_id: user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setUrl('');
        setCategory('');
        await loadPosts();
        await loadStats();
      } else {
        setError(data.error || 'Failed to scrape URL');
      }
    } catch (err) {
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCaption = async (postId: string) => {
    if (!user) return;

    setGenerating(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-caption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          user_id: user.id,
          prompt_type: promptType,
          tone: tone,
          max_length: maxLength,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Caption generated successfully!');
        // Reload the selected post to get new caption
        loadPostDetails(postId);
      } else {
        setError(data.error || 'Failed to generate caption');
      }
    } catch (err) {
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setGenerating(false);
    }
  };

  const loadPostDetails = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPost({ ...data.post, products: data.post.products || [], captions: data.captions || [] });
      }
    } catch (err) {
      console.error('Error loading post details:', err);
    }
  };

  const handleCopyCaption = (caption: string, id: string) => {
    navigator.clipboard.writeText(caption);
    setCopiedCaption(id);
    setTimeout(() => setCopiedCaption(''), 2000);
  };

  const handleDeletePost = async (postId: string) => {
    if (!user || !confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}?user_id=${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Post deleted successfully');
        setPosts(posts.filter(p => p.id !== postId));
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
        }
        await loadStats();
      }
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  const exportPosts = () => {
    const dataStr = JSON.stringify(posts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ltk-posts-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          LTK Scraper + Caption Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Scrape LTK posts and generate AI-powered captions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_posts}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Posts Scraped</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_captions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Captions Generated</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unique_creators}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Unique Creators</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scraper Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Scrape LTK URL
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              LTK URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.shopltk.com/..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category (Optional)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., gift_guide, sale_alert"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Posts
              </label>
              <input
                type="number"
                value={maxPosts}
                onChange={(e) => setMaxPosts(parseInt(e.target.value))}
                min="1"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <button
            onClick={handleScrape}
            disabled={loading || !url}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Scrape LTK Posts
              </>
            )}
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scraped Posts ({posts.length})
          </h2>
          <button
            onClick={exportPosts}
            disabled={posts.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {posts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No posts yet. Scrape an LTK URL to get started!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => loadPostDetails(post.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        @{post.creator_handle}
                      </span>
                      {post.category && (
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-xs">
                          {post.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {post.original_caption}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(post.scraped_at).toLocaleDateString()}</span>
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Post
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(post.id);
                    }}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full my-8 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    @{selectedPost.creator_handle}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedPost.original_caption}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              {/* Products */}
              {selectedPost.products && selectedPost.products.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Products ({selectedPost.products.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPost.products.map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {product.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {product.merchant}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption Generator */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Generate AI Caption
                </h4>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <select
                    value={promptType}
                    onChange={(e) => setPromptType(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="gift_guide">Gift Guide</option>
                    <option value="sale_alert">Sale Alert</option>
                    <option value="product_roundup">Product Roundup</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="lifestyle">Lifestyle</option>
                  </select>

                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="casual">Casual</option>
                    <option value="professional">Professional</option>
                    <option value="fun">Fun</option>
                    <option value="upbeat">Upbeat</option>
                  </select>

                  <input
                    type="number"
                    value={maxLength}
                    onChange={(e) => setMaxLength(parseInt(e.target.value))}
                    min="50"
                    max="500"
                    placeholder="Max length"
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <button
                  onClick={() => handleGenerateCaption(selectedPost.id)}
                  disabled={generating}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Caption
                    </>
                  )}
                </button>
              </div>

              {/* Generated Captions */}
              {selectedPost.captions && selectedPost.captions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Generated Captions ({selectedPost.captions.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedPost.captions.map((caption) => (
                      <div
                        key={caption.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-xs">
                              {caption.caption_type}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {caption.prompt_type} · {caption.tone}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyCaption(caption.caption, caption.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                          >
                            {copiedCaption === caption.id ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white mb-2">
                          {caption.caption}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>{caption.word_count} words</span>
                          <span>{caption.char_count} chars</span>
                          {caption.hashtags.length > 0 && (
                            <span>{caption.hashtags.length} hashtags</span>
                          )}
                        </div>
                        {caption.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {caption.hashtags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
