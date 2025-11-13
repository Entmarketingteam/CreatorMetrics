import { useState } from 'react';
import { ProductTile } from '../ui/ProductTile';
import { TopPerformer } from '../../hooks/useDashboardData';

interface TopPerformersProps {
  performers: TopPerformer[];
  period: string;
  onViewMore?: () => void;
}

export function TopPerformers({ performers, period, onViewMore }: TopPerformersProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'posts'>('products');

  const products = performers.filter(p => p.type === 'product');
  const posts = performers.filter(p => p.type === 'post');

  return (
    <div className="bg-card rounded-lg p-6 card-shadow" data-testid="card-top-performers">
      <h2 className="text-h3 text-foreground font-semibold mb-2">Top performers</h2>
      <p className="text-caption text-muted-foreground mb-4">Last {period}</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'products'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="button-tab-products"
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'posts'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="button-tab-posts"
        >
          Posts
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeTab === 'products' ? (
          products.length > 0 ? (
            products.slice(0, 2).map(product => (
              <ProductTile
                key={product.id}
                id={product.id}
                name={product.name}
                store={product.store || 'Unknown'}
                clicks={product.clicks}
                sales={product.sales}
                revenue={product.revenue}
                imageUrl={product.imageUrl}
              />
            ))
          ) : (
            <p className="text-body text-muted-foreground text-center py-8">No products yet</p>
          )
        ) : activeTab === 'posts' ? (
          posts.length > 0 ? (
            posts.slice(0, 2).map(post => (
              <div
                key={post.id}
                className="bg-card rounded-lg p-4 border border-border hover-elevate active-elevate-2 cursor-pointer"
                data-testid={`post-tile-${post.id}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-1 bg-primary/10 text-primary rounded text-caption font-medium">
                    {post.platform}
                  </div>
                </div>
                <h3 className="text-body font-semibold text-foreground mb-3 line-clamp-2">{post.name}</h3>
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-semibold text-foreground">${post.revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-muted-foreground">Sales</span>
                    <span className="font-medium text-foreground">{post.sales}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-body text-muted-foreground text-center py-8">No posts yet</p>
          )
        ) : (
          <p className="text-body text-muted-foreground text-center py-8">No data available</p>
        )}
      </div>

      {onViewMore && (
        <button
          onClick={onViewMore}
          className="w-full mt-4 py-3 text-body font-medium text-foreground border border-border rounded-lg hover-elevate active-elevate-2"
          data-testid="button-view-more-performers"
        >
          View more
        </button>
      )}
    </div>
  );
}
