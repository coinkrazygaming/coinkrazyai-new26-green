import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { sportsbook } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { SportsEvent } from '@shared/api';
import { MIN_BET_SC, MAX_BET_SC } from '@shared/constants';

const Sportsbook = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [betAmount, setBetAmount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchEvents = async () => {
      try {
        const response = await sportsbook.getLiveGames();
        setEvents(response.data || []);
      } catch (error: any) {
        console.error('Failed to fetch events:', error);
        toast.error('Failed to load sports events');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handlePlaceBet = async (eventId: number, odds: number) => {
    if (betAmount < MIN_BET_SC) {
      toast.error(`Bet amount must be at least ${MIN_BET_SC} SC`);
      return;
    }

    if (betAmount > MAX_BET_SC) {
      toast.error(`Bet amount cannot exceed ${MAX_BET_SC} SC`);
      return;
    }

    if (Number(user?.sc_balance || 0) < betAmount) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      await sportsbook.placeBet(eventId, betAmount, odds);
      toast.success('Bet placed successfully!');
      setSelectedEvent(null);
      setBetAmount(0);
    } catch (error: any) {
      toast.error(error.message || 'Failed to place bet');
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
        <h1 className="text-4xl font-black tracking-tight">SPORTSBOOK</h1>
        <p className="text-muted-foreground">Live odds and parlay betting on all major sports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(event => (
          <Card key={event.id} className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-2">{event.sport}</Badge>
                  <CardTitle className="text-lg">{event.event_name}</CardTitle>
                </div>
                <Badge variant={event.status === 'Live' ? 'default' : 'secondary'} className="whitespace-nowrap">
                  {event.status === 'Live' && <span className="animate-pulse mr-1">🔴</span>}
                  {event.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {event.total_bets && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Bets</span>
                    <span className="font-bold">${Number(event.total_bets ?? 0).toLocaleString()}</span>
                  </div>
                )}
                {event.line_movement && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Line
                    </span>
                    <span className="font-bold">{event.line_movement}</span>
                  </div>
                )}
              </div>

              {selectedEvent === event.id ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    min={MIN_BET_SC}
                    max={MAX_BET_SC}
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    placeholder="Bet amount"
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <Button
                    onClick={() => handlePlaceBet(event.id, event.odds || 1.5)}
                    size="sm"
                    className="w-full"
                  >
                    Place Bet
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedEvent(null);
                      setBetAmount(0);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    setSelectedEvent(event.id);
                    setBetAmount(MAX_BET_SC);
                  }}
                  className="w-full"
                  disabled={event.locked}
                >
                  {event.locked ? 'Event Locked' : 'Place Bet'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No live events at the moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Sportsbook;
