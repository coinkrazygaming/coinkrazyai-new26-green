import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Eye, EyeOff, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export const APIManagement = () => {
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: 'Production API Key',
      key: 'sk_live_****************************8k9m',
      created: '2024-01-15',
      lastUsed: '2 hours ago',
      requests: '145,234',
      status: 'Active',
      permissions: ['read', 'write', 'admin']
    },
    {
      id: 2,
      name: 'Testing API Key',
      key: 'sk_test_****************************5x2p',
      created: '2024-02-01',
      lastUsed: '1 day ago',
      requests: '12,456',
      status: 'Active',
      permissions: ['read', 'write']
    },
    {
      id: 3,
      name: 'Third-Party Integration',
      key: 'sk_live_****************************3q7r',
      created: '2024-01-20',
      lastUsed: '5 days ago',
      requests: '89,234',
      status: 'Inactive',
      permissions: ['read']
    }
  ]);

  const [showNewKeyForm, setShowNewKeyForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* API Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Active Keys</p>
            <p className="text-3xl font-black">2</p>
            <p className="text-xs text-green-500 mt-2">Authorized</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Daily Requests</p>
            <p className="text-3xl font-black">1.2M</p>
            <p className="text-xs text-muted-foreground mt-2">24h volume</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Avg Response</p>
            <p className="text-3xl font-black">124ms</p>
            <p className="text-xs text-green-500 mt-2">Healthy</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Uptime</p>
            <p className="text-3xl font-black">99.99%</p>
            <p className="text-xs text-green-500 mt-2">SLA met</p>
          </CardContent>
        </Card>
      </div>

      {/* API Keys */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage authentication credentials</CardDescription>
            </div>
            <Button className="font-bold" onClick={() => setShowNewKeyForm(!showNewKeyForm)}>
              <Plus className="w-4 h-4 mr-2" /> Create Key
            </Button>
          </div>
        </CardHeader>

        {showNewKeyForm && (
          <CardContent className="border-t border-border pt-6 space-y-4 mb-6">
            <div>
              <label className="text-sm font-bold">Key Name</label>
              <Input placeholder="e.g., Mobile App API" className="bg-muted/50" />
            </div>
            <div>
              <label className="text-sm font-bold">Environment</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background">
                <option>Production</option>
                <option>Testing</option>
                <option>Development</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold">Permissions</label>
              <div className="space-y-2 mt-2">
                {['Read', 'Write', 'Delete', 'Admin'].map((perm) => (
                  <label key={perm} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{perm}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="font-bold">Create Key</Button>
              <Button variant="outline" onClick={() => setShowNewKeyForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        )}

        <CardContent>
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{key.name}</h4>
                    <code className="text-xs text-muted-foreground font-mono">{key.key}</code>
                  </div>
                  <Badge className={key.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'} style={{borderStyle: 'none'}}>
                    {key.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Created</p>
                    <p className="text-sm font-black">{key.created}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Last Used</p>
                    <p className="text-sm font-black">{key.lastUsed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Requests</p>
                    <p className="text-sm font-black">{key.requests}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Permissions</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {key.permissions.map((perm) => (
                        <Badge key={perm} className="bg-muted/50 border-none text-xs">{perm}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Available API routes and methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { method: 'GET', endpoint: '/api/players', rate: '100/min', usage: '89%' },
              { method: 'POST', endpoint: '/api/transactions', rate: '50/min', usage: '42%' },
              { method: 'GET', endpoint: '/api/games', rate: '200/min', usage: '15%' },
              { method: 'PUT', endpoint: '/api/wallets', rate: '100/min', usage: '78%' },
              { method: 'GET', endpoint: '/api/analytics', rate: '50/min', usage: '5%' },
            ].map((endpoint, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Badge className="bg-blue-500/10 text-blue-500 border-none text-xs font-bold">{endpoint.method}</Badge>
                    <code className="font-mono text-sm">{endpoint.endpoint}</code>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-muted-foreground">Rate: {endpoint.rate}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="bg-primary h-2 rounded-full" style={{width: endpoint.usage}}></div>
                      </div>
                      <p className="text-xs text-muted-foreground">{endpoint.usage}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>Configure event notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {['Payment Completed', 'Player Registered', 'Game Result', 'Transaction Failed'].map((event) => (
            <div key={event} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <p className="font-bold text-sm">{event}</p>
              <Button size="sm" variant="outline" className="h-8">Configure</Button>
            </div>
          ))}
          <Button variant="outline" className="w-full font-bold mt-4">Add Webhook</Button>
        </CardContent>
      </Card>
    </div>
  );
};
