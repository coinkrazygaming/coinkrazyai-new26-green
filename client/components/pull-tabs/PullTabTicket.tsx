import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { WinningPopup } from './WinningPopup';

interface PullTab {
  index: number;
  value: 'LOSS' | number;
  revealed: boolean;
}

interface PullTabTicketData {
  id: number;
  ticket_number: string;
  design_id: number;
  tabs: PullTab[];
  status: 'active' | 'expired' | 'claimed';
  claim_status: 'unclaimed' | 'claimed';
  winning_tab_index: number | null;
  created_at: string;
}

interface PullTabTicketProps {
  ticket: PullTabTicketData;
  designName?: string;
  designBackgroundColor?: string;
  onRefresh: () => Promise<void>;
}

export const PullTabTicket: React.FC<PullTabTicketProps> = ({
  ticket,
  designName = 'CoinKrazy Pull Tab',
  designBackgroundColor = '#FF6B35',
  onRefresh,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tabs, setTabs] = useState<PullTab[]>(ticket.tabs);
  const [revealedTabs, setRevealedTabs] = useState<Set<number>>(
    new Set(ticket.tabs.filter(t => t.revealed).map(t => t.index))
  );
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(ticket.status);
  const [claimStatus, setClaimStatus] = useState(ticket.claim_status);
  const [revealing, setRevealing] = useState<number | null>(null);

  const getTabColor = (value: 'LOSS' | number): string => {
    if (value === 'LOSS') return '#ef4444'; // red
    if (typeof value === 'number') return '#10b981'; // green
    return '#6b7280'; // gray
  };

  const getTabIcon = (value: 'LOSS' | number): string => {
    if (value === 'LOSS') return '❌';
    if (typeof value === 'number') return '💰';
    return '?';
  };

  const revealTab = async (tabIndex: number) => {
    if (revealedTabs.has(tabIndex) || claimStatus === 'claimed') return;

    try {
      setRevealing(tabIndex);
      const response = await apiCall<{ success: boolean; data?: { prize: number }; error?: string }>('/pull-tabs/reveal', {
        method: 'POST',
        body: JSON.stringify({
          ticketId: ticket.id,
          tabIndex,
        }),
      });

      if (response.success && response.data) {
        setRevealedTabs(prev => new Set([...prev, tabIndex]));

        // Update tabs
        const updatedTabs = tabs.map(t =>
          t.index === tabIndex ? { ...t, revealed: true } : t
        );
        setTabs(updatedTabs);

        // Check if this is a winning tab
        if (response.data.prize && response.data.prize > 0) {
          setWinAmount(response.data.prize);
          setShowWinPopup(true);
          toast.success(`🎉 You revealed a winning tab!`);
        } else {
          toast.info('Tab revealed');
        }
      } else {
        toast.error(response.error || 'Failed to reveal tab');
      }
    } catch (error: any) {
      console.error('Failed to reveal tab:', error);
      toast.error(error.message || 'Failed to reveal tab');
    } finally {
      setRevealing(null);
    }
  };

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      const response = await apiCall<{ success: boolean; data?: { prizeAmount: number }; error?: string }>('/pull-tabs/claim', {
        method: 'POST',
        body: JSON.stringify({ ticketId: ticket.id }),
      });

      if (response.success && response.data) {
        toast.success(`🎉 You won ${response.data.prizeAmount} SC!`);
        setClaimStatus('claimed');
        setTicketStatus('active');
        await onRefresh();
      } else {
        toast.error(response.error || 'Failed to claim prize');
      }
    } catch (error: any) {
      console.error('Failed to claim prize:', error);
      toast.error(error.message || 'Failed to claim prize');
    } finally {
      setIsClaiming(false);
      setShowWinPopup(false);
    }
  };

  const reset = () => {
    setRevealedTabs(new Set());
    setTabs(ticket.tabs.map(t => ({ ...t, revealed: false })));
  };

  return (
    <>
      <Card className="overflow-hidden border-2" style={{ borderColor: designBackgroundColor }}>
        <CardHeader style={{ backgroundColor: designBackgroundColor + '20' }}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">CoinKrazy Pull Tab</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ticket #{ticket.ticket_number} • {designName}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {claimStatus === 'claimed' ? (
                <Badge className="bg-green-600">Claimed</Badge>
              ) : revealedTabs.size === 0 ? (
                <Badge variant="secondary">Ready to Pull</Badge>
              ) : (
                <Badge variant="outline">Pulling...</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Pull Tabs Grid */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Pull the tabs to reveal your fortune!
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {tabs.map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => revealTab(idx)}
                  disabled={tab.revealed || claimStatus === 'claimed' || revealing !== null}
                  className={`relative h-24 rounded-lg font-bold text-white transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    tab.revealed
                      ? 'cursor-default opacity-75'
                      : 'cursor-pointer shadow-lg hover:shadow-xl'
                  } ${revealing === idx ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: tab.revealed ? getTabColor(tab.value) : designBackgroundColor,
                    border: `2px solid ${designBackgroundColor}`,
                  }}
                >
                  {tab.revealed ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-2xl mb-1">{getTabIcon(tab.value)}</span>
                      <span className="text-xs text-white font-bold">
                        {tab.value === 'LOSS' ? 'LOSS' : `${tab.value} SC`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-3xl">🎟️</span>
                      <span className="text-xs text-white font-bold mt-1">PULL</span>
                    </div>
                  )}

                  {/* Peel Effect - Top Right Corner */}
                  {!tab.revealed && (
                    <div
                      className="absolute top-0 right-0 w-6 h-6 opacity-70"
                      style={{
                        background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)`,
                      }}
                    />
                  )}

                  {/* Loading indicator */}
                  {revealing === idx && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Tabs</div>
              <div className="text-lg font-bold">{tabs.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Pulled</div>
              <div className="text-lg font-bold">{revealedTabs.size}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
              <div className="text-lg font-bold">{tabs.length - revealedTabs.size}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Status</div>
              <div className="text-lg font-bold capitalize">{claimStatus}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {claimStatus !== 'claimed' && revealedTabs.size > 0 && (
              <Button variant="outline" onClick={reset} disabled={revealing !== null}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
            <div className="flex-1"></div>
            {claimStatus === 'claimed' && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg px-4 py-2">
                <Sparkles className="w-4 h-4" />
                Prize claimed!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Winning Popup */}
      <WinningPopup
        isOpen={showWinPopup}
        winAmount={winAmount}
        onClaim={handleClaim}
        onClose={() => setShowWinPopup(false)}
        isClaiming={isClaiming}
      />
    </>
  );
};
