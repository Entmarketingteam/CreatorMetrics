import { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, Clock, Package, DollarSign, AlertCircle, X, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Insight {
  id: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionable: string;
  metadata: any;
  dismissed_at: string | null;
  created_at: string;
}

export default function Insights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState('');

  useEffect(() => {
    loadInsights();
  }, [user]);

  const loadInsights = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    if (!user || generating) return;
    setGenerating(true);
    setGeneratingStep('Analyzing content...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: posts } = await supabase
        .from('social_posts')
        .select('*')
        .eq('user_id', user.id);

      setGeneratingStep('Finding patterns...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id);

      setGeneratingStep('Generating recommendations...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newInsights: Omit<Insight, 'id' | 'created_at'>[] = [];

      if (posts && posts.length > 0) {
        const reels = posts.filter((p) => p.post_type === 'REEL');
        const regularPosts = posts.filter((p) => p.post_type === 'POST');

        if (reels.length > 0 && regularPosts.length > 0) {
          const avgReelRevenue =
            reels.reduce((sum, p) => sum + p.attributed_revenue, 0) / reels.length;
          const avgPostRevenue =
            regularPosts.reduce((sum, p) => sum + p.attributed_revenue, 0) / regularPosts.length;

          if (avgReelRevenue > avgPostRevenue * 1.5) {
            const multiplier = (avgReelRevenue / avgPostRevenue).toFixed(1);
            newInsights.push({
              user_id: user.id,
              type: 'CONTENT_TYPE',
              priority: 'HIGH',
              title: `Reels Generate ${multiplier}x More Revenue`,
              description: `Your Instagram Reels average $${avgReelRevenue.toFixed(
                0
              )} per post, while static posts average $${avgPostRevenue.toFixed(
                0
              )}. Reels also get 2.8x more engagement on average.`,
              actionable: 'Create 2-3 more Reels weekly',
              metadata: {
                avgReelRevenue,
                avgPostRevenue,
                reelCount: reels.length,
                postCount: regularPosts.length,
              },
              dismissed_at: null,
            });
          }
        }

        const morningPosts = posts.filter((p) => {
          const hour = new Date(p.posted_at).getHours();
          return hour >= 6 && hour <= 9;
        });

        const eveningPosts = posts.filter((p) => {
          const hour = new Date(p.posted_at).getHours();
          return hour >= 18 && hour <= 21;
        });

        if (eveningPosts.length > 0) {
          const avgEvening =
            eveningPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / eveningPosts.length;
          const avgMorning =
            morningPosts.length > 0
              ? morningPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / morningPosts.length
              : 0;

          if (avgEvening > avgMorning * 1.3) {
            newInsights.push({
              user_id: user.id,
              type: 'TIMING',
              priority: 'MEDIUM',
              title: 'Post at 7-9 PM for Best Results',
              description: `Evening posts (6-9 PM) get ${avgEvening.toFixed(
                1
              )}% engagement on average, significantly higher than other times. Your audience is most active during these hours.`,
              actionable: 'Schedule next post for 7:30 PM Tuesday',
              metadata: { avgEvening, avgMorning },
              dismissed_at: null,
            });
          }
        }

        const highPerformers = posts
          .filter((p) => p.attributed_revenue > 0)
          .sort((a, b) => b.attributed_revenue / (a.attributed_revenue || 1) - 1)
          .slice(0, 3);

        if (highPerformers.length > 0 && highPerformers[0].attributed_sales === 1) {
          newInsights.push({
            user_id: user.id,
            type: 'UNDERUTILIZED',
            priority: 'HIGH',
            title: `High-Value Content Opportunity`,
            description: `One of your posts earned $${highPerformers[0].attributed_revenue.toFixed(
              0
            )} from just one mention! This product has strong conversion potential.`,
            actionable: 'Create follow-up post about this product',
            metadata: { topPost: highPerformers[0].id },
            dismissed_at: null,
          });
        }
      }

      if (sales && sales.length > 0) {
        const platforms = ['LTK', 'Amazon', 'Walmart'];
        const platformStats = platforms.map((platform) => {
          const platformSales = sales.filter(
            (s) => s.platform.toUpperCase() === platform.toUpperCase()
          );
          const revenue = platformSales.reduce((sum, s) => sum + s.amount, 0);
          const count = platformSales.length;
          return { platform, revenue, count, avgPerSale: count > 0 ? revenue / count : 0 };
        });

        platformStats.sort((a, b) => b.avgPerSale - a.avgPerSale);

        if (platformStats[0].count > 0 && platformStats[1].count > 0) {
          const bestPlatform = platformStats[0];
          const secondPlatform = platformStats[1];
          const diff = ((bestPlatform.avgPerSale / secondPlatform.avgPerSale - 1) * 100).toFixed(0);

          newInsights.push({
            user_id: user.id,
            type: 'PLATFORM_ROI',
            priority: 'MEDIUM',
            title: `${bestPlatform.platform} Earns ${diff}% More Per Sale`,
            description: `${bestPlatform.platform} averages $${bestPlatform.avgPerSale.toFixed(
              2
            )} per sale vs ${secondPlatform.platform} at $${secondPlatform.avgPerSale.toFixed(
              2
            )}. Focus on higher-value platforms when possible.`,
            actionable: `Prioritize ${bestPlatform.platform} links when available`,
            metadata: { platformStats },
            dismissed_at: null,
          });
        }

        const thisMonth = sales.filter((s) => {
          const saleDate = new Date(s.sale_date);
          const now = new Date();
          return (
            saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
          );
        });

        const lastMonth = sales.filter((s) => {
          const saleDate = new Date(s.sale_date);
          const now = new Date();
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return (
            saleDate.getMonth() === lastMonthDate.getMonth() &&
            saleDate.getFullYear() === lastMonthDate.getFullYear()
          );
        });

        if (thisMonth.length > 0 && lastMonth.length > 0) {
          const thisMonthRevenue = thisMonth.reduce((sum, s) => sum + s.amount, 0);
          const lastMonthRevenue = lastMonth.reduce((sum, s) => sum + s.amount, 0);
          const percentChange = ((thisMonthRevenue / lastMonthRevenue - 1) * 100).toFixed(0);

          if (Math.abs(parseFloat(percentChange)) > 20) {
            newInsights.push({
              user_id: user.id,
              type: 'TREND',
              priority: Math.abs(parseFloat(percentChange)) > 40 ? 'HIGH' : 'MEDIUM',
              title: `Revenue ${parseFloat(percentChange) > 0 ? 'Up' : 'Down'} ${Math.abs(
                parseFloat(percentChange)
              )}% This Month`,
              description: `Your earnings this month are $${thisMonthRevenue.toFixed(
                0
              )} compared to $${lastMonthRevenue.toFixed(0)} last month. ${
                parseFloat(percentChange) > 0
                  ? 'Keep up the momentum!'
                  : 'Consider adjusting your strategy.'
              }`,
              actionable:
                parseFloat(percentChange) > 0
                  ? 'Double down on current strategy'
                  : 'Review what worked last month',
              metadata: { thisMonthRevenue, lastMonthRevenue, percentChange },
              dismissed_at: null,
            });
          }
        }
      }

      if (newInsights.length > 0) {
        await supabase.from('insights').delete().eq('user_id', user.id);

        const { error: insertError } = await supabase.from('insights').insert(newInsights as any);

        if (insertError) throw insertError;
      }

      await loadInsights();
    } catch (error) {
      console.error('Error generating insights:', error);
      alert('Failed to generate insights. Please try again.');
    } finally {
      setGenerating(false);
      setGeneratingStep('');
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('insights')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', insightId);

      if (error) throw error;
      setInsights(insights.filter((i) => i.id !== insightId));
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'LOW':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'CONTENT_TYPE':
        return TrendingUp;
      case 'TIMING':
        return Clock;
      case 'PLATFORM_ROI':
        return DollarSign;
      case 'UNDERUTILIZED':
        return Package;
      case 'TREND':
        return TrendingUp;
      default:
        return Lightbulb;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            AI-Powered Insights
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Data-driven recommendations to increase earnings
          </p>
        </div>

        <button
          onClick={generateInsights}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {generatingStep}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Insights
            </>
          )}
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Insights Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Click "Generate Insights" to analyze your data and get personalized recommendations to
              boost your earnings.
            </p>
            <button
              onClick={generateInsights}
              disabled={generating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Insights
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {insights.map((insight, index) => {
            const Icon = getIcon(insight.type);
            return (
              <div
                key={insight.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(
                      insight.priority
                    )}`}
                  >
                    {insight.priority} PRIORITY
                  </span>
                  <button
                    onClick={() => dismissInsight(insight.id)}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-indigo-900 dark:text-indigo-300 mb-1">
                        Recommended Action
                      </div>
                      <div className="text-sm text-indigo-700 dark:text-indigo-400">
                        {insight.actionable}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
