import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useGames } from '@/lib/hooks';
import { GameCard } from '@/components/casino/GameCard';
import { GamePopup } from '@/components/casino/GamePopup';
import { Button } from '@/components/ui/button';
import { Search, Filter, Loader2 } from 'lucide-react';

export default function Slots() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { data: allGames = [], isLoading: gamesLoading } = useGames();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Get all providers for filter
  const providers = useMemo(() => {
    if (!allGames || allGames.length === 0) return [];
    return [...new Set(allGames.map(g => g.provider || '').filter(Boolean))].sort();
  }, [allGames]);

  // Filter games based on search and provider
  const filteredGames = useMemo(() => {
    if (!allGames) return [];
    return allGames.filter(game => {
      const title = game.title || '';
      const provider = game.provider || '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvider = !filterProvider || provider === filterProvider;
      return matchesSearch && matchesProvider;
    });
  }, [allGames, searchTerm, filterProvider]);

  // Group games by provider
  const gamesByProvider = useMemo(() => {
    if (!filteredGames || filteredGames.length === 0) return [];
    const groups: Record<string, any[]> = {};
    filteredGames.forEach(game => {
      const provider = game.provider || 'Unknown';
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(game);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredGames]);

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
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Slot Games</h1>
          <p className="text-gray-400">
            Play our collection of {allGames.length} premium slot games with Sweeps Coins (SC)
          </p>
        </div>

        {/* Wallet Display */}
        <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Your Sweeps Coins Balance</p>
              <p className="text-3xl font-bold text-amber-400">
                {Number(user.sc_balance || 0).toFixed(2)} SC
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search games or providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-5 w-5 text-gray-500" />
          <Button
            variant={!filterProvider ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterProvider(null)}
            className={!filterProvider ? 'bg-primary' : ''}
          >
            All Providers
          </Button>
          {providers.map(provider => (
            <Button
              key={provider}
              variant={filterProvider === provider ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterProvider(filterProvider === provider ? null : provider)}
              className={filterProvider === provider ? 'bg-primary' : ''}
            >
              {provider}
            </Button>
          ))}

          <div className="ml-auto">
            <Button
              variant={showUpcoming ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowUpcoming(!showUpcoming)}
              className={showUpcoming ? 'bg-primary' : ''}
            >
              {showUpcoming ? 'All Games' : 'Show Upcoming'}
            </Button>
          </div>
        </div>
      </div>

      {/* Games Display */}
      {gamesByProvider.length > 0 ? (
        <div className="space-y-8">
          {gamesByProvider.map(([provider, games]) => (
            <div key={provider} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{provider}</h2>
                  <p className="text-sm text-gray-400">{games.length} games</p>
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
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No games found matching your criteria</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setFilterProvider(null);
              setShowUpcoming(false);
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Game Popup */}
      {selectedGame && (() => {
        const game = allGames.find(g => String(g.id) === selectedGame);
        if (!game) return null;

        const casinoGame = {
          id: game.id,
          name: game.title,
          provider: game.provider,
          thumbnail: game.image,
          costPerPlay: 0.01,
          type: 'slots' as const,
          gameUrl: game.game_url || undefined,
        };

        return (
          <GamePopup
            game={casinoGame as any}
            onClose={() => setSelectedGame(null)}
          />
        );
      })()}
    </div>
  );
}
