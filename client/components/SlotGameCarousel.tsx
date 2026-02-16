import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SlotGame } from '@shared/api';

interface SlotGameCarouselProps {
  games: SlotGame[];
  title?: string;
  showViewAll?: boolean;
  onPlayClick?: (game: SlotGame) => void;
  isUpcoming?: boolean;
}

export function SlotGameCarousel({
  games,
  title,
  showViewAll = false,
  onPlayClick,
  isUpcoming = false,
}: SlotGameCarouselProps) {
  const [hoveredGameId, setHoveredGameId] = useState<string | number | null>(null);

  if (!games || games.length === 0) {
    return null;
  }

  const itemsPerView = 'md:basis-1/3 lg:basis-1/4';

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
          {showViewAll && (
            <Button variant="link" className="text-primary">
              View All Games
            </Button>
          )}
        </div>
      )}

      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {games.map((game) => (
            <CarouselItem
              key={game.id}
              className={cn('pl-2 md:pl-4 basis-full sm:basis-1/2', itemsPerView)}
            >
              <Card
                className="group h-full overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(57,255,20,0.1)]"
                onMouseEnter={() => setHoveredGameId(game.id)}
                onMouseLeave={() => setHoveredGameId(null)}
              >
                {/* Game Image */}
                <CardHeader className="p-0">
                  <div className="relative h-40 md:h-48 w-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 transition-transform group-hover:scale-105 duration-500 overflow-hidden">
                    <img
                      src={game.image || game.thumbnail}
                      alt={game.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%231e293b" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239CA3AF"%3EGame Image%3C/text%3E%3C/svg%3E';
                      }}
                    />

                    {/* Badges */}
                    {game.badges && game.badges.length > 0 && (
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {game.badges.map((badge) => (
                          <Badge
                            key={badge}
                            className={cn(
                              'text-xs font-semibold border-none',
                              badge === 'New'
                                ? 'bg-green-500/90 text-white'
                                : 'bg-amber-500/90 text-white'
                            )}
                          >
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Release Date for Upcoming Games */}
                    {isUpcoming && game.releaseDate && (
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-medium">
                        {game.releaseDate}
                      </div>
                    )}
                  </div>
                </CardHeader>

                {/* Game Info */}
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-2">
                    <CardTitle className="text-lg md:text-xl font-bold line-clamp-2">
                      {game.title}
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm text-muted-foreground">
                      {game.provider}
                    </CardDescription>
                  </div>
                </CardContent>

                {/* Footer - Play Button or Coming Soon */}
                <CardFooter className="p-4 md:p-6 pt-0">
                  {isUpcoming && !game.gameUrl?.includes('http') ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      className="w-full font-bold opacity-50"
                    >
                      COMING SOON
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={hoveredGameId === game.id ? 'default' : 'secondary'}
                      className="w-full font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={() => onPlayClick?.(game)}
                    >
                      {isUpcoming ? 'NOTIFY ME' : 'PLAY'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Buttons */}
        <CarouselPrevious className="hidden md:flex -left-16 top-1/2 -translate-y-1/2 h-10 w-10" />
        <CarouselNext className="hidden md:flex -right-16 top-1/2 -translate-y-1/2 h-10 w-10" />

        {/* Mobile Navigation */}
        <div className="md:hidden flex gap-2 mt-4 justify-center">
          <CarouselPrevious className="relative -left-0 top-0 translate-y-0 h-8 w-8" />
          <CarouselNext className="relative -right-0 top-0 translate-y-0 h-8 w-8" />
        </div>
      </Carousel>
    </div>
  );
}
