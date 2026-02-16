import { useState, useEffect } from 'react';
import { CasinoGame, CASINO_MIN_BET, CASINO_MAX_BET } from '@/data/casinoGames';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, Loader } from 'lucide-react';
import { casino } from '@/lib/api';
import { toast } from 'sonner';
import { WinNotification } from '@/components/WinNotification';

interface GamePopupProps {
  game: CasinoGame;
  onClose: () => void;
}

type PopupState = 'setup' | 'playing' | 'result' | 'outOfFunds';

export function GamePopup({ game, onClose }: GamePopupProps) {
  const { user, refreshProfile } = useAuth();
  const [popupState, setPopupState] = useState<PopupState>('setup');
  const [betAmount, setBetAmount] = useState(CASINO_MIN_BET);
  const [isProcessing, setIsProcessing] = useState(false);

  // Safely initialize balance
  const initialBalance = (() => {
    const scBalance = user?.sc_balance ?? 0;
    const numBalance = typeof scBalance === 'number' ? scBalance : Number(scBalance) || 0;
    return isNaN(numBalance) ? 0 : numBalance;
  })();

  const [currentBalance, setCurrentBalance] = useState(initialBalance);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [gameResult, setGameResult] = useState<{ winnings: number; isWin: boolean } | null>(null);
  const [showWinNotification, setShowWinNotification] = useState(false);

  // Construct Roxor Games URL dynamically
  const constructRoxorGamesUrl = (gameId: string, gameKey?: string): string => {
    const baseUrl = 'https://cdn.na.roxor.games/static-assets/platform-assets/gs-wrapper/2.180.344/index.html';
    // Use provided gameKey or fall back to default format
    const keyToUse = gameKey || `play-${gameId}`;

    const params = new URLSearchParams({
      country: 'CA',
      currency: 'CAD',
      gameKey: keyToUse,
      language: 'EN',
      playerGuestId: 'GUEST',
      playMode: 'GUEST',
      sessionToken: 'GUEST',
      website: 'pabal',
      homePos: 'left',
      hideP4RButton: 'true',
      environment: 'ontario',
      environmentType: 'live'
    });

    return `${baseUrl}?${params.toString()}`;
  };

  // Get game URL - only use explicit gameUrl, avoid fallbacks
  const getGameUrl = () => {
    if (game.gameUrl) {
      console.log('[GamePopup] Using explicit gameUrl:', {
        provider: game.provider,
        gameUrl: game.gameUrl,
      });
      return game.gameUrl;
    }

    // If no explicit gameUrl, log a warning
    console.warn('[GamePopup] Game does not have explicit gameUrl:', {
      provider: game.provider,
      gameId: game.id,
      gameName: game.name,
    });

    // Return null to indicate game cannot be played
    return null;
  };

  // Update balance when user changes
  useEffect(() => {
    if (user) {
      const scBalance = user.sc_balance ?? 0;
      const numBalance = typeof scBalance === 'number' ? scBalance : Number(scBalance) || 0;
      setCurrentBalance(isNaN(numBalance) ? 0 : numBalance);
    }
  }, [user]);

  if (!user) return null;

  const hasEnoughBalance = currentBalance >= betAmount;

  const handlePlayGame = async () => {
    if (!hasEnoughBalance) {
      toast.error(`Insufficient SC balance. You need ${betAmount.toFixed(2)} SC to play.`);
      return;
    }

    // Debug: Log game launch
    console.log('[GamePopup] Game Launch Event:', {
      gameId: game.id,
      gameName: game.name,
      gameProvider: game.provider,
      gameType: game.type,
      betAmount,
      timestamp: new Date().toISOString(),
      userBalance: currentBalance,
    });

    setIsProcessing(true);

    // Deduct bet from balance immediately
    const newBalance = currentBalance - betAmount;
    setCurrentBalance(newBalance);
    setPopupState('playing');

    console.log('[GamePopup] Transitioned to playing state - game iframe should now load');
    setIsProcessing(false);
  };

  const handleGameComplete = async (result: { winnings: number }) => {
    console.log('[GamePopup] Game Completed:', {
      gameId: game.id,
      provider: game.provider,
      betAmount,
      winnings: result.winnings,
      timestamp: new Date().toISOString(),
    });

    setIsProcessing(true);

    // Get the deducted balance that we set when starting
    const newBalance = currentBalance - betAmount;

    // Process transaction result in background
    try {
      const response = await casino.playGame(game.id, betAmount);
      const winnings = response.data?.winnings ?? 0;
      console.log('[GamePopup] Game transaction recorded on server:', {
        gameId: game.id,
        provider: game.provider,
        betAmount,
        serverWinnings: winnings,
        timestamp: new Date().toISOString(),
      });

      // Use server response for final balance
      const finalBalance = newBalance + winnings;
      setCurrentBalance(finalBalance);

      // Store result and transition to result screen
      const isWin = winnings && winnings > 0;
      setGameResult({
        winnings,
        isWin,
      });

      // Show result notification
      if (isWin) {
        setShowWinNotification(true);
        toast.success(`🎉 You won ${winnings.toFixed(2)} SC!`);
      } else {
        toast.info(`Better luck next time!`);
      }

      // Refresh user profile to sync with server
      await refreshProfile();

      // Transition to result screen
      setPopupState('result');
    } catch (err: any) {
      console.error('[GamePopup] Game transaction failed:', err);
      toast.error('Failed to process game transaction');
      setPopupState('setup');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    if (currentBalance < CASINO_MIN_BET) {
      setPopupState('outOfFunds');
    } else {
      setPopupState('setup');
    }
  };

  const handleNavigateToCoinStore = () => {
    onClose();
    // Navigate to coin store
    window.location.href = '/store';
  };

  if (popupState === 'setup') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl w-full max-w-2xl shadow-2xl border border-amber-500/30">
          {/* Coinkrazy Branded Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-white">🎰 COINKRAZY</div>
              <div className="text-sm text-amber-100">Premium Casino</div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-amber-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Game Info */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">{game.name}</h2>
              <p className="text-sm text-gray-400">{game.provider}</p>
            </div>

            {/* Game Preview */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <img
                src={game.thumbnail}
                alt={game.name}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3C/svg%3E';
                }}
              />
            </div>

            {/* Wallet Info */}
            <div className="bg-gray-800 rounded-lg p-4 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Your SC Balance</p>
                  <p className="text-3xl font-bold text-amber-400">{currentBalance.toFixed(2)} SC</p>
                </div>
                <div className="text-5xl">💰</div>
              </div>
            </div>

            {/* Bet Amount Selector */}
            <div className="bg-gray-800 rounded-lg p-4 space-y-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-300">Spin Amount</p>
                <p className="text-2xl font-bold text-amber-400">{betAmount.toFixed(2)} SC</p>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={CASINO_MIN_BET}
                  max={CASINO_MAX_BET}
                  step={0.01}
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  disabled={isProcessing}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{CASINO_MIN_BET.toFixed(2)} SC</span>
                  <span>{CASINO_MAX_BET.toFixed(2)} SC</span>
                </div>
              </div>

              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[0.01, 0.50, 2.50, 5.00].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={isProcessing}
                    className="px-2 py-2 bg-gray-700 hover:bg-amber-500 hover:text-white rounded font-semibold text-gray-300 transition-colors disabled:opacity-50"
                  >
                    {amount.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            {/* Balance Check Message */}
            {!hasEnoughBalance && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-semibold">Insufficient Balance</p>
                  <p className="text-sm text-red-300 mt-1">
                    You need {(betAmount - currentBalance).toFixed(2)} more SC to spin
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePlayGame}
                disabled={!hasEnoughBalance || isProcessing}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Spinning...' : `SPIN NOW (${betAmount.toFixed(2)} SC)`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (popupState === 'playing') {
    const gameUrl = getGameUrl();

    // If no valid game URL, show error and return to setup
    if (!gameUrl) {
      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl w-full max-w-md shadow-2xl border border-red-500/30">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="text-sm text-red-100">Game Unavailable</div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-red-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">{game.name}</h2>
                <p className="text-sm text-gray-400">This game is currently unavailable</p>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-300">
                  This game cannot be played right now. Please try another game.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setPopupState('setup');
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold"
                >
                  Back
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-0 md:p-4">
        <div className="bg-gray-900 w-full h-full md:rounded-xl max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-amber-500/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <span className="hidden sm:inline">🎰</span> COINKRAZY
              </div>
              <div className="h-6 w-px bg-amber-400/30 hidden sm:block"></div>
              <div className="text-amber-100 text-sm font-medium truncate max-w-[150px] md:max-w-none">
                Playing: {game.name}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full text-xs text-white border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                LIVE SESSION
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-amber-100 transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Game Area */}
          <div className="flex-1 bg-black relative">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
                <div className="text-center space-y-4">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent"></div>
                  </div>
                  <p className="text-gray-400 text-lg">Loading secure game session...</p>
                  <p className="text-amber-400 font-semibold text-xl">{game.name}</p>
                </div>
              </div>
            )}

            <iframe
              src={gameUrl}
              className="w-full h-full border-none"
              allow="autoplay; fullscreen; encrypted-media"
              onLoad={() => setIframeLoaded(true)}
              title={game.name}
            />
          </div>

          {/* Bottom Bar */}
          <div className="bg-gray-800/50 px-4 py-3 border-t border-gray-700 flex items-center justify-between text-[10px] md:text-xs text-gray-400 shrink-0">
            <div className="flex items-center gap-4">
              <span>Provider: {game.provider}</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Bet: {betAmount.toFixed(2)} SC</span>
              <span className="hidden sm:inline">Balance: {currentBalance.toFixed(2)} SC</span>
            </div>
            <Button
              onClick={() => handleGameComplete({ winnings: 0 })}
              size="sm"
              disabled={isProcessing}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Finish Game'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (popupState === 'result' && gameResult) {
    const resultIcon = gameResult.isWin ? '🎉' : '😅';
    const resultColor = gameResult.isWin ? 'from-green-600 to-green-500' : 'from-orange-600 to-orange-500';

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`bg-gradient-to-br ${resultColor} rounded-xl w-full max-w-md shadow-2xl overflow-hidden border-2 ${gameResult.isWin ? 'border-green-400' : 'border-orange-400'}`}>
          {/* Header */}
          <div className="px-6 py-4">
            <div className="text-6xl text-center mb-4">{resultIcon}</div>
            <h2 className="text-3xl font-bold text-white text-center">
              {gameResult.isWin ? 'YOU WIN!' : 'SPIN COMPLETE'}
            </h2>
          </div>

          {/* Content */}
          <div className="bg-gray-900/95 px-6 py-8 space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-gray-400 text-sm">You wagered</p>
              <p className="text-2xl font-bold text-amber-400">{betAmount.toFixed(2)} SC</p>
            </div>

            {gameResult.isWin && (
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-center space-y-1">
                <p className="text-gray-400 text-sm">You won</p>
                <p className="text-4xl font-bold text-green-400">{gameResult.winnings.toFixed(2)} SC</p>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-amber-400">{currentBalance.toFixed(2)} SC</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={handlePlayAgain}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold"
              >
                Play Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (popupState === 'outOfFunds') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl w-full max-w-md shadow-2xl border border-red-500/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 rounded-t-xl">
            <div className="text-2xl font-bold text-white">⚠️ Out of Funds</div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6 text-center">
            <div className="text-6xl">💸</div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Looks like you need to re-up!</h2>
              <p className="text-gray-400">
                Your SC balance is too low to continue playing. Visit our Coin Store to purchase more Sweeps Coins.
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-400 font-semibold text-lg">Current Balance: {currentBalance.toFixed(2)} SC</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleNavigateToCoinStore}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold"
              >
                Visit Coin Store
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Win notification overlay (displayed on top of all states)
  if (showWinNotification && gameResult && gameResult.isWin) {
    return (
      <WinNotification
        amount={gameResult.winnings}
        gameTitle={game.name}
        onClose={() => setShowWinNotification(false)}
        autoDismissMs={10000}
      />
    );
  }

  return null;
}
