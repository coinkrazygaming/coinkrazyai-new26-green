import React, { useState, useEffect } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Copy, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Bonus {
  id: number;
  name: string;
  type: string;
  amount: number;
  percentage?: number;
  minDeposit: number;
  maxClaims: number;
  claims: number;
  status: string;
  startDate: string;
  endDate: string;
}

export const BonusManagement = () => {
  const [showNewBonusForm, setShowNewBonusForm] = useState(false);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBonuses();
  }, []);

  const loadBonuses = async () => {
    try {
      setIsLoading(true);
      const response = await adminV2.bonuses.list();
      const bonusList = Array.isArray(response) ? response : (response?.data || []);
      setBonuses(bonusList);
    } catch (error: any) {
      console.error('Failed to load bonuses:', error);
      toast.error('Failed to load bonuses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBonus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setIsSaving(true);
      const bonusData = {
        name: formData.get('bonusName'),
        type: formData.get('type'),
        amount: parseFloat(formData.get('amount') as string),
        percentage: parseFloat(formData.get('percentage') as string) || undefined,
        minDeposit: parseFloat(formData.get('minDeposit') as string),
        maxClaims: parseInt(formData.get('maxClaims') as string),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
      };
      await adminV2.bonuses.create(bonusData);
      toast.success('Bonus created successfully');
      setShowNewBonusForm(false);
      (e.target as HTMLFormElement).reset();
      loadBonuses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create bonus');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBonus = async (bonusId: number) => {
    if (!confirm('Delete this bonus?')) return;
    try {
      setIsSaving(true);
      await adminV2.bonuses.delete(bonusId);
      toast.success('Bonus deleted successfully');
      loadBonuses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete bonus');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateBonus = async (bonus: Bonus) => {
    try {
      setIsSaving(true);
      const newBonusData = {
        ...bonus,
        name: `${bonus.name} (Copy)`,
        id: undefined,
      };
      await adminV2.bonuses.create(newBonusData);
      toast.success('Bonus duplicated successfully');
      loadBonuses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to duplicate bonus');
    } finally {
      setIsSaving(false);
    }
  };

  const stats = {
    active: bonuses.filter(b => b.status === 'Active').length,
    totalClaimed: bonuses.reduce((sum, b) => sum + (b.amount * b.claims), 0),
    avgUsage: bonuses.length > 0 
      ? Math.round(bonuses.reduce((sum, b) => sum + ((b.claims / b.maxClaims) * 100), 0) / bonuses.length)
      : 0,
    conversions: bonuses.length > 0 ? Math.round((bonuses.filter(b => b.claims > 0).length / bonuses.length) * 100) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Active Bonuses</p>
            <p className="text-3xl font-black">{stats.active}</p>
            <p className="text-xs text-green-500 mt-2">All running</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Total Claimed</p>
            <p className="text-3xl font-black">${Number(stats.totalClaimed).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">Lifetime</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Avg Usage</p>
            <p className="text-3xl font-black">{stats.avgUsage}%</p>
            <p className="text-xs text-green-500 mt-2">Average claim rate</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Conversions</p>
            <p className="text-3xl font-black">{stats.conversions}%</p>
            <p className="text-xs text-blue-500 mt-2">Claimed vs Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Create New Bonus */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bonus Campaigns ({bonuses.length})</CardTitle>
              <CardDescription>Create and manage bonus offers</CardDescription>
            </div>
            <Button className="font-bold" onClick={() => setShowNewBonusForm(!showNewBonusForm)}>
              <Plus className="w-4 h-4 mr-2" /> Create Bonus
            </Button>
          </div>
        </CardHeader>
        
        {showNewBonusForm && (
          <CardContent className="border-t border-border pt-6">
            <form onSubmit={handleCreateBonus} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Bonus Name</label>
                  <Input name="bonusName" placeholder="e.g., Welcome Bonus 100%" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Type</label>
                  <select name="type" className="w-full px-3 py-2 rounded-lg border border-border bg-background" required>
                    <option>Deposit Match</option>
                    <option>Reload</option>
                    <option>Free Spins</option>
                    <option>Cash Bonus</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Amount</label>
                  <Input name="amount" type="number" step="0.01" placeholder="100" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Percentage Match</label>
                  <Input name="percentage" type="number" step="0.1" placeholder="100" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Minimum Deposit</label>
                  <Input name="minDeposit" type="number" step="0.01" placeholder="10" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Max Claims</label>
                  <Input name="maxClaims" type="number" placeholder="1000" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Start Date</label>
                  <Input name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">End Date</label>
                  <Input name="endDate" type="date" required />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving} className="font-bold">
                  {isSaving ? 'Creating...' : 'Create Bonus'}
                </Button>
                <Button variant="outline" onClick={() => setShowNewBonusForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        )}

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : bonuses.length > 0 ? (
            <div className="space-y-4">
              {bonuses.map((bonus) => {
                const usagePercent = (bonus.claims / bonus.maxClaims) * 100;
                return (
                  <div key={bonus.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg">{bonus.name}</h4>
                        <p className="text-sm text-muted-foreground">{bonus.type} • {bonus.startDate} to {bonus.endDate}</p>
                      </div>
                      <Badge className={bonus.status === 'Active' ? 'bg-green-500/10 text-green-500 border-none' : 'bg-gray-500/10 text-gray-500 border-none'}>
                        {bonus.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Amount</p>
                        <p className="text-lg font-black">${Number(bonus.amount).toFixed(2)}</p>
                      </div>
                      {bonus.percentage && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold">Match</p>
                          <p className="text-lg font-black">{bonus.percentage}%</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Min Deposit</p>
                        <p className="text-lg font-black">${Number(bonus.minDeposit).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Usage</p>
                        <p className="text-lg font-black">{bonus.claims} / {bonus.maxClaims}</p>
                        <div className="w-full bg-muted rounded-full h-1 mt-1">
                          <div className="bg-primary h-1 rounded-full" style={{width: `${Math.min(usagePercent, 100)}%`}}></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8">
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8"
                        onClick={() => handleDuplicateBonus(bonus)}
                        disabled={isSaving}
                      >
                        <Copy className="w-4 h-4 mr-2" /> Duplicate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteBonus(bonus.id)}
                        disabled={isSaving}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No bonuses found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
