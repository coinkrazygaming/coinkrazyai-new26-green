import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';

interface TicketDesignCardProps {
  id: number;
  name: string;
  description?: string;
  cost_sc: number;
  tab_count: number;
  prize_min_sc: number;
  prize_max_sc: number;
  background_color: string;
  image_url?: string;
  onPurchase: (designId: number) => Promise<void>;
  isPurchasing?: boolean;
  disabled?: boolean;
  insufficientBalance?: boolean;
}

export const TicketDesignCard: React.FC<TicketDesignCardProps> = ({
  id,
  name,
  description,
  cost_sc,
  tab_count,
  prize_min_sc,
  prize_max_sc,
  background_color,
  image_url,
  onPurchase,
  isPurchasing = false,
  disabled = false,
  insufficientBalance = false,
}) => {
  const handleClick = async () => {
    await onPurchase(id);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow" style={{ borderColor: background_color }}>
      {/* Card Image/Banner */}
      {image_url ? (
        <div
          className="w-full h-32 object-cover"
          style={{
            backgroundImage: `url(${image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : (
        <div
          className="w-full h-32 flex items-center justify-center text-4xl"
          style={{ backgroundColor: background_color + '40' }}
        >
          🎟️
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        {description && <CardDescription className="text-sm">{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Design Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400">Tabs</div>
            <div className="font-bold text-lg">{tab_count}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400">Prize Range</div>
            <div className="font-bold text-sm">{prize_min_sc}-{prize_max_sc} SC</div>
          </div>
          <div className="col-span-2 bg-gray-50 dark:bg-gray-900 rounded p-2 text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400">Win Rate</div>
            <div className="font-bold">~1 in 5</div>
          </div>
        </div>

        {/* Cost */}
        <div
          className="rounded-lg p-4 text-center text-white font-bold text-lg"
          style={{ backgroundColor: background_color }}
        >
          <div className="text-sm opacity-90 mb-1">Cost</div>
          <div className="text-2xl">{cost_sc} SC</div>
        </div>

        {/* Purchase Button */}
        <Button
          onClick={handleClick}
          disabled={disabled || isPurchasing || insufficientBalance}
          className="w-full"
          style={{
            backgroundColor: insufficientBalance ? '#ef4444' : background_color,
          }}
        >
          {isPurchasing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Purchasing...
            </>
          ) : insufficientBalance ? (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Insufficient Balance
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Buy Ticket
            </>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          Pull tabs to reveal instant prizes
        </p>
      </CardContent>
    </Card>
  );
};
