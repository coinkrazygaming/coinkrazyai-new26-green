import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { bingo } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { BingoGame } from '@shared/api';

const Bingo = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<BingoGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingTickets, setPurchasingTickets] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchGames = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await bingo.getRooms();
        if (response.success) {
          setGames(response.data || []);
        } else {
          setError('Failed to load bingo rooms');
        }
      } catch (error: any) {
        const message = error.message || 'Failed to load bingo games';
        console.error('Failed to fetch bingo games:', error);
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchGames();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleBuyTicket = async (gameId: number) => {
    setPurchasingTickets(prev => new Set([...prev, gameId]));
    try {
      const response = await bingo.buyTicket(gameId);
      if (response.success) {
        toast.success('Ticket purchased! Check your active games.');
        // Refresh the games list
        const updatedResponse = await bingo.getRooms();
        if (updatedResponse.success) {
          setGames(updatedResponse.data || []);
        }
      } else {
        toast.error('Failed to purchase ticket');
      }
    } catch (error: any) {
      const message = error.message || 'Failed to purchase ticket';
      toast.error(message);
    } finally {
      setPurchasingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(gameId);
        return newSet;
      });
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
        <h1 className="text-4xl font-black tracking-tight">BINGO ROOMS</h1>
        <p className="text-muted-foreground">Join a room and play bingo for amazing jackpots</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map(game => (
          <Card key={game.id} className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{game.name}</CardTitle>
                  <CardDescription>Pattern: {game.pattern}</CardDescription>
                </div>
                <Badge variant="outline">{game.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Players
                  </span>
                  <span className="font-bold">{game.players}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ticket Price</span>
                  <span className="font-bold">${Number(game.ticket_price ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Jackpot
                  </span>
                  <span className="font-bold text-yellow-600">${Number(game.jackpot ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={() => handleBuyTicket(game.id)}
                disabled={purchasingTickets.has(game.id)}
                className="w-full"
              >
                {purchasingTickets.has(game.id) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Purchasing...
                  </>
                ) : (
                  'Buy Ticket'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {games.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No bingo games available at the moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Bingo;
