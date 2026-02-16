import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Gift, Calendar, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

interface DailyBonusData {
  id: number;
  player_id: number;
  bonus_day: number;
  amount_sc: number;
  amount_gc: number;
  claimed_at: string | null;
  next_available_at: string;
  status: 'available' | 'claimed' | 'expired';
  canClaim: boolean;
}

interface DailyLoginBonusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onBonusClaimed?: () => void;
}

const DAILY_BONUS_SCHEDULE = [
  { day: 1, sc: 0.5, gc: 100, description: 'Day 1 Starter Bonus' },
  { day: 2, sc: 1, gc: 200, description: 'Day 2 Boost' },
  { day: 3, sc: 1.5, gc: 300, description: 'Day 3 Surge' },
  { day: 4, sc: 2, gc: 400, description: 'Day 4 Momentum' },
  { day: 5, sc: 2.5, gc: 500, description: 'Day 5 Peak' },
  { day: 6, sc: 3, gc: 750, description: 'Day 6 Premium' },
  { day: 7, sc: 5, gc: 1000, description: '🏆 Day 7 MEGA BONUS!' },
];

export const DailyLoginBonusPopup: React.FC<DailyLoginBonusPopupProps> = ({
  isOpen,
  onClose,
  onBonusClaimed,
}) => {
  const [bonus, setBonus] = useState<DailyBonusData | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchBonusData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!bonus || !bonus.next_available_at) return;

    const updateTimer = () => {
      const now = new Date();
      const next = new Date(bonus.next_available_at);
      const diff = next.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilNext('Available Now!');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeUntilNext(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [bonus]);

  const fetchBonusData = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall<DailyBonusData>('/daily-bonus');
      if (response) {
        setBonus(response);
      }
    } catch (error) {
      console.error('Failed to fetch daily bonus:', error);
      toast.error('Failed to load daily bonus');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimBonus = async () => {
    if (!bonus) return;

    try {
      setIsClaiming(true);
      const response = await apiCall<{ success: boolean; bonus: DailyBonusData }>(
        '/daily-bonus/claim',
        {
          method: 'POST',
        }
      );

      if (response.success) {
        setBonus(response.bonus);
        toast.success(`🎉 Claimed ${bonus.amount_sc} SC and ${bonus.amount_gc} GC!`);
        onBonusClaimed?.();
        
        // Show streak info
        setTimeout(() => {
          fetchBonusData();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Failed to claim bonus:', error);
      toast.error(error.message || 'Failed to claim bonus');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  const currentBonusInfo = bonus ? DAILY_BONUS_SCHEDULE[Math.min(bonus.bonus_day - 1, 6)] : null;
  const nextBonusInfo = bonus ? DAILY_BONUS_SCHEDULE[Math.min(bonus.bonus_day, 6)] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
              <Gift className="w-12 h-12 text-amber-600 animate-bounce" />
            </div>
          </div>

          <DialogTitle className="text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent uppercase">
            Daily Bonus!
          </DialogTitle>

          <DialogDescription className="text-lg font-bold text-slate-900 dark:text-white mt-2">
            Claim Your Day {bonus?.bonus_day || 1} Reward
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Bonus Display */}
            <div className="bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-lg p-6 text-center border-2 border-amber-300 dark:border-amber-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {currentBonusInfo?.description}
              </p>
              <div className="flex justify-center gap-6 mb-3">
                <div className="bg-white dark:bg-slate-800 rounded-lg px-6 py-3">
                  <p className="text-3xl font-bold text-orange-600">
                    {bonus?.amount_sc || 0}
                  </p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">SC</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg px-6 py-3">
                  <p className="text-3xl font-bold text-yellow-600">
                    {bonus?.amount_gc || 0}
                  </p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">GC</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Day {bonus?.bonus_day || 1} of 7 • Unlock higher rewards each day!
              </p>
            </div>

            {/* Bonus Progress Bar */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Bonus Streak Progress
              </p>
              <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      i < (bonus?.bonus_day || 0)
                        ? 'bg-amber-600 shadow-md shadow-amber-400/50'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                {bonus?.bonus_day || 0} / 7 Days
              </p>
            </div>

            {/* Next Bonus Preview */}
            {nextBonusInfo && bonus?.bonus_day! < 7 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Next Bonus
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 mb-2">
                  {nextBonusInfo.description}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Available in: {timeUntilNext}
                </p>
              </div>
            )}

            {/* Status Messages */}
            {bonus?.status === 'claimed' && !bonus.canClaim && (
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 border border-amber-300 dark:border-amber-700 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  Come back in {timeUntilNext} to claim your next bonus!
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isClaiming}
                className="flex-1"
              >
                Later
              </Button>
              <Button
                onClick={handleClaimBonus}
                disabled={isClaiming || !bonus?.canClaim}
                className="flex-1 h-12 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : bonus?.canClaim ? (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Claim Reward!
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Come Back Later
                  </>
                )}
              </Button>
            </div>

            {/* Fun Footer */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Keep your streak alive! 🔥 One bonus per 24 hours.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
