import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gift, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyBonus {
  day: number;
  sc: number;
  gc: number;
}

interface DailyLoginBonusPopupProps {
  currentDay: number;
  currentBonus: DailyBonus;
  nextBonus: DailyBonus;
  nextAvailableAt?: Date;
  onClaim: () => Promise<void>;
  onSkip: () => void;
}

const BONUS_SEQUENCE: DailyBonus[] = [
  { day: 1, sc: 0.5, gc: 100 },
  { day: 2, sc: 1, gc: 200 },
  { day: 3, sc: 1.5, gc: 300 },
  { day: 4, sc: 2, gc: 400 },
  { day: 5, sc: 2.5, gc: 500 },
  { day: 6, sc: 3, gc: 750 },
  { day: 7, sc: 5, gc: 1000 },
];

export const DailyLoginBonusPopup: React.FC<DailyLoginBonusPopupProps> = ({
  currentDay,
  currentBonus,
  nextBonus,
  nextAvailableAt,
  onClaim,
  onSkip,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!nextAvailableAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = new Date(nextAvailableAt).getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Ready to claim!');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextAvailableAt]);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await onClaim();
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl backdrop-blur-sm">
        {/* Close Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Gift className="w-16 h-16 text-primary animate-bounce" />
              <Zap className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-primary mb-2">Daily Login Bonus!</h2>
          <p className="text-muted-foreground">Day {currentDay} of 7</p>
        </div>

        {/* Streak Progress */}
        <div className="mb-6">
          <div className="flex gap-1 mb-3">
            {BONUS_SEQUENCE.map((bonus) => (
              <div
                key={bonus.day}
                className={cn(
                  'flex-1 h-2 rounded-full transition-all',
                  bonus.day <= currentDay ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Come back day 7 for our biggest reward!
          </p>
        </div>

        {/* Bonus Display */}
        <div className="bg-background/80 rounded-lg p-6 mb-6 border border-primary/30">
          <p className="text-sm font-semibold text-muted-foreground mb-3 text-center">
            You're claiming:
          </p>
          <div className="flex justify-around items-center">
            <div className="text-center">
              <p className="text-3xl font-black text-primary">{currentBonus.sc}</p>
              <p className="text-xs font-semibold text-muted-foreground">Sweep Coins</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-black text-yellow-500">{currentBonus.gc}</p>
              <p className="text-xs font-semibold text-muted-foreground">Gold Coins</p>
            </div>
          </div>
        </div>

        {/* Next Bonus Preview */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Tomorrow's Bonus (Day {nextBonus.day}):
          </p>
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <div>
                <p className="text-lg font-bold text-primary">{nextBonus.sc} SC</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-500">{nextBonus.gc} GC</p>
              </div>
            </div>
            {currentDay === 7 && (
              <div className="bg-primary/20 px-2 py-1 rounded text-xs font-bold text-primary">
                BONUS RESET
              </div>
            )}
          </div>
        </div>

        {/* Time Remaining */}
        {timeLeft && timeLeft !== 'Ready to claim!' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6 text-center">
            <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
              Next bonus in: {timeLeft}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSkip}
          >
            Maybe Later
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 font-bold"
            onClick={handleClaim}
            disabled={isClaiming}
          >
            {isClaiming ? 'Claiming...' : 'Claim Bonus'}
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Log in daily to increase your rewards! Come back tomorrow for more.
        </p>
      </div>
    </div>
  );
};
