import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const FraudDetection = () => {
  const [alerts] = useState([
    { id: 1, type: 'Account Takeover', risk: 'high', player: 'user_1234', reason: 'Login from new IP + location change', status: 'Investigating' },
    { id: 2, type: 'Bonus Abuse', risk: 'medium', player: 'newuser_567', reason: 'Multiple accounts, same payment', status: 'Reviewing' },
    { id: 3, type: 'Collusion', risk: 'high', player: 'poker_player', reason: 'Unusual win pattern with other player', status: 'Active' },
    { id: 4, type: 'Bot Activity', risk: 'medium', player: 'slots_bot', reason: 'Mechanical betting pattern detected', status: 'Blocked' }
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Alerts (30d)</p>
            <p className="text-3xl font-black">127</p>
            <p className="text-xs text-orange-500 mt-2">12 High Risk</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Confirmed Fraud</p>
            <p className="text-3xl font-black">8</p>
            <p className="text-xs text-red-500 mt-2">Accounts suspended</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">False Positives</p>
            <p className="text-3xl font-black">3%</p>
            <p className="text-xs text-blue-500 mt-2">Very low</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Prevented Loss</p>
            <p className="text-3xl font-black">$45K</p>
            <p className="text-xs text-green-500 mt-2">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Active Fraud Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${alert.risk === 'high' ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${alert.risk === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                    <p className="font-bold">{alert.type}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Player: {alert.player}</p>
                  <p className="text-sm text-muted-foreground">{alert.reason}</p>
                </div>
                <div className="text-right">
                  <Badge className={alert.risk === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'} style={{borderStyle: 'none'}}>
                    {alert.risk.toUpperCase()}
                  </Badge>
                  <p className="text-xs font-bold mt-1">{alert.status}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs">Review</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">Ban</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Fraud Rules Engine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {['Same IP multiple accounts', 'Unusual win pattern', 'Bonus abuse pattern', 'Collusion detection', 'Bot behavior pattern'].map((rule) => (
            <div key={rule} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
              <p className="font-bold text-sm">{rule}</p>
              <Badge className="bg-green-500/10 text-green-500 border-none">Active</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
