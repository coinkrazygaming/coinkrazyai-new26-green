import { useState, useMemo, useEffect } from 'react';
import { GameCard } from '@/components/casino/GameCard';
import { GamePopup } from '@/components/casino/GamePopup';
import { useAuth } from '@/lib/auth-context';
import { useGames } from '@/lib/hooks';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Casino() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const { data: allGamesData = [], isLoading: gamesLoading } = useGames();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Transform API games to casino format
  const allGames = useMemo(() => {
    return (allGamesData || []).map(g => ({
      id: g.id,
      name: g.title,
      provider: g.provider,
      thumbnail: g.image,
      costPerPlay: 0.01,
      type: 'slots' as const,
      gameUrl: g.game_url || undefined,
    }));
  }, [allGamesData]);

  // Separate by provider
  const groupedGames = useMemo(() => {
    const groups: Record<string, any[]> = {};

    allGames.forEach(game => {
      if (!groups[game.provider]) {
        groups[game.provider] = [];
      }
      groups[game.provider].push(game);
    });

    // Sort providers: Featured first, then alphabetically
    const featured = ['Pragmatic Play', 'ELK Studios', 'Red Tiger Gaming', 'Hacksaw Gaming'];
    const sortedProviders = [
      ...featured.filter(p => groups[p]),
      ...Object.keys(groups).filter(p => !featured.includes(p)).sort(),
    ];

    return sortedProviders.map(provider => ({
      provider,
      games: groups[provider],
    }));
  }, [allGames]);

  if (authLoading || gamesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Casino Games</h1>
        <p className="text-gray-400">Play with Sweeps Coins (SC) for a chance to win • Bet from 0.01 SC to 5.00 SC</p>
      </div>

      {/* Games by Provider */}
      {groupedGames.map(({ provider, games }) => (
        <div key={provider} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">{provider}</h2>
              <p className="text-sm text-gray-400">{games.length} games available</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPlay={(gameId) => setSelectedGame(gameId)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Game Popup */}
      {selectedGame && (() => {
        const game = allGames.find(g => g.id === selectedGame);
        return game ? (
          <GamePopup
            game={game}
            onClose={() => setSelectedGame(null)}
          />
        ) : null;
      })()}
    </div>
  );
}
