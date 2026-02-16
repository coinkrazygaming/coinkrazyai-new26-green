import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { leaderboards } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Medal, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { LeaderboardEntry } from '@shared/api';

const Leaderboards = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchLeaderboards = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [leaderboardRes, myRankRes] = await Promise.all([
          leaderboards.getLeaderboard(),
          leaderboards.getMyRank(),
        ]);
        if (leaderboardRes.success && myRankRes.success) {
          setLeaderboard(leaderboardRes.data?.entries || []);
          setMyRank(myRankRes.data || null);
        } else {
          setError('Failed to load leaderboards');
        }
      } catch (error: any) {
        const message = error.message || 'Failed to load leaderboards';
        console.error('Failed to fetch leaderboards:', error);
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchLeaderboards();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight">LEADERBOARDS</h1>
        <p className="text-muted-foreground">Top players ranked by score</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-4"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && !error && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading leaderboards...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
      {/* My Rank */}
      {myRank && (
        <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Your Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-4xl font-black text-primary"># {myRank.rank}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-4xl font-black">{Number(myRank.score ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Global Leaderboard</CardTitle>
          <CardDescription>Top 50 players by total score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map(entry => (
              <div
                key={entry.player_id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  entry.player_id === user?.id
                    ? 'bg-primary/10 border-primary/30'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                {/* Rank & Name */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 flex items-center justify-center">
                    {getMedalIcon(entry.rank) ? (
                      <span className="text-2xl">{getMedalIcon(entry.rank)}</span>
                    ) : (
                      <Badge variant="outline" className="font-bold">
                        #{entry.rank}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="font-bold">
                      {entry.name}
                      {entry.player_id === user?.id && (
                        <Badge className="ml-2 text-xs">YOU</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">@{entry.username}</p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="font-bold text-lg">{Number(entry.score ?? 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">How Scoring Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Players earn points based on their wins and total wagered amount across all games.</p>
          <p>The leaderboard updates in real-time as players win or lose.</p>
          <p>Top players receive exclusive rewards and recognition.</p>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
};

export default Leaderboards;
