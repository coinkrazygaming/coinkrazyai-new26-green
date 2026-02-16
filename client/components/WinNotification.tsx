import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

interface WinNotificationProps {
  amount: number;
  gameTitle?: string;
  onClose?: () => void;
  autoDismissMs?: number;
}

export function WinNotification({
  amount,
  gameTitle = 'Game',
  onClose,
  autoDismissMs = 15000,
}: WinNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { refreshProfile } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs]);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      // Balance already added by server, just refresh profile
      await refreshProfile();
      handleClose();
    } catch (error) {
      console.error('Error claiming winnings:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  // Determine notification style based on amount
  const numAmount = Number(amount || 0);
  const isJackpot = numAmount >= 10;
  const isBigWin = numAmount >= 5;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
      <div
        className={`rounded-lg overflow-hidden shadow-2xl border-2 ${
          isJackpot
            ? 'bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 border-yellow-300'
            : isBigWin
              ? 'bg-gradient-to-br from-green-600 to-emerald-600 border-green-400'
              : 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400'
        } max-w-md`}
      >
        {/* Top Bar - Celebratory */}
        <div className={`px-4 py-2 ${isJackpot ? 'bg-yellow-600/40' : 'bg-white/10'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-2xl ${isJackpot ? 'animate-bounce' : ''}`}>
                {isJackpot ? '🎉' : isBigWin ? '🎊' : '💰'}
              </span>
              <span className="font-bold text-white text-sm uppercase tracking-wider">
                {isJackpot ? 'JACKPOT WIN!' : isBigWin ? 'BIG WIN!' : 'YOU WON!'}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-yellow-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-900/95 px-6 py-6 space-y-4">
          {/* Amount */}
          <div className="text-center space-y-1">
            <p className="text-gray-300 text-sm">You won from {gameTitle}</p>
            <div className={`text-5xl font-black ${
              isJackpot ? 'text-yellow-300' : isBigWin ? 'text-green-300' : 'text-blue-300'
            }`}>
              {Number(amount || 0).toFixed(2)}
            </div>
            <p className="text-gray-400 text-lg font-semibold">SWEEPS COINS</p>
          </div>

          {/* Celebration Message */}
          <div className={`text-center text-sm font-semibold ${
            isJackpot ? 'text-yellow-200' : isBigWin ? 'text-green-200' : 'text-blue-200'
          }`}>
            {isJackpot ? '🎯 INCREDIBLE! This is a JACKPOT WIN!' : isBigWin ? '⚡ Fantastic Win!' : '✨ Nice win!'}
          </div>

          {/* Info Box */}
          <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-gray-300 text-center">
            Your winnings are being added to your balance...
          </div>

          {/* Action Button */}
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className={`w-full font-bold py-2 h-auto ${
              isJackpot
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black'
                : isBigWin
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
            } transition-all disabled:opacity-50`}
          >
            {isClaiming ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Claiming...
              </span>
            ) : (
              'CLAIM NOW'
            )}
          </Button>

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center">
            This popup closes in {(autoDismissMs / 1000).toFixed(0)}s
          </p>
        </div>
      </div>
    </div>
  );
}
