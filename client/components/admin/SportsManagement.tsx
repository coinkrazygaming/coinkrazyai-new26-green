import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Lock, Unlock, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SportsManagement = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      sport: 'NFL',
      event: 'Chiefs vs 49ers',
      date: '2024-02-15',
      status: 'Live',
      totalBets: '$124,500',
      lineMovement: '+2.5',
      locked: false
    },
    {
      id: 2,
      sport: 'NBA',
      event: 'Lakers vs Celtics',
      date: '2024-02-15',
      status: 'Live',
      totalBets: '$89,200',
      lineMovement: '-1.5',
      locked: false
    },
    {
      id: 3,
      sport: 'Soccer',
      event: 'Manchester United vs Liverpool',
      date: '2024-02-16',
      status: 'Upcoming',
      totalBets: '$234,100',
      lineMovement: '+0.5',
      locked: false
    },
    {
      id: 4,
      sport: 'Tennis',
      event: 'Australian Open Final',
      date: '2024-02-17',
      status: 'Upcoming',
      totalBets: '$56,800',
      lineMovement: 'N/A',
      locked: false
    }
  ]);

  const toggleLock = (id: number) => {
    setEvents(events.map(e => e.id === id ? { ...e, locked: !e.locked } : e));
  };

  return (
    <div className="space-y-6">
      {/* Sportsbook Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Live Events</p>
            <p className="text-3xl font-black">8</p>
            <p className="text-xs text-green-500 mt-2">Currently betting</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Total Volume</p>
            <p className="text-3xl font-black">$2.1M</p>
            <p className="text-xs text-green-500 mt-2">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Avg Odds</p>
            <p className="text-3xl font-black">1.92</p>
            <p className="text-xs text-muted-foreground mt-2">Across all sports</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Margin</p>
            <p className="text-3xl font-black">4.2%</p>
            <p className="text-xs text-green-500 mt-2">Healthy</p>
          </CardContent>
        </Card>
      </div>

      {/* Events Management */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Sportsbook Events</CardTitle>
          <CardDescription>Manage live and upcoming sports events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{event.event}</h4>
                    <p className="text-sm text-muted-foreground">{event.sport} • {event.date}</p>
                  </div>
                  <Badge className={cn(event.status === 'Live' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500', 'border-none')}>
                    {event.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Total Bets</p>
                    <p className="text-lg font-black">{event.totalBets}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Line Movement</p>
                    <p className="text-lg font-black">{event.lineMovement}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Status</p>
                    <p className="text-lg font-black">{event.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Locked</p>
                    <p className="text-lg font-black">{event.locked ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8">
                    <TrendingUp className="w-4 h-4 mr-2" /> Odds
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8"
                    onClick={() => toggleLock(event.id)}
                  >
                    {event.locked ? (
                      <><Lock className="w-4 h-4 mr-2" /> Locked</>
                    ) : (
                      <><Unlock className="w-4 h-4 mr-2" /> Lock Event</>
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sports Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Supported Sports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {['NFL', 'NBA', 'Soccer', 'Tennis', 'Baseball', 'Hockey', 'MMA', 'Boxing', 'Cricket', 'Esports'].map((sport) => (
              <div key={sport} className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border">
                <p className="font-bold text-sm">{sport}</p>
                <Badge className="bg-green-500/10 text-green-500 border-none text-xs">Active</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Betting Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: 'Moneyline', active: true },
              { name: 'Spread', active: true },
              { name: 'Over/Under', active: true },
              { name: 'Parlay', active: true },
              { name: 'Prop Bets', active: true },
              { name: 'Live Betting', active: true }
            ].map((bet) => (
              <div key={bet.name} className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border">
                <p className="font-bold text-sm">{bet.name}</p>
                <Badge className={cn(bet.active ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500', 'border-none text-xs')}>
                  {bet.active ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Odd Settings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Odds Configuration</CardTitle>
          <CardDescription>Configure betting odds and margins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {['Moneyline', 'Spread', 'Over/Under'].map((oddType) => (
            <div key={oddType} className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold">{oddType}</p>
                <Button size="sm" variant="outline" className="h-8">Configure</Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-background rounded border border-border">
                  <p className="text-xs text-muted-foreground">Min Odds</p>
                  <p className="font-bold">1.01</p>
                </div>
                <div className="p-2 bg-background rounded border border-border">
                  <p className="text-xs text-muted-foreground">Max Odds</p>
                  <p className="font-bold">100.00</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
