import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Calendar, Mail, Verified, Dice5, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { casino } from '@/lib/api';

const Profile = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [spinStats, setSpinStats] = useState<any>(null);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadCasinoData();
    }
  }, [user, isAuthenticated]);

  const loadCasinoData = async () => {
    try {
      setLoadingStats(true);
      setStatsError(null);
      const [statsRes, historyRes] = await Promise.all([
        casino.getStats(),
        casino.getSpinHistory(10, 0)
      ]);

      if (statsRes.success) {
        setSpinStats(statsRes.data);
      } else {
        setStatsError('Failed to load casino statistics');
      }

      if (historyRes.success) {
        setSpinHistory(historyRes.data.spins || []);
      }
    } catch (err: any) {
      const message = err.message || 'Failed to load casino data';
      console.error('Failed to load casino data:', err);
      setStatsError(message);
      toast.error(message);
    } finally {
      setLoadingStats(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile loading failed</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Return Home
        </Button>
      </div>
    );
  }

  const joinDate = user.join_date ? new Date(user.join_date).toLocaleDateString() : 'Unknown';
  const lastLogin = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Player Profile</h1>
        <p className="text-muted-foreground">View and manage your account information</p>
      </div>

      {/* Main Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center">
              <User className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription>@{user.username}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Account Status</p>
              <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                {user.status}
              </Badge>
            </div>

            {user.kyc_verified && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Verified className="w-4 h-4" />
                <span>KYC Verified</span>
              </div>
            )}

            <div className="pt-4 space-y-2">
              <Button className="w-full" asChild variant="outline">
                <a href="/account">Edit Profile</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <p className="text-lg">{user.email}</p>
              </div>

              {/* Join Date */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </label>
                <p className="text-lg">{joinDate}</p>
              </div>

              {/* KYC Level */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                  Verification Level
                </label>
                <Badge variant="outline" className="text-base">
                  {user.kyc_level}
                </Badge>
              </div>

              {/* Last Login */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                  Last Login
                </label>
                <p className="text-lg">{lastLogin}</p>
              </div>
            </div>

            {/* Wallet Summary */}
            <div className="pt-6 border-t border-border">
              <h3 className="font-semibold mb-4">Wallet Balance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/20">
                  <p className="text-sm text-muted-foreground mb-1">Gold Coins</p>
                  <p className="text-2xl font-bold text-secondary">{Number(user.gc_balance ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-primary/20 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Sweeps Coins</p>
                  <p className="text-2xl font-bold text-primary">{Number(user.sc_balance ?? 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {statsError}
            <Button
              variant="outline"
              size="sm"
              onClick={loadCasinoData}
              disabled={loadingStats}
              className="ml-4"
            >
              {loadingStats ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry'
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Casino Statistics Loading */}
      {loadingStats && !spinStats && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading casino statistics...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Casino Statistics */}
      {spinStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dice5 className="w-5 h-5" />
              Casino Statistics
            </CardTitle>
            <CardDescription>Your casino game performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/20">
                <p className="text-sm text-muted-foreground mb-1">Total Spins</p>
                <p className="text-2xl font-bold">{spinStats.total_spins}</p>
              </div>
              <div className="bg-primary/20 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                <p className="text-2xl font-bold text-primary">{spinStats.win_rate}%</p>
              </div>
              <div className="bg-green-500/20 p-4 rounded-lg border border-green-500/20">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Total Wins
                </p>
                <p className="text-2xl font-bold text-green-500">{spinStats.total_wins}</p>
              </div>
              <div className="bg-red-500/20 p-4 rounded-lg border border-red-500/20">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" /> Total Losses
                </p>
                <p className="text-2xl font-bold text-red-500">{spinStats.total_losses}</p>
              </div>
              <div className="bg-amber-500/20 p-4 rounded-lg border border-amber-500/20">
                <p className="text-sm text-muted-foreground mb-1">Total Wagered</p>
                <p className="text-2xl font-bold text-amber-500">{Number(spinStats.total_wagered || 0).toFixed(2)} SC</p>
              </div>
              <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/20">
                <p className="text-sm text-muted-foreground mb-1">Total Winnings</p>
                <p className="text-2xl font-bold text-blue-500">{Number(spinStats.total_winnings || 0).toFixed(2)} SC</p>
              </div>
              <div className="bg-purple-500/20 p-4 rounded-lg border border-purple-500/20">
                <p className="text-sm text-muted-foreground mb-1">Max Win</p>
                <p className="text-2xl font-bold text-purple-500">{Number(spinStats.max_win || 0).toFixed(2)} SC</p>
              </div>
              <div className="bg-indigo-500/20 p-4 rounded-lg border border-indigo-500/20">
                <p className="text-sm text-muted-foreground mb-1">Games Played</p>
                <p className="text-2xl font-bold text-indigo-500">{spinStats.games_played}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Casino Spins */}
      {spinHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dice5 className="w-5 h-5" />
              Recent Spins
            </CardTitle>
            <CardDescription>Your last 10 casino game spins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-semibold">Game</th>
                    <th className="text-left p-2 font-semibold">Bet</th>
                    <th className="text-left p-2 font-semibold">Result</th>
                    <th className="text-left p-2 font-semibold">Winnings</th>
                    <th className="text-left p-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {spinHistory.map((spin) => {
                    const betAmount = Number(spin.bet_amount ?? 0);
                    const winnings = Number(spin.winnings ?? 0);
                    return (
                      <tr key={spin.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-2">
                          <span className="font-medium">{spin.game_name}</span>
                        </td>
                        <td className="p-2">{betAmount.toFixed(2)} SC</td>
                        <td className="p-2">
                          <Badge variant={spin.result === 'win' ? 'default' : 'destructive'}>
                            {spin.result.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <span className={winnings > 0 ? 'text-green-500 font-bold' : 'text-red-500'}>
                            {winnings > 0 ? '+' : ''}{winnings.toFixed(2)} SC
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">
                          {new Date(spin.created_at).toLocaleDateString()} {new Date(spin.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your security and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild variant="outline" className="w-full">
            <a href="/account">Change Password</a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href="/account">Two-Factor Authentication</a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href="/account">Privacy Settings</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
