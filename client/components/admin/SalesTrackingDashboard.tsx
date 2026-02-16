import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Target, Users, Zap, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

interface SalesStats {
  total_sales: number;
  total_revenue_sc: number;
  total_payouts_sc: number;
  net_profit_sc: number;
  avg_purchase_cost: number;
  avg_win_amount: number;
}

interface GameTypeStats {
  game_type: string;
  total_sales: number;
  total_revenue_sc: number;
  total_payouts_sc: number;
  net_profit_sc: number;
  win_rate: number;
}

interface DailyRevenue {
  date: string;
  total_revenue_sc: number;
  total_payouts_sc: number;
  net_profit_sc: number;
  transaction_count: number;
}

interface TopGame {
  game_name: string;
  sales_count: number;
  revenue_sc: number;
  payouts_sc: number;
}

interface SalesTrackingDashboardProps {
  onRefresh?: () => void;
}

export const SalesTrackingDashboard: React.FC<SalesTrackingDashboardProps> = ({ onRefresh }) => {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [gameStats, setGameStats] = useState<GameTypeStats[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [topGames, setTopGames] = useState<TopGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('30days');

  useEffect(() => {
    fetchSalesData();
  }, [timeRange]);

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all required data in parallel
      const [statsRes, gameRes, dailyRes, topRes] = await Promise.all([
        apiCall<{ data: SalesStats[] }>('/admin/v2/sales/stats'),
        apiCall<{ data: GameTypeStats[] }>('/admin/v2/sales/by-game'),
        apiCall<{ data: DailyRevenue[] }>('/admin/v2/sales/daily'),
        apiCall<{ data: TopGame[] }>('/admin/v2/sales/top-games'),
      ]);

      if (statsRes.data?.[0]) setStats(statsRes.data[0]);
      if (gameRes.data) setGameStats(gameRes.data);
      if (dailyRes.data) setDailyRevenue(dailyRes.data);
      if (topRes.data) setTopGames(topRes.data);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSalesData();
    onRefresh?.();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const profitMargin = stats?.total_revenue_sc ? 
    ((stats.net_profit_sc / stats.total_revenue_sc) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Sales & Revenue Tracking
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor SC sales, wins, and revenue metrics
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <Zap className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        {(['7days', '30days', 'all'] as const).map(range => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            onClick={() => setTimeRange(range)}
            className="capitalize"
          >
            {range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : 'All Time'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(stats?.total_revenue_sc || 0).toFixed(2)} SC
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              From {stats?.total_sales || 0} sales
            </p>
          </CardContent>
        </Card>

        {/* Total Payouts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <TrendingDown className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Number(stats?.total_payouts_sc || 0).toFixed(2)} SC
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Total prize winnings
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Target className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Number(stats?.net_profit_sc || 0).toFixed(2)} SC
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              {profitMargin}% profit margin
            </p>
          </CardContent>
        </Card>

        {/* Avg Win Amount */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Win</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(stats?.avg_win_amount || 0).toFixed(2)} SC
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Per winning transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Game Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue by Game Type</CardTitle>
          <CardDescription>Sales and payouts breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gameStats.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm">No game type data available</p>
            ) : (
              gameStats.map((game, idx) => (
                <div key={idx} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold capitalize">{game.game_type}</span>
                      <Badge variant="secondary">{game.total_sales} sales</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {Number(game.net_profit_sc).toFixed(2)} SC
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {(Number(game.win_rate) * 100).toFixed(1)}% win rate
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded px-3 py-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Revenue</p>
                      <p className="font-semibold">{Number(game.total_revenue_sc).toFixed(2)} SC</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded px-3 py-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Payouts</p>
                      <p className="font-semibold text-orange-600">{Number(game.total_payouts_sc).toFixed(2)} SC</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Games */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Games</CardTitle>
          <CardDescription>Games generating most revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topGames.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm">No game performance data</p>
            ) : (
              topGames.map((game, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <div>
                    <p className="font-semibold">{game.game_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {game.sales_count} sales
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{Number(game.revenue_sc).toFixed(2)} SC</p>
                    <p className="text-xs text-orange-600">
                      -{Number(game.payouts_sc).toFixed(2)} SC payouts
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Revenue Chart Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Revenue Summary</CardTitle>
          <CardDescription>Revenue and payouts by day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dailyRevenue.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm">No daily data available</p>
            ) : (
              dailyRevenue.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-semibold text-sm">
                        {new Date(day.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {day.transaction_count} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      +{Number(day.total_revenue_sc).toFixed(2)} SC
                    </p>
                    <p className="text-xs text-orange-600">
                      -{Number(day.total_payouts_sc).toFixed(2)} SC payout
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
