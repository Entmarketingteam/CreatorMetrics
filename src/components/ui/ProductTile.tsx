import { MousePointer, ShoppingBag, DollarSign } from 'lucide-react';

interface ProductTileProps {
  id: string;
  name: string;
  store: string;
  imageUrl?: string;
  clicks?: number;
  sales?: number;
  revenue?: number;
  onClick?: () => void;
}

export function ProductTile({
  id,
  name,
  store,
  imageUrl,
  clicks,
  sales,
  revenue,
  onClick,
}: ProductTileProps) {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg overflow-hidden card-shadow hover-elevate active-elevate-2 cursor-pointer"
      data-testid={`product-tile-${id}`}
    >
      {imageUrl && (
        <div className="aspect-square bg-muted">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            data-testid={`img-product-${id}`}
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-h3 text-foreground font-semibold line-clamp-2 mb-1" data-testid={`text-product-name-${id}`}>
          {name}
        </h3>
        <p className="text-caption text-muted-foreground mb-3" data-testid={`text-store-${id}`}>{store}</p>

        <div className="space-y-2">
          {clicks !== undefined && (
            <div className="flex items-center justify-between text-caption">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MousePointer className="w-3.5 h-3.5" />
                <span>Product clicks</span>
              </div>
              <span className="font-medium text-foreground" data-testid={`text-clicks-${id}`}>{clicks.toLocaleString()}</span>
            </div>
          )}
          {sales !== undefined && (
            <div className="flex items-center justify-between text-caption">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Items sold</span>
              </div>
              <span className="font-medium text-foreground" data-testid={`text-sales-${id}`}>{sales.toLocaleString()}</span>
            </div>
          )}
          {revenue !== undefined && (
            <div className="flex items-center justify-between text-caption">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Commission</span>
              </div>
              <span className="font-semibold text-foreground" data-testid={`text-revenue-${id}`}>
                ${revenue.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
