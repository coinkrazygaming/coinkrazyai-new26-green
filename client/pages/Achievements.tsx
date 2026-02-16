import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { achievements } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Star, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Achievement } from '@shared/api';

const Achievements = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [myAchievements, setMyAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchAchievements = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [allRes, myRes] = await Promise.all([
          achievements.getAll(),
          achievements.getMyAchievements(),
        ]);
        if (allRes.success && myRes.success) {
          setAllAchievements(allRes.data || []);
          setMyAchievements(myRes.data || []);
        } else {
          setError('Failed to load achievements');
        }
      } catch (error: any) {
        const message = error.message || 'Failed to load achievements';
        console.error('Failed to fetch achievements:', error);
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchAchievements();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const isUnlocked = (achievement: Achievement) => {
    return myAchievements.some(a => a.id === achievement.id);
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
        <h1 className="text-4xl font-black tracking-tight">ACHIEVEMENTS</h1>
        <p className="text-muted-foreground">Unlock badges and earn rewards</p>
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
              <p className="text-muted-foreground">Loading achievements...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Achievements Unlocked</p>
              <p className="text-sm text-muted-foreground">
                {myAchievements.length} / {allAchievements.length}
              </p>
            </div>
            <Progress
              value={(myAchievements.length / allAchievements.length) * 100}
              className="h-2"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-black text-primary">{myAchievements.length}</p>
              <p className="text-xs text-muted-foreground">Unlocked</p>
            </div>
            <div>
              <p className="text-3xl font-black">{allAchievements.length - myAchievements.length}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div>
              <p className="text-3xl font-black text-yellow-500">{myAchievements.length * 10}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAchievements.map(achievement => {
            const unlocked = isUnlocked(achievement);
            return (
              <Card
                key={achievement.id}
                className={`transition-all ${
                  unlocked
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border/30 opacity-60'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Icon */}
                    <div className="flex items-center justify-center">
                      <div className={`text-5xl p-4 rounded-full ${
                        unlocked ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        {achievement.icon_url || '🏆'}
                      </div>
                      {unlocked && (
                        <div className="absolute">
                          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        </div>
                      )}
                      {!unlocked && (
                        <div className="absolute">
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="text-center space-y-2">
                      <h3 className="font-bold">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>

                      {/* Requirement */}
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">Requirement</p>
                        <p className="text-sm font-semibold">
                          {achievement.requirement_type}: {achievement.requirement_value}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        variant={unlocked ? 'default' : 'secondary'}
                        className="mt-3"
                      >
                        {unlocked ? '✓ Unlocked' : 'Locked'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">About Achievements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Earn achievements by completing in-game milestones and challenges.</p>
          <p>Each achievement unlocks exclusive rewards and boosts your player ranking.</p>
          <p>You'll be notified in-game when you unlock an achievement!</p>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
};

export default Achievements;
