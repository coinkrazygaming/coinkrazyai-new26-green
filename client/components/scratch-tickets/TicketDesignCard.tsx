import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Zap, Target } from 'lucide-react';

interface TicketDesign {
  id: number;
  name: string;
  description: string;
  cost_sc: number;
  slot_count: number;
  win_probability: number;
  prize_min_sc: number;
  prize_max_sc: number;
  image_url?: string;
  background_color: string;
}

interface TicketDesignCardProps {
  design: TicketDesign;
  onPurchase: (designId: number) => Promise<void>;
  isLoading: boolean;
  balance: number;
}

export const TicketDesignCard: React.FC<TicketDesignCardProps> = ({
  design,
  onPurchase,
  isLoading,
  balance,
}) => {
  const canAfford = balance >= design.cost_sc;
  const winOdds = `1 in ${Math.round(100 / design.win_probability)}`;

  const handlePurchase = async () => {
    await onPurchase(design.id);
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow"
      style={{ borderTop: `4px solid ${design.background_color}` }}
    >
      {/* Ticket Preview */}
      <div
        className="h-32 relative overflow-hidden"
        style={{ backgroundColor: design.background_color }}
      >
        {design.image_url ? (
          <img
            src={design.image_url}
            alt={design.name}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br opacity-50">
            <div className="text-center">
              <div className="text-4xl mb-2">🎫</div>
              <p className="text-xs font-bold text-white/70">CoinKrazy Scratch</p>
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{design.name}</CardTitle>
        {design.description && (
          <CardDescription className="line-clamp-2">{design.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Slots */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Slots</div>
            <div className="font-bold text-lg">{design.slot_count}</div>
          </div>

          {/* Win Odds */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Win Odds</div>
            <div className="font-bold text-lg text-green-600">{winOdds}</div>
          </div>

          {/* Prize Range */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Prize Range</div>
            <div className="font-bold">
              {design.prize_min_sc}-{design.prize_max_sc} SC
            </div>
          </div>

          {/* Cost */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Cost</div>
            <div className="font-bold text-purple-600 flex items-center gap-1">
              <Coins className="w-4 h-4" />
              {design.cost_sc}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Instant Win
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Target className="w-3 h-3 mr-1" />
            1 Prize Per Ticket
          </Badge>
        </div>

        {/* Purchase Button */}
        <Button
          onClick={handlePurchase}
          disabled={!canAfford || isLoading}
          className="w-full"
          size="lg"
          variant={canAfford ? 'default' : 'secondary'}
        >
          {!canAfford ? (
            <>Insufficient SC</>
          ) : isLoading ? (
            <>Purchasing...</>
          ) : (
            <>
              <Coins className="w-4 h-4 mr-2" />
              Purchase for {design.cost_sc} SC
            </>
          )}
        </Button>

        {!canAfford && (
          <p className="text-xs text-red-600 dark:text-red-400 text-center">
            You need {design.cost_sc - balance} more SC
          </p>
        )}
      </CardContent>
    </Card>
  );
};
