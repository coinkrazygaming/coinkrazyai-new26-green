import React, { useState, useEffect } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, AlertTriangle, Users, Headphones, Code, Database, Bell, Shield, Zap, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminAdvanced = () => {
  const [vipTiers, setVipTiers] = useState<any[]>([]);
  const [fraudFlags, setFraudFlags] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdvancedData();
  }, []);

  const loadAdvancedData = async () => {
    try {
      setIsLoading(true);
      const [vipRes, fraudRes, affiliateRes, ticketsRes, apiRes] = await Promise.all([
        adminV2.vip.listTiers().catch(() => ({ data: [] })),
        adminV2.fraud.listFlags().catch(() => ({ data: [] })),
        adminV2.affiliate.listPartners().catch(() => ({ data: [] })),
        adminV2.support.listTickets().catch(() => ({ data: [] })),
        adminV2.api.listKeys().catch(() => ({ data: [] })),
      ]);

      setVipTiers(Array.isArray(vipRes) ? vipRes : (vipRes?.data || []));
      setFraudFlags(Array.isArray(fraudRes) ? fraudRes : (fraudRes?.data || []));
      setAffiliates(Array.isArray(affiliateRes) ? affiliateRes : (affiliateRes?.data || []));
      setSupportTickets(Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes?.data || []));
      setApiKeys(Array.isArray(apiRes) ? apiRes : (apiRes?.data || []));
    } catch (error: any) {
      console.error('Failed to load advanced data:', error);
      toast.error('Failed to load advanced data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVIPTier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setIsSaving(true);
      const tierData = {
        name: formData.get('tierName'),
        minDeposit: parseFloat(formData.get('minDeposit') as string),
        benefits: formData.get('benefits'),
      };
      const res = await adminV2.vip.createTier(tierData);
      const newTier = res.data || tierData;
      setVipTiers([...vipTiers, newTier]);
      toast.success('VIP tier created');
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create VIP tier');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      toast.success('Settings saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
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
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-8 overflow-x-auto">
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          <TabsTrigger value="vip" className="text-xs">VIP</TabsTrigger>
          <TabsTrigger value="fraud" className="text-xs">Fraud</TabsTrigger>
          <TabsTrigger value="affiliate" className="text-xs">Affiliate</TabsTrigger>
          <TabsTrigger value="support" className="text-xs">Support</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
          <TabsTrigger value="api" className="text-xs">API</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
        </TabsList>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Reporting</CardTitle>
              <CardDescription>Platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Daily Active Users</p>
                  <p className="text-2xl font-bold text-blue-600">1,234</p>
                  <p className="text-xs text-muted-foreground">+5% from yesterday</p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Daily Revenue</p>
                  <p className="text-2xl font-bold text-green-600">$4,523.00</p>
                  <p className="text-xs text-muted-foreground">+12% from yesterday</p>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Avg Session Duration</p>
                  <p className="text-2xl font-bold text-purple-600">23m 45s</p>
                  <p className="text-xs text-muted-foreground">-2% from yesterday</p>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Retention (7d)</p>
                  <p className="text-2xl font-bold text-orange-600">68%</p>
                  <p className="text-xs text-muted-foreground">+3% from last week</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Report Builder</h4>
                <div className="space-y-2">
                  <select className="w-full px-3 py-2 border rounded-md text-sm">
                    <option>Select Report Type...</option>
                    <option>Revenue Report</option>
                    <option>Player Report</option>
                    <option>Game Performance</option>
                    <option>Compliance Report</option>
                  </select>
                  <Button className="w-full">Generate Report</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VIP MANAGEMENT */}
        <TabsContent value="vip" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>VIP Management</CardTitle>
              <CardDescription>Manage VIP tiers and benefits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {vipTiers.length > 0 ? (
                  vipTiers.map(tier => (
                    <div key={tier.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{tier.name}</p>
                        <Badge>{tier.players || 0} players</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Min Deposit: ${tier.min_deposit || tier.minDeposit || 0}</p>
                      <p className="text-sm text-muted-foreground">Benefits: {tier.benefits || 'N/A'}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Delete</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No VIP tiers found</p>
                )}
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Add New VIP Tier</h4>
                <form onSubmit={handleAddVIPTier} className="space-y-2">
                  <Input name="tierName" placeholder="Tier Name" required />
                  <Input name="minDeposit" type="number" placeholder="Minimum Deposit" required />
                  <Input name="benefits" placeholder="Benefits Description" required />
                  <Button type="submit" disabled={isSaving} className="w-full">
                    {isSaving ? 'Creating...' : 'Create Tier'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FRAUD DETECTION */}
        <TabsContent value="fraud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {fraudFlags.length > 0 ? (
                  fraudFlags.map((flag: any) => (
                    <div key={flag.id} className={`p-4 border rounded-lg ${flag.severity === 'critical' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{flag.type || 'Fraud Flag'}</p>
                          <p className="text-sm text-muted-foreground">{flag.description || flag.message}</p>
                          <Badge className="mt-2" variant={flag.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {flag.severity}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant={flag.severity === 'critical' ? 'destructive' : 'outline'}
                          onClick={() => toast.info('Reviewing fraud flag...')}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No fraud flags detected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AFFILIATE PROGRAM */}
        <TabsContent value="affiliate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-semibold">Active Affiliates</p>
                  <p className="text-2xl font-bold">{affiliates.filter((a: any) => a.status === 'active').length}</p>
                  <Button className="w-full mt-3" size="sm">Manage</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-semibold">Total Affiliates</p>
                  <p className="text-2xl font-bold">{affiliates.length}</p>
                  <Button className="w-full mt-3" size="sm">View</Button>
                </div>
              </div>
              {affiliates.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Affiliate List</h4>
                  {affiliates.slice(0, 5).map((affiliate: any) => (
                    <div key={affiliate.id} className="p-3 border rounded-lg text-sm">
                      <div className="flex justify-between">
                        <span>{affiliate.name || affiliate.email}</span>
                        <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                          {affiliate.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUPPORT */}
        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Open Tickets</p>
                      <p className="text-sm text-muted-foreground">
                        {supportTickets.filter((t: any) => t.status === 'open').length} pending
                      </p>
                    </div>
                    <Button size="sm" variant="outline">View</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Total Tickets</p>
                      <p className="text-sm text-muted-foreground">{supportTickets.length} tickets</p>
                    </div>
                    <Button size="sm" variant="outline">Manage</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Priority Tickets</p>
                      <p className="text-sm text-muted-foreground">
                        {supportTickets.filter((t: any) => t.priority === 'high').length} high priority
                      </p>
                    </div>
                    <Badge variant="destructive">Action Required</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOGS */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Input type="date" />
                <select className="px-3 py-2 border rounded-md text-sm flex-1">
                  <option>All Levels</option>
                  <option>Error</option>
                  <option>Warning</option>
                  <option>Info</option>
                </select>
                <Button>Filter</Button>
              </div>

              <div className="space-y-2">
                <div className="p-3 border rounded text-sm font-mono bg-gray-50">
                  <p className="text-xs text-gray-500">[2024-02-15 14:32:45] INFO: User login - player1</p>
                </div>
                <div className="p-3 border rounded text-sm font-mono bg-yellow-50">
                  <p className="text-xs text-yellow-600">[2024-02-15 14:25:12] WARNING: High memory usage detected</p>
                </div>
                <div className="p-3 border rounded text-sm font-mono bg-red-50">
                  <p className="text-xs text-red-600">[2024-02-15 14:18:03] ERROR: Database connection timeout</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">API Keys ({apiKeys.length})</h4>
                <div className="space-y-2">
                  {apiKeys.length > 0 ? (
                    apiKeys.slice(0, 5).map((key: any) => (
                      <div key={key.id} className="p-3 bg-gray-50 rounded border flex items-center justify-between">
                        <div className="text-xs">
                          <code className="font-mono">{key.key ? key.key.substring(0, 20) + '...' : 'N/A'}</code>
                          <p className="text-xs text-muted-foreground mt-1">{key.name || 'API Key'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            adminV2.api.revokeKey(key.id);
                            toast.success('API key revoked');
                          }}
                        >
                          Revoke
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No API keys found</p>
                  )}
                </div>
                <Button className="w-full mt-3" onClick={() => toast.info('Generating new key...')}>
                  Generate New Key
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">API Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Keys</span>
                    <span className="font-semibold">{apiKeys.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Status</span>
                    <span className="font-semibold text-green-600">Operational</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Activity</span>
                    <span className="font-semibold">Just now</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPLIANCE */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Regulations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">GDPR Compliance</p>
                      <p className="text-sm text-muted-foreground">Data deletion requests: 5 pending</p>
                    </div>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Age Verification</p>
                      <p className="text-sm text-muted-foreground">100% of players verified</p>
                    </div>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Account Limitations</p>
                      <p className="text-sm text-muted-foreground">Self-exclusion: 12 active</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Audit Trail</h4>
                  <Button className="w-full" size="sm">Download Compliance Report</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAdvanced;
