import React, { useState, useEffect } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Shield, Lock, Mail, Zap, Users, TrendingUp, Loader2, X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityAlert {
  id: number;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface CMSPage {
  id: number;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  lastUpdated: string;
  content: string;
}

interface CasinoSettings {
  houseEdge: number;
  maxBet: number;
  minBet: number;
  maintenanceMode: boolean;
  demoMode: boolean;
}

interface Campaign {
  id: number;
  name: string;
  targetCount: number;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  reward: number;
  type: string;
}

const AdminOperations = () => {
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [cmsPages, setCmsPages] = useState<CMSPage[]>([]);
  const [casinoSettings, setCasinoSettings] = useState<CasinoSettings>({
    houseEdge: 5,
    maxBet: 10000,
    minBet: 1,
    maintenanceMode: false,
    demoMode: false,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedAlertFilter, setSelectedAlertFilter] = useState<'all' | 'critical' | 'warning' | 'resolved'>('all');
  const [showNewPageForm, setShowNewPageForm] = useState(false);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  const [selectedPage, setSelectedPage] = useState<CMSPage | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOperationData();
  }, []);

  const loadOperationData = async () => {
    try {
      setIsLoading(true);
      const [alertsRes, pagesRes, campaignsRes, settingsRes] = await Promise.all([
        adminV2.security.listAlerts().catch(() => ({ data: [] })),
        adminV2.content.listPages().catch(() => ({ data: [] })),
        adminV2.retention.listCampaigns().catch(() => ({ data: [] })),
        adminV2.casino.getSettings().catch(() => ({ data: { houseEdge: 5, maxBet: 10000, minBet: 1 } })),
      ]);

      const alertsList = Array.isArray(alertsRes) ? alertsRes : (alertsRes?.data || []);
      const pagesList = Array.isArray(pagesRes) ? pagesRes : (pagesRes?.data || []);
      const campaignsList = Array.isArray(campaignsRes) ? campaignsRes : (campaignsRes?.data || []);
      const settings = Array.isArray(settingsRes) ? settingsRes : (settingsRes?.data || {});

      setSecurityAlerts(alertsList.map((a: any) => ({
        id: a.id,
        type: a.alert_type || 'Security Alert',
        severity: a.severity || 'info',
        message: a.message,
        timestamp: a.created_at,
        resolved: a.status === 'resolved',
      })));

      setCmsPages(pagesList.map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        lastUpdated: p.updated_at,
        content: p.content || '',
      })));

      setCampaigns(campaignsList.map((c: any) => ({
        id: c.id,
        name: c.name,
        targetCount: c.target_count || 0,
        status: c.status,
        reward: c.reward || 0,
        type: c.type,
      })));

      setCasinoSettings({
        ...casinoSettings,
        houseEdge: settings.houseEdge || 5,
        maxBet: settings.maxBet || 10000,
        minBet: settings.minBet || 1,
        maintenanceMode: settings.maintenanceMode || false,
        demoMode: settings.demoMode || false,
      });
    } catch (error: any) {
      console.error('Failed to load operation data:', error);
      toast.error('Failed to load operation data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlerts = securityAlerts.filter(alert => {
    if (selectedAlertFilter === 'all') return true;
    if (selectedAlertFilter === 'resolved') return alert.resolved;
    if (selectedAlertFilter === 'critical') return alert.severity === 'critical' && !alert.resolved;
    if (selectedAlertFilter === 'warning') return alert.severity === 'warning' && !alert.resolved;
    return false;
  });

  const handleResolveAlert = async (alertId: number) => {
    try {
      setSavingSettings(true);
      await adminV2.security.resolveAlert(alertId, 'resolved');
      setSecurityAlerts(alerts => alerts.map(a => a.id === alertId ? { ...a, resolved: true } : a));
      toast.success('Alert resolved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve alert');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleInvestigateAlert = (alertId: number) => {
    toast.info('Opening investigation details...');
  };

  const handleSaveCasinoSettings = async () => {
    setSavingSettings(true);
    try {
      await adminV2.casino.updateSettings(casinoSettings);
      toast.success('Casino settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const newCampaignData = {
        name: formData.get('campaignName') as string,
        target_count: parseInt(formData.get('targetCount') as string) || 0,
        status: 'draft',
        reward: parseFloat(formData.get('reward') as string) || 0,
        type: formData.get('type') as string,
      };
      const res = await adminV2.retention.createCampaign(newCampaignData);
      const newCampaign = res.data || { ...newCampaignData, id: Math.random() };
      setCampaigns([...campaigns, newCampaign]);
      setShowNewCampaignForm(false);
      toast.success('Campaign created successfully');
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get('pageTitle') as string;
      const newPageData = {
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        status: 'draft',
        content: formData.get('pageContent') as string,
      };
      const res = await adminV2.content.createPage(newPageData);
      const newPage = res.data || { ...newPageData, id: Math.random(), lastUpdated: new Date().toISOString() };
      setCmsPages([...cmsPages, newPage]);
      setShowNewPageForm(false);
      toast.success('Page created successfully');
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePage = async (pageId: number) => {
    try {
      await adminV2.content.deletePage(pageId);
      setCmsPages(pages => pages.filter(p => p.id !== pageId));
      toast.success('Page deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete page');
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    try {
      await adminV2.retention.updateCampaign(campaignId, { status: 'deleted' });
      setCampaigns(camps => camps.filter(c => c.id !== campaignId));
      toast.success('Campaign deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete campaign');
    }
  };

  const handleLaunchCampaign = async (campaignId: number) => {
    try {
      await adminV2.retention.updateCampaign(campaignId, { status: 'active' });
      setCampaigns(camps => camps.map(c => c.id === campaignId ? { ...c, status: 'active' } : c));
      toast.success('Campaign launched!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to launch campaign');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="casino">Casino</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
        </TabsList>

        {/* SECURITY */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Security Alerts
              </CardTitle>
              <CardDescription>Monitor and manage security incidents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4 overflow-x-auto">
                <Button variant={selectedAlertFilter === 'all' ? 'default' : 'outline'} onClick={() => setSelectedAlertFilter('all')}>All</Button>
                <Button variant={selectedAlertFilter === 'critical' ? 'default' : 'outline'} onClick={() => setSelectedAlertFilter('critical')}>Critical</Button>
                <Button variant={selectedAlertFilter === 'warning' ? 'default' : 'outline'} onClick={() => setSelectedAlertFilter('warning')}>Warning</Button>
                <Button variant={selectedAlertFilter === 'resolved' ? 'default' : 'outline'} onClick={() => setSelectedAlertFilter('resolved')}>Resolved</Button>
              </div>

              {filteredAlerts.length > 0 ? (
                <div className="space-y-3">
                  {filteredAlerts.map(alert => (
                    <div key={alert.id} className={`p-4 border rounded-lg flex items-center justify-between ${alert.resolved ? 'bg-gray-50' : alert.severity === 'critical' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                      <div className="flex items-center gap-3 flex-1">
                        <AlertCircle className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                        <div>
                          <p className="font-semibold text-sm">{alert.type}</p>
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={alert.resolved ? 'secondary' : alert.severity === 'critical' ? 'destructive' : 'secondary'}>{alert.resolved ? 'Resolved' : alert.severity}</Badge>
                        {!alert.resolved && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleInvestigateAlert(alert.id)}>Investigate</Button>
                            <Button size="sm" onClick={() => handleResolveAlert(alert.id)}>Resolve</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No alerts matching filter</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="font-semibold text-sm">Two-Factor Authentication</span>
                  </label>
                  <p className="text-xs text-muted-foreground">Require 2FA for admin</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="font-semibold text-sm">IP Whitelist</span>
                  </label>
                  <p className="text-xs text-muted-foreground">Restrict admin access</p>
                </div>
              </div>
              <Button className="w-full">Save Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTENT */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CMS Pages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setShowNewPageForm(!showNewPageForm)} className="mb-4">
                {showNewPageForm ? '✕ Cancel' : '+ Create New Page'}
              </Button>

              {showNewPageForm && (
                <form onSubmit={handleCreatePage} className="p-4 border rounded-lg bg-muted/30 space-y-3 mb-4">
                  <Input name="pageTitle" placeholder="Page Title" required />
                  <textarea name="pageContent" placeholder="Content..." className="w-full p-2 border rounded-md text-sm min-h-20" required />
                  <Button type="submit" disabled={isSaving} className="w-full">{isSaving ? 'Creating...' : 'Create Page'}</Button>
                </form>
              )}

              <div className="space-y-3">
                {cmsPages.map(page => (
                  <div key={page.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{page.title}</p>
                      <p className="text-xs text-muted-foreground">Updated: {page.lastUpdated}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>{page.status}</Badge>
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeletePage(page.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CASINO */}
        <TabsContent value="casino" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Casino Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">House Edge (%)</label>
                  <Input type="number" value={casinoSettings.houseEdge} onChange={(e) => setCasinoSettings({...casinoSettings, houseEdge: parseFloat(e.target.value)})} step="0.1" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Max Bet (SC)</label>
                  <Input type="number" value={casinoSettings.maxBet} onChange={(e) => setCasinoSettings({...casinoSettings, maxBet: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Min Bet (SC)</label>
                  <Input type="number" value={casinoSettings.minBet} onChange={(e) => setCasinoSettings({...casinoSettings, minBet: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={casinoSettings.maintenanceMode} onChange={(e) => setCasinoSettings({...casinoSettings, maintenanceMode: e.target.checked})} className="w-4 h-4" />
                  <span className="text-sm">Maintenance Mode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={casinoSettings.demoMode} onChange={(e) => setCasinoSettings({...casinoSettings, demoMode: e.target.checked})} className="w-4 h-4" />
                  <span className="text-sm">Demo Mode</span>
                </label>
              </div>
              <Button onClick={handleSaveCasinoSettings} disabled={savingSettings} className="w-full">{savingSettings ? 'Saving...' : 'Save Settings'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOCIAL */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Player Groups</h4>
                  <div className="space-y-2 text-sm">
                    <div><p className="font-semibold">VIP Players</p><p className="text-xs text-muted-foreground">45 members</p></div>
                    <div><p className="font-semibold">High Rollers</p><p className="text-xs text-muted-foreground">12 members</p></div>
                    <div><p className="font-semibold">New Players</p><p className="text-xs text-muted-foreground">234 members</p></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold mb-3">Features</h4>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4" /><span className="text-sm">Friend System</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4" /><span className="text-sm">Messaging</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4" /><span className="text-sm">Tournaments</span></label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RETENTION */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retention Campaigns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setShowNewCampaignForm(!showNewCampaignForm)} className="mb-4">
                {showNewCampaignForm ? '✕ Cancel' : '+ Create Campaign'}
              </Button>

              {showNewCampaignForm && (
                <form onSubmit={handleCreateCampaign} className="p-4 border rounded-lg bg-muted/30 space-y-3 mb-4">
                  <Input name="campaignName" placeholder="Campaign Name" required />
                  <Input name="targetCount" type="number" placeholder="Target Players" required />
                  <Input name="reward" type="number" step="0.01" placeholder="Reward (SC)" required />
                  <select name="type" className="w-full p-2 border rounded-md text-sm"><option>bonus</option><option>free_spin</option><option>discount</option></select>
                  <Button type="submit" disabled={isSaving} className="w-full">{isSaving ? 'Creating...' : 'Create'}</Button>
                </form>
              )}

              <div className="space-y-3">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.targetCount} players • {campaign.reward} SC</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>{campaign.status}</Badge>
                      {campaign.status === 'draft' && <Button size="sm" onClick={() => handleLaunchCampaign(campaign.id)}>Launch</Button>}
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteCampaign(campaign.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminOperations;
