import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Send, RefreshCw, Eye } from 'lucide-react';

export const WalletManagement = () => {
  const [wallets, setWallets] = useState([
    {
      id: 1,
      player: 'John Doe',
      email: 'john@example.com',
      gc: 5250,
      sc: 125,
      totalUSD: '$1,250.50',
      lastTransaction: '2 hours ago',
      status: 'Active'
    },
    {
      id: 2,
      player: 'Jane Smith',
      email: 'jane@example.com',
      gc: 12000,
      sc: 340,
      totalUSD: '$3,420.00',
      lastTransaction: '1 day ago',
      status: 'Active'
    },
    {
      id: 3,
      player: 'Sarah Wilson',
      email: 'sarah@example.com',
      gc: 2100,
      sc: 89,
      totalUSD: '$2,100.00',
      lastTransaction: '5 hours ago',
      status: 'Pending Verification'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Total GC</p>
            <p className="text-3xl font-black">2.4M</p>
            <p className="text-xs text-green-500 mt-2">In circulation</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Total SC</p>
            <p className="text-3xl font-black">8.5K</p>
            <p className="text-xs text-green-500 mt-2">In circulation</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Pending Transfers</p>
            <p className="text-3xl font-black">$42.5K</p>
            <p className="text-xs text-orange-500 mt-2">6 transfers</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Today's Volume</p>
            <p className="text-3xl font-black">$127.5K</p>
            <p className="text-xs text-blue-500 mt-2">All transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Directory */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Player Wallets</CardTitle>
          <CardDescription>Manage player balances and transfers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Input placeholder="Search by player name or email..." className="pl-10 bg-muted/50" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Player</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">GC Balance</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">SC Balance</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Total Value</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Last Activity</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet) => (
                  <tr key={wallet.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div>
                        <p className="font-bold">{wallet.player}</p>
                        <p className="text-xs text-muted-foreground">{wallet.email}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{wallet.gc.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">GC</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{wallet.sc}</span>
                        <span className="text-xs text-muted-foreground">SC</span>
                      </div>
                    </td>
                    <td className="p-3 font-bold">{wallet.totalUSD}</td>
                    <td className="p-3 text-xs text-muted-foreground">{wallet.lastTransaction}</td>
                    <td className="p-3">
                      <Badge className={wallet.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'} style={{borderStyle: 'none'}}>
                        {wallet.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Add Balance">
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Deduct Balance">
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Management */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
          <CardDescription>Withdrawals and transfers awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: 1, player: 'Mike Brown', amount: '$500', type: 'Withdrawal', date: '2 hours ago' },
              { id: 2, player: 'Lisa Chen', amount: '$1,250', type: 'Withdrawal', date: '4 hours ago' },
              { id: 3, player: 'Tom Wilson', amount: '$750', type: 'Transfer', date: '6 hours ago' }
            ].map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="font-bold">{tx.player}</p>
                  <p className="text-sm text-muted-foreground">{tx.type} • {tx.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg">{tx.amount}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="h-8 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Bulk Wallet Operations</CardTitle>
          <CardDescription>Perform actions on multiple wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
              <h4 className="font-bold">Add Balance to Players</h4>
              <Input placeholder="Player IDs (comma separated)" className="bg-background" />
              <Input placeholder="Amount (GC)" className="bg-background" />
              <Input placeholder="Reason" className="bg-background" />
              <Button className="w-full font-bold">
                <ArrowUp className="w-4 h-4 mr-2" /> Add to All
              </Button>
            </div>
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
              <h4 className="font-bold">Send Promotional Bonus</h4>
              <Input placeholder="Player segment" className="bg-background" />
              <Input placeholder="Bonus amount (SC)" className="bg-background" />
              <Input placeholder="Bonus description" className="bg-background" />
              <Button className="w-full font-bold">
                <Send className="w-4 h-4 mr-2" /> Send Bonus
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
