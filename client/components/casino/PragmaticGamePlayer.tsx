import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Loader } from 'lucide-react';

interface PragmaticGamePlayerProps {
  gameId: string;
  gameName: string;
  betAmount: number;
  onGameEnded?: (result: { winnings: number; newBalance: number }) => void;
}

export function PragmaticGamePlayer({
  gameId,
  gameName,
  betAmount,
  onGameEnded,
}: PragmaticGamePlayerProps) {
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<{
    status: 'loading' | 'running' | 'completed' | 'error';
    message?: string;
  }>({ status: 'loading' });

  useEffect(() => {
    if (!user || !iframeRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        console.warn('[Pragmatic] Message from untrusted origin:', event.origin);
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case 'GAME_LOADED':
          console.log('[Pragmatic] Game loaded');
          setIsLoading(false);
          setGameState({ status: 'running' });
          break;

        case 'GAME_STARTED':
          console.log('[Pragmatic] Game started with bet:', data.bet);
          setGameState({ status: 'running' });
          break;

        case 'SPIN_RESULT':
          console.log('[Pragmatic] Spin result:', data);
          // Handle spin result - deduct/add SC from wallet
          if (data.winnings > 0) {
            setGameState({
              status: 'completed',
              message: `Won ${data.winnings.toFixed(2)} SC!`,
            });
          } else {
            setGameState({
              status: 'completed',
              message: 'Better luck next time!',
            });
          }
          
          if (onGameEnded) {
            onGameEnded({
              winnings: data.winnings,
              newBalance: Number(user.sc_balance || 0) + data.winnings - betAmount,
            });
          }
          break;

        case 'GAME_ERROR':
          console.error('[Pragmatic] Game error:', data.message);
          setGameState({
            status: 'error',
            message: data.message || 'An error occurred',
          });
          break;

        case 'REQUEST_BALANCE':
          // Send current SC balance to iframe
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: 'BALANCE_UPDATE',
              data: {
                balance: Number(user.sc_balance || 0),
                currency: 'SC',
              },
            },
            window.location.origin
          );
          break;

        default:
          console.log('[Pragmatic] Unknown message type:', type);
      }
    };

    window.addEventListener('message', handleMessage);

    // Send initial game setup to iframe
    const setupMessage = {
      type: 'GAME_SETUP',
      data: {
        gameId,
        gameName,
        betAmount,
        playerBalance: Number(user.sc_balance || 0),
        currency: 'SC',
        playerId: user.id,
      },
    };

    // Send after a small delay to ensure iframe is ready
    const timer = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        setupMessage,
        window.location.origin
      );
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
    };
  }, [user, gameId, gameName, betAmount, onGameEnded]);

  const iframeSrc = `/pragmatic-games/${gameId}`;

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center space-y-4">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500"></div>
            </div>
            <p className="text-gray-300">Loading Pragmatic game...</p>
          </div>
        </div>
      )}

      {gameState.status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center space-y-4">
            <p className="text-red-400 font-semibold">Game Error</p>
            <p className="text-gray-300 text-sm">{gameState.message}</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title={gameName}
        className="w-full h-full border-0"
        allow="payment"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
    </div>
  );
}
