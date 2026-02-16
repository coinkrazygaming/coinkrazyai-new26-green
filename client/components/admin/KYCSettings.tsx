import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Eye, Download } from 'lucide-react';

export const KYCSettings = () => {
  const [kycVerifications, setKycVerifications] = useState([
    {
      id: 1,
      player: 'John Doe',
      email: 'john@example.com',
      status: 'Verified',
      verifiedDate: '2024-01-15',
      level: 'Full',
      documents: ['ID', 'Proof of Address', 'Source of Funds']
    },
    {
      id: 2,
      player: 'Jane Smith',
      email: 'jane@example.com',
      status: 'Pending Review',
      verifiedDate: 'N/A',
      level: 'Basic',
      documents: ['ID Submitted']
    },
    {
      id: 3,
      player: 'Mike Johnson',
      email: 'mike@example.com',
      status: 'Rejected',
      verifiedDate: 'N/A',
      level: 'None',
      documents: ['ID (Rejected)']
    },
    {
      id: 4,
      player: 'Sarah Wilson',
      email: 'sarah@example.com',
      status: 'Verified',
      verifiedDate: '2024-02-01',
      level: 'Full',
      documents: ['ID', 'Proof of Address']
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'bg-green-500/10 text-green-500';
      case 'Pending Review': return 'bg-yellow-500/10 text-yellow-500';
      case 'Rejected': return 'bg-red-500/10 text-red-500';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified': return <CheckCircle2 className="w-4 h-4" />;
      case 'Pending Review': return <Clock className="w-4 h-4" />;
      case 'Rejected': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* KYC Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase font-bold">Verified Players</p>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-black">1,284</p>
            <p className="text-xs text-green-500 mt-2">84% of total</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase font-bold">Pending Review</p>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-black">187</p>
            <p className="text-xs text-yellow-500 mt-2">Avg 2 day wait</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase font-bold">Rejected</p>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-black">56</p>
            <p className="text-xs text-red-500 mt-2">Resubmit required</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase font-bold">Avg Time</p>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black">1.8d</p>
            <p className="text-xs text-blue-500 mt-2">To complete</p>
          </CardContent>
        </Card>
      </div>

      {/* KYC Verification Queue */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Verification Queue</CardTitle>
          <CardDescription>Review and manage KYC submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Player</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Level</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Documents</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-bold uppercase text-xs text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycVerifications.map((kyc) => (
                  <tr key={kyc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div>
                        <p className="font-bold">{kyc.player}</p>
                        <p className="text-xs text-muted-foreground">{kyc.email}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(kyc.status)}
                        <Badge className={cn(getStatusColor(kyc.status), 'border-none')}>
                          {kyc.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={kyc.level === 'Full' ? 'bg-primary/10 text-primary' : 'bg-muted'} style={{borderStyle: 'none'}}>
                        {kyc.level}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {kyc.documents.map((doc) => (
                          <Badge key={doc} className="bg-muted/50 border-none text-xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{kyc.verifiedDate}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {kyc.status === 'Pending Review' && (
                          <>
                            <Button size="sm" variant="outline" className="h-8 text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* KYC Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Verification Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { level: 'Basic', requirements: ['Valid ID'] },
              { level: 'Intermediate', requirements: ['ID', 'Proof of Address'] },
              { level: 'Full', requirements: ['ID', 'Proof of Address', 'Source of Funds'] }
            ].map((level) => (
              <div key={level.level} className="p-3 bg-muted/30 rounded-lg border border-border">
                <p className="font-bold">{level.level} KYC</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  {level.requirements.map((req) => (
                    <li key={req} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Verification Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
              <p className="font-bold text-sm">Deposit Limits</p>
              <p className="text-sm text-muted-foreground">
                Players require Full KYC for deposits over $5,000
              </p>
            </div>
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
              <p className="font-bold text-sm">Auto-Verification</p>
              <p className="text-sm text-muted-foreground">
                Enable automatic ID verification using AI
              </p>
              <Button size="sm" variant="outline" className="mt-2">Configure</Button>
            </div>
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
              <p className="font-bold text-sm">Rejection Reasons</p>
              <select className="w-full px-2 py-1 text-sm rounded border border-border bg-background mt-2">
                <option>Expired Document</option>
                <option>Poor Quality</option>
                <option>Incomplete</option>
                <option>Mismatch</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
