import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Users } from 'lucide-react';

// Banking & Payments
export const BankingPayments = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Banking & Payments</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-muted/30 rounded text-center"><p className="font-black text-2xl">$2.5M</p><p className="text-xs text-muted-foreground">Daily Volume</p></div>
        <div className="p-4 bg-muted/30 rounded text-center"><p className="font-black text-2xl">12</p><p className="text-xs text-muted-foreground">Payment Methods</p></div>
        <div className="p-4 bg-muted/30 rounded text-center"><p className="font-black text-2xl">99.8%</p><p className="text-xs text-muted-foreground">Success Rate</p></div>
      </div>
      <Button className="w-full">Configure Payment Methods</Button>
    </CardContent>
  </Card>
);

// Game Ingestion
export const GameIngestion = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Game Ingestion</CardTitle><CardDescription>Import games from providers</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      {['Playtech', 'Microgaming', 'NetEnt'].map(p => (
        <div key={p} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
          <p className="font-bold">{p}</p>
          <Button size="sm" variant="outline" className="h-8">Connect</Button>
        </div>
      ))}
    </CardContent>
  </Card>
);

// AI Game Builder
export const AIGameBuilder = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>AI Game Builder</CardTitle><CardDescription>Create new games with AI</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Generate new game concepts, mechanics, and configurations using AI.</p>
      <Button className="font-bold"><Plus className="w-4 h-4 mr-2" />Create New Game</Button>
    </CardContent>
  </Card>
);

// Content Management
export const ContentManagement = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Content Management</CardTitle><CardDescription>Manage website and game content</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      {['Homepage', 'Game Descriptions', 'Banners', 'Help Pages'].map(item => (
        <div key={item} className="flex items-center justify-between p-3 bg-muted/30 rounded">
          <p className="font-bold text-sm">{item}</p>
          <Button size="sm" variant="outline" className="h-8">Edit</Button>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Casino Settings
export const CasinoSettings = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Casino Settings</CardTitle><CardDescription>Global casino configuration</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      {['Min Bet', 'Max Bet', 'House Edge', 'Game Speed'].map(setting => (
        <div key={setting} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
          <p className="font-bold text-sm">{setting}</p>
          <input className="h-8 w-24 rounded border border-border px-2" defaultValue="1.0" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// Social Management
export const SocialManagement = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Social Management</CardTitle><CardDescription>Social features and chat</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted/30 rounded text-center"><p className="font-black text-2xl">1.2K</p><p className="text-xs text-muted-foreground">Active Users</p></div>
        <div className="p-4 bg-muted/30 rounded text-center"><p className="font-black text-2xl">245</p><p className="text-xs text-muted-foreground">Messages/min</p></div>
      </div>
      <Button className="w-full" variant="outline">Manage Chat Rooms</Button>
    </CardContent>
  </Card>
);

// Player Retention
export const PlayerRetention = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Player Retention</CardTitle><CardDescription>Retention strategies and campaigns</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      {['Win-Back Campaign', 'Loyalty Rewards', 'Personal Offers'].map(strategy => (
        <div key={strategy} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
          <p className="font-bold text-sm">{strategy}</p>
          <button className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground">Enable</button>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Affiliate Management
export const AffiliateManagement = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Affiliate Management</CardTitle><CardDescription>Affiliate programs and payouts</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted/30 rounded text-center"><p className="font-black text-2xl">342</p><p className="text-xs text-muted-foreground">Affiliates</p></div>
        <div className="p-4 bg-muted/30 rounded text-center"><p className="font-black text-2xl">$125K</p><p className="text-xs text-muted-foreground">Paid Out</p></div>
      </div>
    </CardContent>
  </Card>
);

// System Logs
export const SystemLogs = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>System Logs</CardTitle><CardDescription>System activity audit log</CardDescription></CardHeader>
    <CardContent className="space-y-2">
      {['Admin login attempt', 'Game configuration updated', 'Player account suspended', 'Payment processed'].map((log, i) => (
        <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border text-xs">
          <p>{log}</p>
          <p className="text-muted-foreground">{2 - i}h ago</p>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Database Backups
export const DatabaseBackups = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Database & Backups</CardTitle><CardDescription>Database management and backups</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted/30 rounded"><p className="text-xs text-muted-foreground">Size</p><p className="font-black text-xl">2.4GB</p></div>
        <div className="p-4 bg-muted/30 rounded"><p className="text-xs text-muted-foreground">Last Backup</p><p className="font-black">1h ago</p></div>
      </div>
      <Button className="w-full" variant="outline">Create Backup Now</Button>
    </CardContent>
  </Card>
);

// Performance Monitoring
export const PerformanceMonitoring = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Performance Monitoring</CardTitle><CardDescription>System performance metrics</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      {[['CPU', '24%'], ['Memory', '58%'], ['Disk', '35%']].map(([metric, val]) => (
        <div key={metric}>
          <div className="flex justify-between mb-1"><p className="text-sm font-bold">{metric}</p><p className="text-sm font-bold">{val}</p></div>
          <div className="w-full h-2 bg-muted rounded"><div className="h-2 bg-primary rounded" style={{width: val}}></div></div>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Notifications
export const NotificationSettings = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Notification Settings</CardTitle><CardDescription>Configure notifications</CardDescription></CardHeader>
    <CardContent className="space-y-2">
      {['Email Notifications', 'SMS Alerts', 'Push Notifications', 'In-Game Messages'].map(notif => (
        <div key={notif} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
          <p className="font-bold text-sm">{notif}</p>
          <input type="checkbox" defaultChecked className="w-4 h-4" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// Compliance
export const ComplianceManagement = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Compliance</CardTitle><CardDescription>Regulatory compliance management</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-500/10 rounded text-center"><p className="font-black text-lg text-green-500">✓</p><p className="text-xs mt-2">GDPR Compliant</p></div>
        <div className="p-4 bg-green-500/10 rounded text-center"><p className="font-black text-lg text-green-500">✓</p><p className="text-xs mt-2">Licenses Valid</p></div>
      </div>
    </CardContent>
  </Card>
);

// Advanced Settings
export const AdvancedSettings = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Advanced Settings</CardTitle><CardDescription>Advanced system configuration</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">Socket Timeout</p>
          <input className="h-8 w-20 rounded border border-border px-2" defaultValue="30" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">Cache TTL</p>
          <input className="h-8 w-20 rounded border border-border px-2" defaultValue="3600" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Caller Management (extracted from Bingo)
export const CallerManagement = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Caller Management</CardTitle><CardDescription>Configure bingo callers</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      {['Lucy - AI', 'Charlie - AI', 'Marina - AI'].map(caller => (
        <div key={caller} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
          <p className="font-bold text-sm">{caller}</p>
          <Button size="sm" variant="outline" className="h-8">Manage</Button>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Sports Settings
export const SportsSettings = () => (
  <Card className="border-border">
    <CardHeader><CardTitle>Sports Settings</CardTitle><CardDescription>Sports betting configuration</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      {['Min Odds', 'Max Odds', 'Bet Limits', 'Margin'].map(setting => (
        <div key={setting} className="flex items-center justify-between p-3 bg-muted/30 rounded">
          <p className="text-sm font-bold">{setting}</p>
          <input className="h-8 w-24 rounded border border-border px-2" defaultValue="1.0" />
        </div>
      ))}
    </CardContent>
  </Card>
);
