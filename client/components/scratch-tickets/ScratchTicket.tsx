import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { WinningPopup } from './WinningPopup';

interface ScratchSlot {
  index: number;
  value: 'LOSS' | number;
  revealed: boolean;
}

interface ScratchTicketData {
  id: number;
  ticket_number: string;
  design_id: number;
  slots: ScratchSlot[];
  status: 'active' | 'expired' | 'claimed';
  claim_status: 'unclaimed' | 'claimed';
  created_at: string;
}

interface ScratchTicketProps {
  ticket: ScratchTicketData;
  onRefresh: () => Promise<void>;
  gameName?: string;
  gameId?: number;
}

const SCRATCH_BRUSH_SIZE = 40;
const SCRATCH_SENSITIVITY = 0.4;

export const ScratchTicket: React.FC<ScratchTicketProps> = ({ ticket, onRefresh, gameName = 'Scratch Tickets', gameId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<ScratchSlot[]>(ticket.slots);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratchedSlots, setScratchedSlots] = useState<Set<number>>(
    new Set(ticket.slots.filter(s => s.revealed).map(s => s.index))
  );
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(ticket.status);
  const [claimStatus, setClaimStatus] = useState(ticket.claim_status);

  // Initialize canvas on mount
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        drawScratchLayer(canvas);
      }
    }
  }, []);

  const drawScratchLayer = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw gray scratch-off layer
    ctx.fillStyle = '#d3d3d3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add texture
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    for (let i = 0; i < 100; i++) {
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 20,
        Math.random() * 20
      );
    }
  };

  const getSlotColor = (value: 'LOSS' | number): string => {
    if (value === 'LOSS') return '#ef4444'; // red
    if (typeof value === 'number') return '#10b981'; // green
    return '#6b7280'; // gray
  };

  const revealSlot = async (slotIndex: number) => {
    if (scratchedSlots.has(slotIndex) || claimStatus === 'claimed') return;

    try {
      const response = await apiCall<{ success: boolean; data?: { prize: number }; error?: string }>('/scratch-tickets/reveal', {
        method: 'POST',
        body: JSON.stringify({
          ticketId: ticket.id,
          slotIndex,
        }),
      });

      if (response.success && response.data) {
        setScratchedSlots(prev => new Set([...prev, slotIndex]));

        // Update slots
        const updatedSlots = slots.map(s =>
          s.index === slotIndex ? { ...s, revealed: true } : s
        );
        setSlots(updatedSlots);

        // Check if this is a winning slot
        if (response.data.prize && response.data.prize > 0) {
          setWinAmount(response.data.prize);
          setShowWinPopup(true);
        }
      } else {
        toast.error(response.error || 'Failed to reveal slot');
      }
    } catch (error: any) {
      console.error('Failed to reveal slot:', error);
      toast.error(error.message || 'Failed to reveal slot');
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Determine which slot was clicked
    const slotIndex = getSlotAtPosition(x, y, canvas.width, canvas.height);
    if (slotIndex !== -1) {
      revealSlot(slotIndex);
      scratchCanvas(canvas, x, y);
    }

    setIsDrawing(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    scratchCanvas(canvas, x, y);

    // Check if we're over a slot
    const slotIndex = getSlotAtPosition(x, y, canvas.width, canvas.height);
    if (slotIndex !== -1 && !scratchedSlots.has(slotIndex)) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'grab';
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const scratchCanvas = (canvas: HTMLCanvasElement, x: number, y: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear circular area
    ctx.clearRect(x - SCRATCH_BRUSH_SIZE / 2, y - SCRATCH_BRUSH_SIZE / 2, SCRATCH_BRUSH_SIZE, SCRATCH_BRUSH_SIZE);
  };

  const getSlotAtPosition = (x: number, y: number, canvasWidth: number, canvasHeight: number): number => {
    // Grid layout: calculate which slot based on position
    const cols = 3;
    const rows = Math.ceil(slots.length / cols);
    const slotWidth = canvasWidth / cols;
    const slotHeight = canvasHeight / rows;

    const col = Math.floor(x / slotWidth);
    const row = Math.floor(y / slotHeight);
    const slotIndex = row * cols + col;

    if (slotIndex >= 0 && slotIndex < slots.length) {
      return slotIndex;
    }
    return -1;
  };

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      const response = await apiCall<{ success: boolean; data?: { prizeAmount: number }; error?: string }>('/scratch-tickets/claim', {
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
    setScratchedSlots(new Set());
    setSlots(ticket.slots.map(s => ({ ...s, revealed: false })));
    if (canvasRef.current) {
      drawScratchLayer(canvasRef.current);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Scratch Ticket #{ticket.ticket_number}</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Created: {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {claimStatus === 'claimed' ? (
                <Badge className="bg-green-600">Claimed</Badge>
              ) : scratchedSlots.size === 0 ? (
                <Badge variant="secondary">Ready to Scratch</Badge>
              ) : (
                <Badge variant="outline">Scratching...</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Scratch Canvas Container */}
          <div
            ref={containerRef}
            className="relative bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg overflow-hidden border-2 border-dashed border-purple-300 dark:border-purple-700"
            style={{ minHeight: '300px' }}
          >
            {/* Slots Display (underneath) */}
            <div className="absolute inset-0 grid grid-cols-3 gap-2 p-4 pointer-events-none">
              {slots.map((slot, idx) => (
                <div
                  key={idx}
                  className="rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-lg"
                  style={{ backgroundColor: getSlotColor(slot.value) }}
                >
                  {slot.value === 'LOSS' ? '❌' : `${slot.value} SC`}
                </div>
              ))}
            </div>

            {/* Scratch Canvas (on top) */}
            {claimStatus !== 'claimed' && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                style={{ touchAction: 'none' }}
              />
            )}

            {/* Claimed Message */}
            {claimStatus === 'claimed' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-center text-white">
                  <Sparkles className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-lg font-bold">Prize Claimed!</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Slots</div>
              <div className="text-lg font-bold">{slots.length}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Scratched</div>
              <div className="text-lg font-bold">{scratchedSlots.size}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
              <div className="text-lg font-bold">{slots.length - scratchedSlots.size}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Status</div>
              <div className="text-lg font-bold capitalize">{claimStatus}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {claimStatus !== 'claimed' && (
              <Button variant="outline" onClick={reset} disabled={scratchedSlots.size === 0}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
            <div className="flex-1"></div>
            {claimStatus === 'claimed' && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg px-4 py-2">
                <Sparkles className="w-4 h-4" />
                Prize has been credited to your account
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Winning Popup */}
      <WinningPopup
        isOpen={showWinPopup}
        winAmount={winAmount}
        gameName={gameName}
        gameId={gameId}
        onClaim={handleClaim}
        onClose={() => setShowWinPopup(false)}
        isClaiming={isClaiming}
      />
    </>
  );
};
