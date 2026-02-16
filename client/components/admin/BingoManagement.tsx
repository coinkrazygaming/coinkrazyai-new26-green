import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, RotateCcw, Trash2, Users, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BingoManagement = () => {
  const [games, setGames] = useState([
    {
      id: 1,
      name: 'Morning Bonanza',
      pattern: '5-line',
      players: 42,
      ticketPrice: '$1',
      jackpot: '$500',
      status: 'Running',
      timeRemaining: '3:45'
    },
    {
      id: 2,
      name: 'Afternoon Special',
      pattern: 'Full Card',
      players: 28,
      ticketPrice: '$2',
      jackpot: '$1,200',
      status: 'Running',
      timeRemaining: '5:20'
    },
    {
      id: 3,
      name: 'Evening Rush',
      pattern: '5-line',
      players: 0,
      ticketPrice: '$1.50',
      jackpot: '$750',
      status: 'Scheduled',
      timeRemaining: 'Starts in 30m'
    },
    {
      id: 4,
      name: 'Night Party',
      pattern: 'Corner',
      players: 0,
      ticketPrice: '$3',
      jackpot: '$2,000',
      status: 'Scheduled',
      timeRemaining: 'Starts in 2h'
    }
  ]);

  const [callers, setCallers] = useState([
    {
      id: 1,
      name: 'Lucy - AI Caller',
      status: 'Active',
      currentGame: 'Morning Bonanza',
      gamestoday: 8,
      accuracy: '99.8%'
    },
    {
      id: 2,
      name: 'Charlie - AI Caller',
      status: 'Active',
      currentGame: 'Afternoon Special',
      gamestoday: 6,
      accuracy: '99.6%'
    },
    {
      id: 3,
      name: 'Marina - AI Caller',
      status: 'Idle',
      currentGame: 'None',
      gamestoday: 0,
      accuracy: '100%'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Bingo Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Active Games</p>
            <p className="text-3xl font-black">2</p>
            <p className="text-xs text-green-500 mt-2">70 players</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Daily Revenue</p>
            <p className="text-3xl font-black">$8.5K</p>
            <p className="text-xs text-green-500 mt-2">+18% vs yesterday</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Tickets Sold</p>
            <p className="text-3xl font-black">2,450</p>
            <p className="text-xs text-muted-foreground mt-2">Today</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Active Callers</p>
            <p className="text-3xl font-black">2</p>
            <p className="text-xs text-blue-500 mt-2">AI managed</p>
          </CardContent>
        </Card>
      </div>

      {/* Games Management */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bingo Games</CardTitle>
              <CardDescription>Schedule and manage bingo games</CardDescription>
            </div>
            <Button className="font-bold">
              <Plus className="w-4 h-4 mr-2" /> Create Game
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {games.map((game) => (
              <div key={game.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{game.name}</h4>
                    <p className="text-sm text-muted-foreground">Pattern: {game.pattern} • {game.timeRemaining}</p>
                  </div>
                  <Badge className={game.status === 'Running' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'} style={{borderStyle: 'none'}}>
                    {game.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Players</p>
                    <p className="text-lg font-black">{game.players}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Ticket Price</p>
                    <p className="text-lg font-black">{game.ticketPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Jackpot</p>
                    <p className="text-lg font-black">{game.jackpot}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Pattern</p>
                    <p className="text-lg font-black">{game.pattern}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Status</p>
                    <p className="text-lg font-black">{game.status}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {game.status === 'Running' ? (
                    <>
                      <Button size="sm" variant="outline" className="h-8">
                        <Pause className="w-4 h-4 mr-2" /> Pause
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> End Game
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" className="h-8 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                        <Play className="w-4 h-4 mr-2" /> Start
                      </Button>
                      <Button size="sm" variant="outline" className="h-8">
                        <RotateCcw className="w-4 h-4 mr-2" /> Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Caller Management */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Bingo Callers (AI)</CardTitle>
          <CardDescription>Manage AI callers and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {callers.map((caller) => (
              <div key={caller.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{caller.name}</h4>
                    <p className="text-sm text-muted-foreground">Current: {caller.currentGame}</p>
                  </div>
                  <Badge className={caller.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'} style={{borderStyle: 'none'}}>
                    {caller.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Games Today</p>
                    <p className="text-lg font-black">{caller.gamestoday}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Accuracy</p>
                    <p className="text-lg font-black">{caller.accuracy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Status</p>
                    <p className="text-lg font-black">{caller.status}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8">
                    Assign Game
                  </Button>
                  <Button size="sm" variant="outline" className="h-8">
                    Settings
                  </Button>
                  <Button size="sm" variant="outline" className="h-8">
                    Logs
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4 font-bold">
            <Plus className="w-4 h-4 mr-2" /> Add New Caller
          </Button>
        </CardContent>
      </Card>

      {/* Pattern Configuration */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Bingo Patterns</CardTitle>
          <CardDescription>Configure winning patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: '5-Line (Horizontal)', payout: '50%', active: true },
              { name: 'Full Card', payout: '100%', active: true },
              { name: 'Corner', payout: '30%', active: true },
              { name: 'X Pattern', payout: '75%', active: false },
              { name: 'Frame', payout: '45%', active: true },
              { name: 'Custom', payout: 'Variable', active: false }
            ].map((pattern) => (
              <div key={pattern.name} className="p-3 bg-muted/30 rounded-lg border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{pattern.name}</p>
                  <p className="text-xs text-muted-foreground">Payout: {pattern.payout}</p>
                </div>
                <Badge className={pattern.active ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'} style={{borderStyle: 'none'}}>
                  {pattern.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
