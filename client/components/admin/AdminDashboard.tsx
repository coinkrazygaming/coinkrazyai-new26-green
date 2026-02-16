import React, { useEffect, useState } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, TrendingUp, Gamepad2, AlertCircle, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DashboardStats {
  totalPlayers?: number;
  activePlayers?: number;
  totalRevenue?: number;
  totalWagered?: number;
  totalWon?: number;
  averagePlayerValue?: number;
  gamesToday?: number;
  newPlayersToday?: number;
  openTickets?: number;
  pendingKyc?: number;
  pendingWithdrawals?: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);

      // Check if admin token exists
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        console.warn('No admin token found. Admin must be logged in.');
        toast.error('Please log in as admin to access this dashboard');
        setIsLoading(false);
        return;
      }

      const response = await adminV2.dashboard.getStats();
      const data = response.data || response || {};
      setStats({
        totalPlayers: data.totalPlayers || 0,
        activePlayers: data.activePlayers || 0,
        totalRevenue: data.totalRevenue || 0,
        totalWagered: data.totalWagered || 0,
        totalWon: data.totalWon || 0,
        averagePlayerValue: data.averagePlayerValue || 0,
        gamesToday: data.gamesToday || 0,
        newPlayersToday: data.newPlayersToday || 0,
        openTickets: data.openTickets || 0,
        pendingKyc: data.pendingKyc || 0,
        pendingWithdrawals: data.pendingWithdrawals || 0,
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      const errorMsg = error?.message || 'Failed to load dashboard statistics';

      // Check if it's an auth error
      if (error?.status === 401 || errorMsg.includes('401')) {
        toast.error('Admin session expired. Please log in again.');
        localStorage.removeItem('admin_token');
      } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        toast.error('Network error: Unable to reach the server. Check your connection.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time platform statistics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Players */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Players</CardDescription>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{Number(stats.totalPlayers ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Number(stats.activePlayers ?? 0).toLocaleString()} active today
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">
              ${Number(stats.totalRevenue ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        {/* Total Wagered */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Wagered</CardDescription>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">
              ${Number(stats.totalWagered ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime</p>
          </CardContent>
        </Card>

        {/* Avg Player Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Avg Player Value</CardDescription>
            <Activity className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-600">
              ${Number(stats.averagePlayerValue ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Per player</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Games Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Games Today</CardDescription>
            <Gamepad2 className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{(stats.gamesToday || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Gaming sessions</p>
          </CardContent>
        </Card>

        {/* New Players */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>New Players Today</CardDescription>
            <Users className="w-4 h-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{(stats.newPlayersToday || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registrations</p>
          </CardContent>
        </Card>

        {/* Pending KYC */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Pending KYC</CardDescription>
            <AlertCircle className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{(stats.pendingKyc || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        {/* Open Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Open Support Tickets</CardDescription>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{(stats.openTickets || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Won vs Wagered</CardTitle>
            <CardDescription>Platform payout ratio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Wagered</span>
                <span className="font-semibold">${(stats?.totalWagered || 0).toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2"></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Won</span>
                <span className="font-semibold text-green-600">${(stats?.totalWon || 0).toFixed(2)}</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2"></div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">House Edge</span>
                <span className="font-bold">
                  {stats.totalWagered && stats.totalWagered > 0
                    ? (((stats.totalWagered - (stats.totalWon || 0)) / stats.totalWagered) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Pending management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-semibold text-sm">KYC Reviews Pending</p>
                  <p className="text-xs text-muted-foreground">{(stats.pendingKyc || 0).toLocaleString()} players</p>
                </div>
                <span className="text-lg font-bold text-yellow-600">{(stats.pendingKyc || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-semibold text-sm">Withdrawals Pending</p>
                  <p className="text-xs text-muted-foreground">{(stats.pendingWithdrawals || 0).toLocaleString()} requests</p>
                </div>
                <span className="text-lg font-bold text-red-600">{(stats.pendingWithdrawals || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-semibold text-sm">Support Tickets</p>
                  <p className="text-xs text-muted-foreground">{(stats.openTickets || 0).toLocaleString()} open</p>
                </div>
                <span className="text-lg font-bold text-blue-600">{(stats.openTickets || 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
