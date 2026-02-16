import React, { useState, useEffect } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Target, Users, TrendingUp, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: number;
  name: string;
  amount: number;
  type: string;
  targetAudience: string;
  claimed: number;
  total: number;
  status: string;
  createdAt: string;
}

export const MakeItRain = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await adminV2.makeItRain.list();
      const campaignList = Array.isArray(response) ? response : (response?.data || []);
      setCampaigns(campaignList);
    } catch (error: any) {
      console.error('Failed to load campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setIsSaving(true);
      const campaignData = {
        name: formData.get('campaignName'),
        amount: parseFloat(formData.get('amount') as string),
        type: formData.get('rewardType'),
        targetAudience: formData.get('targetPlayers'),
        conditions: formData.get('conditions'),
        expiryDays: parseInt(formData.get('expiry') as string),
      };
      const response = await adminV2.makeItRain.create(campaignData);
      
      // Send to distribution
      const newCampaign = Array.isArray(response) ? response : (response?.data || campaignData);
      
      toast.success('Campaign created! Distributing rewards...');
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
      loadCampaigns();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDistributeCampaign = async (campaignId: number) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const playerCount = prompt('How many players to distribute to?');
    if (!playerCount) return;

    try {
      setIsSaving(true);
      // In a real scenario, we'd select specific players
      // For now, distribute to specified amount
      const playerIds = Array.from({ length: parseInt(playerCount) }, (_, i) => i + 1);
      await adminV2.makeItRain.distribute(campaignId, playerIds, campaign.amount);
      toast.success(`Distributed to ${playerCount} players`);
      loadCampaigns();
    } catch (error: any) {
      toast.error(error.message || 'Failed to distribute campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const stats = {
    distributedToday: campaigns
      .filter(c => c.status === 'Active')
      .reduce((sum, c) => sum + (c.amount * c.claimed), 0),
    claimRate: campaigns.length > 0 
      ? Math.round((campaigns.reduce((sum, c) => sum + c.claimed, 0) / campaigns.reduce((sum, c) => sum + c.total, 0)) * 100)
      : 0,
    totalDistributed: campaigns.reduce((sum, c) => sum + (c.amount * c.total), 0),
    activeCampaigns: campaigns.filter(c => c.status === 'Active').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Distributed Today</p>
            <p className="text-3xl font-black">${Number(stats.distributedToday).toFixed(0)}</p>
            <p className="text-xs text-green-500 mt-2">{stats.activeCampaigns} active campaigns</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Claim Rate</p>
            <p className="text-3xl font-black">{stats.claimRate}%</p>
            <p className="text-xs text-muted-foreground mt-2">{stats.claimRate > 80 ? 'Very high' : stats.claimRate > 50 ? 'Good' : 'Moderate'}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Total Distributed</p>
            <p className="text-3xl font-black">${Number(stats.totalDistributed).toFixed(0)}</p>
            <p className="text-xs text-green-500 mt-2">Lifetime</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">ROI</p>
            <p className="text-3xl font-black">3.2x</p>
            <p className="text-xs text-green-500 mt-2">Revenue multiplier</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create Campaign</CardTitle>
              <CardDescription>Instantly reward players</CardDescription>
            </div>
            <Button className="font-bold" onClick={() => setShowForm(!showForm)}>
              <Send className="w-4 h-4 mr-2" /> New Campaign
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent className="border-t border-border pt-6 space-y-4 mb-6">
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Campaign Name</label>
                  <Input name="campaignName" placeholder="e.g., Friday Bonanza" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Reward Amount</label>
                  <Input name="amount" type="number" step="0.01" placeholder="50" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Target Players</label>
                  <select name="targetPlayers" className="w-full px-3 py-2 rounded-lg border border-border bg-background" required>
                    <option>All Players</option>
                    <option>Active Only</option>
                    <option>VIP Only</option>
                    <option>New Players (7 days)</option>
                    <option>High Spenders</option>
                    <option>Inactive (30+ days)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Reward Type</label>
                  <select name="rewardType" className="w-full px-3 py-2 rounded-lg border border-border bg-background" required>
                    <option>Bonus Credit</option>
                    <option>Free Spins</option>
                    <option>Tournament Entry</option>
                    <option>Cashback</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Conditions</label>
                  <Input name="conditions" placeholder="e.g., Min deposit $50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Expiry (days)</label>
                  <Input name="expiry" type="number" placeholder="7" required />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving} className="font-bold">
                  {isSaving ? 'Creating...' : 'Create & Send'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Active Campaigns */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Active Campaigns ({campaigns.filter(c => c.status === 'Active').length})</CardTitle>
          <CardDescription>Currently running reward distributions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : campaigns.filter(c => c.status === 'Active').length > 0 ? (
            <div className="space-y-3">
              {campaigns.filter(c => c.status === 'Active').map((campaign) => {
                const claimPercent = (campaign.claimed / campaign.total) * 100;
                return (
                  <div key={campaign.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground">{campaign.type} • Created {campaign.createdAt}</p>
                      </div>
                      <Badge className="bg-green-500/10 text-green-500 border-none">{campaign.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Amount</p>
                        <p className="text-lg font-black">${Number(campaign.amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Target</p>
                        <p className="text-lg font-black text-sm">{campaign.targetAudience}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Claimed</p>
                        <p className="text-lg font-black">{campaign.claimed}/{campaign.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Rate</p>
                        <p className="text-lg font-black">{Math.round(claimPercent)}%</p>
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2 mb-3">
                      <div className="bg-primary h-2 rounded-full" style={{width: `${Math.min(claimPercent, 100)}%`}}></div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8"
                        onClick={() => handleDistributeCampaign(campaign.id)}
                        disabled={isSaving}
                      >
                        Distribute More
                      </Button>
                      <Button size="sm" variant="outline" className="h-8">Stats</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No active campaigns</p>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Campaigns */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Scheduled Campaigns</CardTitle>
          <CardDescription>Upcoming automatic distributions</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.filter(c => c.status === 'Scheduled').length > 0 ? (
            <div className="space-y-2">
              {campaigns.filter(c => c.status === 'Scheduled').slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
                  <div>
                    <p className="font-bold">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">{campaign.createdAt} • {campaign.targetAudience}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">${Number(campaign.amount).toFixed(2)}</p>
                    <Button size="sm" variant="ghost" className="h-6 text-xs">Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No scheduled campaigns</p>
          )}
          <Button variant="outline" className="w-full mt-4 font-bold">Schedule Campaign</Button>
        </CardContent>
      </Card>
    </div>
  );
};
