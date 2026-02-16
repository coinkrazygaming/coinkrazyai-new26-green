import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, TrendingUp, DollarSign, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PokerManagement = () => {
  const [tables, setTables] = useState([
    {
      id: 1,
      name: 'Diamond Table 1',
      stakes: '$1/$2',
      players: 6,
      maxPlayers: 8,
      buyIn: '$20-$200',
      status: 'Active',
      revenue: '$1,250',
      avgPot: '$85'
    },
    {
      id: 2,
      name: 'Ruby Table 2',
      stakes: '$5/$10',
      players: 5,
      maxPlayers: 8,
      buyIn: '$100-$1000',
      status: 'Active',
      revenue: '$3,420',
      avgPot: '$345'
    },
    {
      id: 3,
      name: 'Gold Table 1',
      stakes: '$10/$20',
      players: 0,
      maxPlayers: 6,
      buyIn: '$200-$2000',
      status: 'Idle',
      revenue: '$2,100',
      avgPot: '$500'
    },
    {
      id: 4,
      name: 'Platinum VIP',
      stakes: '$50/$100',
      players: 4,
      maxPlayers: 6,
      buyIn: '$1000+',
      status: 'Active',
      revenue: '$8,950',
      avgPot: '$2,500'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Poker Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Active Tables</p>
            <p className="text-3xl font-black">3</p>
            <p className="text-xs text-green-500 mt-2">16 players seated</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Daily Revenue</p>
            <p className="text-3xl font-black">$15.7K</p>
            <p className="text-xs text-green-500 mt-2">+12% vs yesterday</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Avg Pot</p>
            <p className="text-3xl font-black">$783</p>
            <p className="text-xs text-muted-foreground mt-2">All tables</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Waiting List</p>
            <p className="text-3xl font-black">8</p>
            <p className="text-xs text-orange-500 mt-2">Players queued</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Management */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Poker Tables</CardTitle>
              <CardDescription>Manage active tables and configurations</CardDescription>
            </div>
            <Button className="font-bold">
              <Plus className="w-4 h-4 mr-2" /> Create Table
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tables.map((table) => (
              <div key={table.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{table.name}</h4>
                    <p className="text-sm text-muted-foreground">Buy-in: {table.buyIn}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={table.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'} style={{borderStyle: 'none'}}>
                      {table.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Stakes</p>
                    <p className="text-lg font-black">{table.stakes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Players</p>
                    <p className="text-lg font-black">{table.players}/{table.maxPlayers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Avg Pot</p>
                    <p className="text-lg font-black">{table.avgPot}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Today Revenue</p>
                    <p className="text-lg font-black">{table.revenue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Max Players</p>
                    <p className="text-lg font-black">{table.maxPlayers}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8">
                    <TrendingUp className="w-4 h-4 mr-2" /> Stats
                  </Button>
                  <Button size="sm" variant="outline" className="h-8">
                    <Users className="w-4 h-4 mr-2" /> Players
                  </Button>
                  <Button size="sm" variant="outline" className="h-8">
                    <DollarSign className="w-4 h-4 mr-2" /> Limits
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

      {/* Anti-Cheat & Collusion Detection */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Anti-Cheating & Collusion Detection</CardTitle>
          <CardDescription>Monitor for suspicious activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { status: 'High Win Rate Detection', active: 'John_Doe', table: 'Platinum VIP', action: 'Monitor' },
              { status: 'Unusual IP Patterns', active: 'Player_X123', table: 'Diamond Table 1', action: 'Investigate' },
              { status: 'Hole Card Exposure', active: 'None', table: 'All Tables', action: 'Monitored' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="font-bold">{item.status}</p>
                  <p className="text-sm text-muted-foreground">
                    Player: {item.active} • Table: {item.table}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-8">
                  {item.action}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tournament Management */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Tournaments</CardTitle>
          <CardDescription>Manage poker tournaments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Daily Tournament $50', time: 'Starts in 2h', players: 24, prizePool: '$5,000', status: 'Scheduled' },
              { name: 'Weekly $500 Special', time: 'Live now', players: 32, prizePool: '$25,000', status: 'Running' },
              { name: 'Monthly Championship', time: 'In 3 days', players: 'TBD', prizePool: '$100,000', status: 'Registering' }
            ].map((tournament) => (
              <div key={tournament.name} className="p-3 bg-muted/30 rounded-lg border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold">{tournament.name}</p>
                  <p className="text-sm text-muted-foreground">{tournament.time} • Prize Pool: {tournament.prizePool}</p>
                </div>
                <div className="text-right">
                  <Badge className={tournament.status === 'Running' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'} style={{borderStyle: 'none'}}>
                    {tournament.status}
                  </Badge>
                  <p className="text-xs font-bold mt-1">{tournament.players} players</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4 font-bold">Create Tournament</Button>
        </CardContent>
      </Card>
    </div>
  );
};
