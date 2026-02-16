import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Coins, TrendingUp, Users, Zap, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRAGMATIC_GAMES } from '@/data/pragmaticGames';
import { SlotGameCarousel } from '@/components/SlotGameCarousel';
import { NEW_SLOT_GAMES, UPCOMING_SLOT_GAMES } from '@/data/slotGames';
import { SlotGame } from '@shared/api';

const Index = () => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Featured games using actual Pragmatic Play games
  const featuredGameIds = [
    'big-bass-bonanza',
    'sweet-bonanza',
    'gates-of-olympus',
    'sugar-rush'
  ];

  const games = featuredGameIds
    .map((id) => PRAGMATIC_GAMES.find((g) => g.id === id))
    .filter(Boolean)
    .map((game) => ({
      ...game,
      icon: Gamepad2,
      players: Math.floor(Math.random() * 2000 + 500).toLocaleString(),
      badge: 'Premium',
      color: 'from-blue-600 to-blue-400',
      type: 'pragmatic' as const,
    }));

  // Debug: Log featured games data
  console.log('[Index] Featured Games Loaded:', {
    count: games.length,
    games: games.map((g) => ({
      id: g.id,
      name: g.name,
      provider: g.provider,
    })),
  });

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-muted p-8 md:p-12 border border-border">
        <div className="relative z-10 max-w-2xl space-y-6">
          <Badge variant="outline" className="text-primary border-primary/30 py-1 px-3">
            <Zap className="w-3 h-3 mr-1 fill-primary" />
            Social Casino Excellence
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
            WELCOME TO <br />
            <span className="text-primary">COINKRAZY AI2</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            The world's first AI-managed social casino. Play with Gold Coins or compete for Sweeps Coins in our 100% fair, AI-monitored games.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" asChild className="font-bold text-lg">
              <Link to="/slots">PLAY NOW</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-bold text-lg border-2">
              <Link to="/store">GET FREE SC</Link>
            </Button>
          </div>
        </div>

        {/* Background Decor */}
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
          <div className="w-full h-full bg-primary blur-[120px] rounded-full transform translate-x-1/2 -translate-y-1/2" />
        </div>
      </section>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Players', value: '4,521', icon: Users },
          { label: 'Jackpot Total', value: '52,140 SC', icon: Coins },
          { label: 'Games Live', value: '48', icon: Gamepad2 },
          { label: 'AI Status', value: 'Optimized', icon: Zap },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
            <div className="p-2 bg-muted rounded-lg">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Games Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">FEATURED GAMES</h2>
          <Button variant="link" className="text-primary" asChild>
            <Link to="/casino">View All Games</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(57,255,20,0.1)]">
              <CardHeader className="p-0">
                <div className="h-40 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400 transition-transform group-hover:scale-105 duration-500 overflow-hidden">
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%231e40af" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239CA3AF"%3EGame Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl font-bold line-clamp-1">{game.name}</CardTitle>
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-none text-xs">
                    {game.badge}
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground text-sm">
                  {game.provider}
                </CardDescription>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex justify-between items-center">
                <div className="flex items-center text-xs text-muted-foreground font-medium">
                  <Users className="w-3 h-3 mr-1" />
                  {game.players} online
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => {
                    console.log('[Index] Game Play Clicked:', {
                      gameId: game.id,
                      gameName: game.name,
                      provider: game.provider,
                      timestamp: new Date().toISOString(),
                    });
                    setSelectedGameId(game.id);
                  }}
                >
                  PLAY
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* New Games Carousel */}
      <section className="space-y-4">
        <SlotGameCarousel
          games={NEW_SLOT_GAMES.slice(0, 12)}
          title="NEW GAMES"
          onPlayClick={(game: SlotGame) => {
            console.log('[Index] Slot Game Play Clicked:', {
              gameId: game.id,
              title: game.title,
              provider: game.provider,
              timestamp: new Date().toISOString(),
            });
            // Open the game URL in a modal or new tab
            if (game.gameUrl && game.gameUrl.includes('http')) {
              window.open(game.gameUrl, '_blank', 'width=1024,height=768');
            }
          }}
        />
      </section>

      {/* Upcoming Games Carousel */}
      <section className="space-y-4">
        <SlotGameCarousel
          games={UPCOMING_SLOT_GAMES.slice(0, 10)}
          title="COMING SOON"
          isUpcoming={true}
          onPlayClick={(game: SlotGame) => {
            console.log('[Index] Upcoming Game Notify Clicked:', {
              gameId: game.id,
              title: game.title,
              provider: game.provider,
              releaseDate: game.releaseDate,
              timestamp: new Date().toISOString(),
            });
            // TODO: Implement notification signup
          }}
        />
      </section>

      {/* Pragmatic Game Player Modal */}
      {selectedGameId && (
        <PragmaticGameModal
          gameId={selectedGameId}
          onClose={() => setSelectedGameId(null)}
        />
      )}

      {/* AI Employment Notice */}
      <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shrink-0">
          <MessageSquare className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg">AI-Managed Integrity</h3>
          <p className="text-muted-foreground text-sm">
            CoinKrazyAI2 is monitored in real-time by LuckyAI and our suite of specialized AI employees.
            All gameplay, payouts, and chat are moderated for a safe and fair experience.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 md:ml-auto border-primary/20 text-primary hover:bg-primary/10">
          Meet the AI Team
        </Button>
      </section>
    </div>
  );
};

