import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { poker } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { PokerTable } from '@shared/api';

const Poker = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<PokerTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [buyIn, setBuyIn] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchTables = async () => {
      try {
        const response = await poker.getTables();
        setTables(response.data || []);
      } catch (error: any) {
        console.error('Failed to fetch tables:', error);
        toast.error('Failed to load poker tables');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTables();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleJoinTable = async (tableId: number) => {
    if (buyIn < 1) {
      toast.error('Invalid buy-in amount');
      return;
    }

    try {
      await poker.joinTable(tableId, buyIn);
      toast.success('Joined table successfully!');
      setSelectedTable(null);
      setBuyIn(0);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join table');
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
        <h1 className="text-4xl font-black tracking-tight">POKER TABLES</h1>
        <p className="text-muted-foreground">Join a game and compete with other players</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(table => (
          <Card key={table.id} className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{table.name}</CardTitle>
                  <CardDescription>{table.stakes}</CardDescription>
                </div>
                <Badge variant={table.status === 'active' ? 'default' : 'secondary'}>
                  {table.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Players
                  </span>
                  <span className="font-bold">{table.current_players}/{table.max_players}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Buy In
                  </span>
                  <span className="font-bold">${table.buy_in_min} - ${table.buy_in_max}</span>
                </div>
              </div>

              {selectedTable === table.id ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    min={table.buy_in_min}
                    max={table.buy_in_max}
                    value={buyIn}
                    onChange={(e) => setBuyIn(Number(e.target.value))}
                    placeholder={`${table.buy_in_min} - ${table.buy_in_max}`}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <Button
                    onClick={() => handleJoinTable(table.id)}
                    size="sm"
                    className="w-full"
                  >
                    Confirm Join
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedTable(null);
                      setBuyIn(0);
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
                    setSelectedTable(table.id);
                    setBuyIn(table.buy_in_min);
                  }}
                  className="w-full"
                  disabled={table.current_players >= table.max_players}
                >
                  Join Table
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Poker;
