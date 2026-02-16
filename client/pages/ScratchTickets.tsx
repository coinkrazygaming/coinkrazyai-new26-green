import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { apiCall } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Coins, Ticket, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { ScratchTicket } from '@/components/scratch-tickets/ScratchTicket';
import { TicketDesignCard } from '@/components/scratch-tickets/TicketDesignCard';

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
  enabled: boolean;
}

interface ScratchTicketData {
  id: number;
  ticket_number: string;
  design_id: number;
  player_id: number;
  slots: Array<{
    index: number;
    value: 'LOSS' | number;
    revealed: boolean;
  }>;
  status: 'active' | 'expired' | 'claimed';
  claim_status: 'unclaimed' | 'claimed';
  created_at: string;
}

const ScratchTickets = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<TicketDesign[]>([]);
  const [myTickets, setMyTickets] = useState<ScratchTicketData[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ScratchTicketData | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [activeTab, setActiveTab] = useState<'designs' | 'mytickets'>('designs');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isAuthenticated) {
      fetchDesigns();
      fetchMyTickets();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchDesigns = async () => {
    try {
      setIsLoadingDesigns(true);
      const response = await apiCall<{ success: boolean; data?: any[] }>('/scratch-tickets/designs');
      if (response.success) {
        setDesigns(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch designs:', error);
      toast.error('Failed to load ticket designs');
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const response = await apiCall<{ success: boolean; data?: any[] }>('/scratch-tickets');
      if (response.success) {
        setMyTickets(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load your tickets');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handlePurchaseTicket = async (designId: number) => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    const design = designs.find(d => d.id === designId);
    if (!design) return;

    if (Number(user.sc_balance || 0) < design.cost_sc) {
      toast.error('Insufficient Sweeps Coins');
      return;
    }

    try {
      setIsCreatingTicket(true);
      const response = await apiCall<{ success: boolean; data?: any; error?: string }>('/scratch-tickets/purchase', {
        method: 'POST',
        body: JSON.stringify({ designId }),
      });

      if (response.success && response.data) {
        toast.success('🎉 Ticket purchased! Start scratching!');
        setSelectedTicket(response.data);
        setActiveTab('mytickets');
        await fetchMyTickets();
      } else {
        toast.error(response.error || 'Failed to purchase ticket');
      }
    } catch (error: any) {
      console.error('Failed to purchase ticket:', error);
      toast.error(error.message || 'Failed to purchase ticket');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleRefreshTickets = async () => {
    await fetchMyTickets();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/10 to-blue-900/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Ticket className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                CoinKrazy Scratch Tickets
              </h1>
            </div>
            {user && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg px-4 py-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-lg">{Number(user.sc_balance || 0).toFixed(2)}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">SC</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Purchase scratch tickets for your chance to win instant Sweeps Coins!
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('designs')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'designs'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Available Tickets
          </button>
          <button
            onClick={() => setActiveTab('mytickets')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'mytickets'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            My Tickets ({myTickets.length})
          </button>
        </div>

        {/* Available Designs */}
        {activeTab === 'designs' && (
          <div>
            {isLoadingDesigns ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : designs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No ticket designs available yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {designs.map(design => (
                  <TicketDesignCard
                    key={design.id}
                    design={design}
                    onPurchase={handlePurchaseTicket}
                    isLoading={isCreatingTicket}
                    balance={user?.sc_balance || 0}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Tickets */}
        {activeTab === 'mytickets' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Tickets</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshTickets}
                disabled={isLoadingTickets}
              >
                Refresh
              </Button>
            </div>

            {isLoadingTickets ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : myTickets.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>You haven't purchased any tickets yet</p>
                  <Button
                    className="mt-4"
                    onClick={() => setActiveTab('designs')}
                  >
                    Purchase a Ticket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {myTickets.map(ticket => (
                  <ScratchTicket
                    key={ticket.id}
                    ticket={ticket}
                    onRefresh={handleRefreshTickets}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScratchTickets;
