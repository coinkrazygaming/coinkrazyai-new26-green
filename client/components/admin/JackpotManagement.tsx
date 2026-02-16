import React, { useState, useEffect } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Users, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Jackpot {
  id: number;
  name: string;
  amount: number;
  currentAmount: number;
  contributors: number;
  contributionPercent: number;
  status: string;
  createdAt: string;
}

interface JackpotWin {
  id: number;
  playerId: number;
  playerName: string;
  jackpotId: number;
  jackpotName: string;
  amount: number;
  wonAt: string;
}

export const JackpotManagement = () => {
  const [jackpots, setJackpots] = useState<Jackpot[]>([]);
  const [wins, setWins] = useState<JackpotWin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    loadJackpots();
  }, []);

  const loadJackpots = async () => {
    try {
      setIsLoading(true);
      const response = await adminV2.jackpots.list();
      const jackpotList = Array.isArray(response) ? response : (response?.data || []);
      setJackpots(jackpotList);
    } catch (error: any) {
      console.error('Failed to load jackpots:', error);
      toast.error('Failed to load jackpots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJackpot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setIsSaving(true);
      const jackpotData = {
        name: formData.get('jackpotName'),
        initialAmount: parseFloat(formData.get('initialAmount') as string),
        contributionPercent: parseFloat(formData.get('contribution') as string),
        status: 'Active',
      };
      await adminV2.jackpots.create(jackpotData);
      toast.success('Jackpot created successfully');
      setShowNewForm(false);
      (e.target as HTMLFormElement).reset();
      loadJackpots();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create jackpot');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateJackpot = async (jackpotId: number, newAmount: number) => {
    try {
      setIsSaving(true);
      await adminV2.jackpots.update(jackpotId, newAmount);
      toast.success('Jackpot updated successfully');
      loadJackpots();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update jackpot');
    } finally {
      setIsSaving(false);
    }
  };

  const stats = {
    totalInPools: jackpots.reduce((sum, j) => sum + j.currentAmount, 0),
    totalContributors: jackpots.reduce((sum, j) => sum + j.contributors, 0),
    totalWins: wins.length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Total in Pools</p>
            <p className="text-3xl font-black">${Number(stats.totalInPools).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Contributors</p>
            <p className="text-3xl font-black">{stats.totalContributors.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Total Wins</p>
            <p className="text-3xl font-black">{stats.totalWins}</p>
          </CardContent>
        </Card>
      </div>

      {/* Create New Jackpot */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Jackpot Pools ({jackpots.length})</CardTitle>
              <CardDescription>Manage progressive jackpot pools</CardDescription>
            </div>
            <Button className="font-bold" onClick={() => setShowNewForm(!showNewForm)}>
              <Plus className="w-4 h-4 mr-2" /> Create Jackpot
            </Button>
          </div>
        </CardHeader>

        {showNewForm && (
          <CardContent className="border-t border-border pt-6">
            <form onSubmit={handleCreateJackpot} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Jackpot Name</label>
                  <Input name="jackpotName" placeholder="e.g., Daily Jackpot" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Initial Amount</label>
                  <Input name="initialAmount" type="number" step="0.01" placeholder="10000" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Contribution %</label>
                  <Input name="contribution" type="number" step="0.01" placeholder="0.5" required />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving} className="font-bold">
                  {isSaving ? 'Creating...' : 'Create Jackpot'}
                </Button>
                <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        )}

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : jackpots.length > 0 ? (
            <div className="space-y-4">
              {jackpots.map((jackpot) => (
                <div key={jackpot.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <div>
                        <h4 className="font-bold">{jackpot.name}</h4>
                        <p className="text-sm text-muted-foreground">{jackpot.contributors} contributors</p>
                      </div>
                    </div>
                    <Badge 
                      className={jackpot.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'} 
                      style={{borderStyle: 'none'}}
                    >
                      {jackpot.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Current Amount</p>
                      <p className="text-lg font-black">${Number(jackpot.currentAmount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Contribution</p>
                      <p className="text-lg font-black">{jackpot.contributionPercent}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Contributors</p>
                      <p className="text-lg font-black">{jackpot.contributors.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8"
                      onClick={() => {
                        const newAmount = prompt('Enter new amount:');
                        if (newAmount) {
                          handleUpdateJackpot(jackpot.id, parseFloat(newAmount));
                        }
                      }}
                      disabled={isSaving}
                    >
                      Update Amount
                    </Button>
                    <Button size="sm" variant="outline" className="h-8">Configure</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No jackpot pools found</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Winners */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Recent Winners</CardTitle>
          <CardDescription>Latest jackpot payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {wins.length > 0 ? (
            <div className="space-y-2">
              {wins.slice(0, 10).map((win) => (
                <div key={win.id} className="p-3 bg-muted/30 rounded border border-border flex items-center justify-between">
                  <div>
                    <p className="font-bold">{win.playerName}</p>
                    <p className="text-xs text-muted-foreground">{win.jackpotName} • {win.wonAt}</p>
                  </div>
                  <p className="font-black text-green-500">${Number(win.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No recent wins yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
