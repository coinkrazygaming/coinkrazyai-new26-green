import { useState } from 'react';
import { casinoGames, CASINO_MIN_BET, CASINO_MAX_BET } from '@/data/casinoGames';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, Loader } from 'lucide-react';
import { casino } from '@/lib/api';
import { PragmaticGamePlayer } from './PragmaticGamePlayer';

interface GamePlayerModalProps {
  gameId: string;
  onClose: () => void;
  provider?: string;
}

export function GamePlayerModal({ gameId, onClose, provider }: GamePlayerModalProps) {
  const game = casinoGames.find((g) => g.id === gameId);
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [betAmount, setBetAmount] = useState(CASINO_MIN_BET);
  const [transactionStatus, setTransactionStatus] = useState<'pending' | 'success' | 'failed' | null>(null);

  if (!game || !user) return null;

  const currentScBalance = Number(user.sc_balance ?? 0);
  const hasEnoughBalance = currentScBalance >= betAmount;
  const isPragmatic = provider === 'Pragmatic' || game.provider === 'Pragmatic';

  const handlePragmaticGameEnded = async (result: { winnings: number; newBalance: number }) => {
    console.log('[Pragmatic] Game ended with result:', result);
    // Refresh profile to get updated balance
    try {
      await refreshProfile();
    } catch (err) {
      console.error('[Pragmatic] Failed to refresh profile:', err);
    }
  };

  const handlePlayGame = async () => {
    if (!hasEnoughBalance) {
      setError(`Insufficient SC balance. You need ${betAmount.toFixed(2)} SC to play.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setTransactionStatus('pending');

    // Start game immediately
    setHasStarted(true);

    // Process transaction in background (non-blocking)
    casino.playGame(game.id, betAmount)
      .then((response) => {
        console.log('[Casino] Game transaction successful:', response);
        setTransactionStatus('success');
      })
      .catch((err: any) => {
        console.error('[Casino] Game transaction failed:', err);
        setTransactionStatus('failed');
        const errorMsg = err?.message || 'Failed to process transaction';
        console.warn('[Casino] Transaction error:', errorMsg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">{game.name}</h2>
            <p className="text-sm text-gray-400">{game.provider}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {!hasStarted ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 min-h-[400px]">
              {/* Game Preview */}
              <div className="w-full max-w-md">
                <img
                  src={game.thumbnail}
                  alt={game.name}
                  className="w-full rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Game Info */}
              <div className="space-y-4 w-full max-w-md">
                {/* Bet Amount Selector */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Bet Amount</p>
                    <p className="text-2xl font-bold text-amber-400">{betAmount.toFixed(2)} SC</p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min={CASINO_MIN_BET}
                      max={CASINO_MAX_BET}
                      step={0.01}
                      value={betAmount}
                      onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{CASINO_MIN_BET.toFixed(2)} SC</span>
                      <span>{CASINO_MAX_BET.toFixed(2)} SC</span>
                    </div>
                  </div>

                  {/* Quick Bet Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setBetAmount(0.01)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold text-gray-300 transition-colors"
                    >
                      0.01
                    </button>
                    <button
                      onClick={() => setBetAmount(0.50)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold text-gray-300 transition-colors"
                    >
                      0.50
                    </button>
                    <button
                      onClick={() => setBetAmount(2.50)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold text-gray-300 transition-colors"
                    >
                      2.50
                    </button>
                    <button
                      onClick={() => setBetAmount(5.00)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold text-gray-300 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-400">Your balance</p>
                  <p className="text-2xl font-bold text-white">{currentScBalance.toFixed(2)} SC</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Info Message */}
                {!hasEnoughBalance && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <p className="text-sm text-blue-400">
                      You need {(betAmount - currentScBalance).toFixed(2)} more SC to play with this bet.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 w-full max-w-md">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePlayGame}
                  disabled={!hasEnoughBalance || isLoading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Starting...' : `Play Now (${betAmount.toFixed(2)} SC)`}
                </Button>
              </div>
            </div>
          ) : isPragmatic ? (
            /* Pragmatic Game Iframe */
            <div className="w-full h-full min-h-[600px] bg-black">
              <PragmaticGamePlayer
                gameId={gameId}
                gameName={game.name}
                betAmount={betAmount}
                onGameEnded={handlePragmaticGameEnded}
              />
            </div>
          ) : (
            /* Generic Game Placeholder */
            <div className="w-full h-full min-h-[600px] bg-black flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500"></div>
                </div>
                <p className="text-gray-400">Loading game...</p>
                <p className="text-sm text-gray-500">
                  Bet: {betAmount.toFixed(2)} SC
                </p>
                {transactionStatus === 'pending' && (
                  <p className="text-xs text-amber-400">Processing wallet transaction...</p>
                )}
                {transactionStatus === 'success' && (
                  <p className="text-xs text-green-400">Wallet transaction confirmed</p>
                )}
                {transactionStatus === 'failed' && (
                  <p className="text-xs text-red-400">
                    Note: Wallet transaction failed, but game is running
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
