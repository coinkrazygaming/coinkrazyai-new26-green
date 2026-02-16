import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, ToggleRight, ToggleLeft, Trash2, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GameManagement = () => {
  const [games, setGames] = useState([
    {
      id: 1,
      name: 'Mega Spin Slots',
      category: 'Slots',
      provider: 'Internal',
      rtp: '96.5%',
      volatility: 'Medium',
      activeUsers: 342,
      dailyRevenue: '$4,250',
      enabled: true,
      lastUpdated: '2024-02-10'
    },
    {
      id: 2,
      name: 'Diamond Poker Pro',
      category: 'Poker',
      provider: 'Internal',
      rtp: '98.2%',
      volatility: 'Low',
      activeUsers: 189,
      dailyRevenue: '$3,100',
      enabled: true,
      lastUpdated: '2024-02-08'
    },
    {
      id: 3,
      name: 'Bingo Bonanza',
      category: 'Bingo',
      provider: 'Internal',
      rtp: '94.8%',
      volatility: 'High',
      activeUsers: 512,
      dailyRevenue: '$5,800',
      enabled: true,
      lastUpdated: '2024-02-12'
    },
    {
      id: 4,
      name: 'Fruit Frenzy',
      category: 'Slots',
      provider: 'Internal',
      rtp: '95.0%',
      volatility: 'Medium',
      activeUsers: 156,
      dailyRevenue: '$2,100',
      enabled: false,
      lastUpdated: '2024-01-15'
    }
  ]);

  const toggleGame = (id: number) => {
    setGames(games.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Total Games</p>
            <p className="text-3xl font-black">47</p>
            <p className="text-xs text-green-500 mt-2">42 Active</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Daily Players</p>
            <p className="text-3xl font-black">1.2K</p>
            <p className="text-xs text-muted-foreground mt-2">Avg per game</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Daily Revenue</p>
            <p className="text-3xl font-black">$28.5K</p>
            <p className="text-xs text-green-500 mt-2">+8% vs yesterday</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Avg RTP</p>
            <p className="text-3xl font-black">96.1%</p>
            <p className="text-xs text-blue-500 mt-2">Compliant</p>
          </CardContent>
        </Card>
      </div>

      {/* Game Library */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Game Library</CardTitle>
              <CardDescription>Manage games and configure settings</CardDescription>
            </div>
            <Button className="font-bold">
              <Plus className="w-4 h-4 mr-2" /> Add Game
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {games.map((game) => (
              <div key={game.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{game.name}</h4>
                    <p className="text-sm text-muted-foreground">{game.category} • {game.provider}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={game.enabled ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'} style={{borderStyle: 'none'}}>
                      {game.enabled ? 'Live' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">RTP</p>
                    <p className="text-lg font-black">{game.rtp}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Volatility</p>
                    <p className="text-lg font-black">{game.volatility}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Active Users</p>
                    <p className="text-lg font-black">{game.activeUsers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Daily Rev</p>
                    <p className="text-lg font-black">{game.dailyRevenue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Updated</p>
                    <p className="text-sm font-black">{game.lastUpdated}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="h-8">
                    <Settings className="w-4 h-4 mr-2" /> Configure
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8"
                    onClick={() => toggleGame(game.id)}
                  >
                    {game.enabled ? (
                      <><ToggleRight className="w-4 h-4 mr-2" /> Disable</>
                    ) : (
                      <><ToggleLeft className="w-4 h-4 mr-2" /> Enable</>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8">
                    <TrendingUp className="w-4 h-4 mr-2" /> Stats
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RTP Configuration */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>RTP Configuration</CardTitle>
          <CardDescription>Adjust return to player percentages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {['Mega Spin Slots', 'Diamond Poker Pro', 'Bingo Bonanza'].map((gameName) => (
            <div key={gameName} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <div>
                <p className="font-bold">{gameName}</p>
                <p className="text-xs text-muted-foreground">Adjust volatility and return rates</p>
              </div>
              <div className="flex gap-2">
                <Input defaultValue="96.5" className="w-20 h-10 bg-background" />
                <span className="py-2 font-bold">%</span>
                <Button size="sm" variant="outline" className="h-10">Save</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