// Pragmatic Game Modal Component
interface PragmaticGameModalProps {
  gameId: string;
  onClose: () => void;
}

function PragmaticGameModal({ gameId, onClose }: PragmaticGameModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const game = PRAGMATIC_GAMES.find((g) => g.id === gameId);

  // Build Roxor Games demo URL (works for Pragmatic Play games)
  const getRoxorGamesUrl = (gameId: string, gameKey?: string) => {
    const baseUrl = 'https://cdn.na.roxor.games/static-assets/platform-assets/gs-wrapper/2.180.344/index.html';
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

    const url = `${baseUrl}?${params.toString()}`;

    console.log('[PragmaticGameModal] Constructing Roxor Games URL:', {
      gameId,
      gameKey: keyToUse,
      finalUrl: url,
    });

    return url;
  };

  if (!game) return null;

  const gameUrl = getRoxorGamesUrl(game.id, game.gameKey);

  console.log('[PragmaticGameModal] Launching Game:', {
    gameId: game.id,
    gameName: game.name,
    provider: game.provider,
    gameKey: game.gameKey,
    url: gameUrl,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-gray-900 w-full h-full md:rounded-xl max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-amber-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <span className="hidden sm:inline">🎰</span> PRAGMATIC PLAY
            </div>
            <div className="h-6 w-px bg-amber-400/30 hidden sm:block"></div>
            <div className="text-amber-100 text-sm font-medium truncate max-w-[150px] md:max-w-none">
              {game.name}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full text-xs text-white border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              DEMO MODE
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
                <p className="text-gray-400 text-lg">Loading Pragmatic Play game...</p>
                <p className="text-amber-400 font-semibold text-xl">{game.name}</p>
              </div>
            </div>
          )}

          <iframe
            src={gameUrl}
            className="w-full h-full border-none"
            allow="autoplay; fullscreen; encrypted-media"
            onLoad={() => {
              console.log('[PragmaticGameModal] iframe loaded successfully');
              setIframeLoaded(true);
            }}
            onError={() => {
              console.error('[PragmaticGameModal] iframe failed to load');
            }}
            title={game.name}
          />
        </div>

        {/* Bottom Bar */}
        <div className="bg-gray-800/50 px-4 py-2 border-t border-gray-700 flex items-center justify-between text-[10px] md:text-xs text-gray-400 shrink-0">
          <div>Provider: {game.provider}</div>
          <div className="flex items-center gap-4">
            <span>Game: {game.slug}</span>
            <span>RTP: {game.rtp ? `${game.rtp}%` : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;
