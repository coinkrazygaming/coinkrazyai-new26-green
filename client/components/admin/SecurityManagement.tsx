import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, CheckCircle2, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SecurityManagement = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'suspicious_activity',
      severity: 'high',
      title: 'Multiple Failed Login Attempts',
      description: 'Account user123 attempted login 5 times in 2 minutes from different IPs',
      timestamp: '5 minutes ago',
      status: 'active'
    },
    {
      id: 2,
      type: 'large_withdrawal',
      severity: 'medium',
      title: 'Large Withdrawal Detected',
      description: 'Player john_doe withdrawing $5,000 USD',
      timestamp: '12 minutes ago',
      status: 'active'
    },
    {
      id: 3,
      type: 'api_abuse',
      severity: 'high',
      title: 'API Rate Limit Exceeded',
      description: 'IP 192.168.1.100 exceeded rate limit for /api/games',
      timestamp: '28 minutes ago',
      status: 'resolved'
    },
    {
      id: 4,
      type: 'unusual_pattern',
      severity: 'medium',
      title: 'Unusual Betting Pattern',
      description: 'Player exhibiting potential bot behavior on Slots game',
      timestamp: '1 hour ago',
      status: 'investigating'
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500';
      case 'high': return 'bg-orange-500/10 text-orange-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="w-4 h-4" />;
      case 'investigating': return <AlertCircle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase font-bold">Active Alerts</p>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-black">3</p>
            <p className="text-xs text-orange-500 mt-2">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase font-bold">This Month</p>
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black">127</p>
            <p className="text-xs text-muted-foreground mt-2">Events detected</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase font-bold">Blocked IPs</p>
              <Lock className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-black">42</p>
            <p className="text-xs text-muted-foreground mt-2">Suspicious sources</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase font-bold">Security Score</p>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-black">94%</p>
            <p className="text-xs text-green-500 mt-2">Excellent</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Security Alerts</CardTitle>
          <CardDescription>Real-time threat monitoring and detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  alert.status === 'active' ? 'bg-red-500/5 border-red-500/20' : 
                  alert.status === 'investigating' ? 'bg-yellow-500/5 border-yellow-500/20' :
                  'bg-green-500/5 border-green-500/20'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    {getStatusIcon(alert.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold">{alert.title}</h4>
                      <Badge className={cn(getSeverityColor(alert.severity), 'border-none text-xs')}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge className={cn(
                        alert.status === 'active' ? 'bg-red-500/10 text-red-500' :
                        alert.status === 'investigating' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-green-500/10 text-green-500',
                        'border-none text-xs'
                      )}>
                        {alert.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                  </div>
                  <div className="flex gap-2">
                    {alert.status === 'active' && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 text-xs">Investigate</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs">Block</Button>
                      </>
                    )}
                    {alert.status === 'investigating' && (
                      <Button size="sm" variant="outline" className="h-8 text-xs">Resolve</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* IP Whitelist / Blacklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>IP Blacklist</CardTitle>
            <CardDescription>Blocked IP addresses and ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {['192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.0/24'].map((ip) => (
                <div key={ip} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                  <code className="text-sm font-mono">{ip}</code>
                  <Button size="sm" variant="ghost" className="h-8 text-red-500">Remove</Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full font-bold">Add IP to Blacklist</Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Two-Factor Auth</CardTitle>
            <CardDescription>Admin account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold">2FA Status</p>
                <Badge className="bg-green-500/10 text-green-500 border-none">ENABLED</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">All admin accounts require 2FA authentication</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-sm">Backup Codes</p>
              <div className="p-3 bg-muted/30 rounded-lg border border-border font-mono text-xs space-y-1">
                <p>1234-5678-90AB</p>
                <p>CDEF-GHIJ-KLMN</p>
              </div>
            </div>
            <Button variant="outline" className="w-full font-bold">Regenerate Codes</Button>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Management */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>API Keys & Tokens</CardTitle>
          <CardDescription>Manage authentication credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Production API Key', created: '2024-01-15', lastUsed: '2 hours ago' },
              { name: 'Testing API Key', created: '2024-02-01', lastUsed: '1 day ago' },
              { name: 'Backup Key', created: '2024-01-01', lastUsed: 'Never' }
            ].map((key) => (
              <div key={key.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="font-bold">{key.name}</p>
                  <p className="text-xs text-muted-foreground">Created {key.created} • Used {key.lastUsed}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500">
                    <Lock className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4 font-bold">Create New API Key</Button>
        </CardContent>
      </Card>
    </div>
  );
};
