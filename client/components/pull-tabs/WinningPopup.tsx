import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Gift, Sparkles } from 'lucide-react';

interface WinningPopupProps {
  isOpen: boolean;
  winAmount: number;
  onClaim: () => Promise<void>;
  onClose: () => void;
  isClaiming: boolean;
}

export const WinningPopup: React.FC<WinningPopupProps> = ({
  isOpen,
  winAmount,
  onClaim,
  onClose,
  isClaiming,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-orange-400">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-orange-300 rounded-full animate-pulse opacity-30" />
              <div className="absolute inset-2 bg-orange-200 rounded-full animate-pulse opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-orange-500 animate-bounce" />
              </div>
            </div>
          </div>

          <DialogTitle className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent uppercase tracking-tighter">
            CoinKrazy WIN!
          </DialogTitle>

          <DialogDescription className="text-lg font-bold text-slate-900 dark:text-white mt-2">
            YOU WON {winAmount} SC!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prize Amount Display */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-8 text-center border-2 border-orange-200 dark:border-orange-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Prize Amount</p>
            <p className="text-5xl font-bold text-orange-600 mb-2">{winAmount}</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Sweeps Coins (SC)
            </p>
          </div>

          {/* Celebration Message */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your prize has been calculated and is ready to claim!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Click the button below to add this amount to your wallet.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isClaiming}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              onClick={onClaim}
              disabled={isClaiming}
              className="flex-1 h-14 text-lg font-black bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-red-500/20"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  CLAIM IT NOW!
                </>
              )}
            </Button>
          </div>

          {/* Celebration Animation Text */}
          <div className="text-center text-2xl">
            🎊 🎈 🎁 🎉 🏆
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
