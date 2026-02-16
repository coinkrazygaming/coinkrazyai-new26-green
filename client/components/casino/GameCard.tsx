import { CasinoGame, CASINO_MIN_BET, CASINO_MAX_BET } from '@/data/casinoGames';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface GameCardProps {
  game: CasinoGame;
  onPlay: (gameId: string) => void;
}

export function GameCard({ game, onPlay }: GameCardProps) {
  const handlePlayClick = () => {
    console.log('[GameCard] Play Button Clicked:', {
      gameId: game.id,
      gameName: game.name,
      provider: game.provider,
      gameType: game.type,
      timestamp: new Date().toISOString(),
    });
    onPlay(game.id);
  };

  return (
    <div className="group relative bg-gray-900 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border border-gray-800">
      {/* Game Thumbnail */}
      <div className="relative w-full aspect-square overflow-hidden bg-gray-800">
        <img
          src={game.thumbnail}
          alt={game.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23374151" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239CA3AF"%3EGame Image%3C/text%3E%3C/svg%3E';
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button
          onClick={handlePlayClick}
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-full"
        >
          <Play className="mr-2 h-5 w-5" fill="currentColor" />
          PLAY
        </Button>
      </div>

      {/* Game Info */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-bold text-white truncate" title={game.name}>
          {game.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="truncate">{game.provider}</span>
          <span className="ml-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded font-semibold">
            From {CASINO_MIN_BET.toFixed(2)} SC
          </span>
        </div>
      </div>
    </div>
  );
}
