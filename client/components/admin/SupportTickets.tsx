import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle } from 'lucide-react';

export const SupportTickets = () => {
  const [tickets] = useState([
    { id: 'TK-001', player: 'John Doe', subject: 'Withdrawal not received', priority: 'high', status: 'Open', created: '2h ago' },
    { id: 'TK-002', player: 'Jane Smith', subject: 'Bonus not credited', priority: 'medium', status: 'In Progress', created: '4h ago' },
    { id: 'TK-003', player: 'Mike Johnson', subject: 'Account locked', priority: 'high', status: 'Open', created: '6h ago' },
    { id: 'TK-004', player: 'Sarah Wilson', subject: 'Payment method issue', priority: 'low', status: 'Resolved', created: '1d ago' }
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border"><CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Open Tickets</p>
            <p className="text-3xl font-black">8</p>
            <p className="text-xs text-orange-500 mt-2">2 Urgent</p>
          </CardContent>
        </Card>
        <Card className="border-border"><CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Avg Response</p>
            <p className="text-3xl font-black">12min</p>
            <p className="text-xs text-green-500 mt-2">Fast</p>
          </CardContent>
        </Card>
        <Card className="border-border"><CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Resolved (24h)</p>
            <p className="text-3xl font-black">24</p>
            <p className="text-xs text-blue-500 mt-2">95% satisfaction</p>
          </CardContent>
        </Card>
        <Card className="border-border"><CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Escalations</p>
            <p className="text-3xl font-black">2</p>
            <p className="text-xs text-red-500 mt-2">This week</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Support Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.filter(t => t.status !== 'Resolved').map((ticket) => (
            <div key={ticket.id} className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{ticket.id}: {ticket.subject}</p>
                    <Badge className={ticket.priority === 'high' ? 'bg-red-500/10 text-red-500' : ticket.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'} style={{borderStyle: 'none'}}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ticket.player} • {ticket.created}</p>
                </div>
                <Badge className={ticket.status === 'Open' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'} style={{borderStyle: 'none'}}>
                  {ticket.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8">Reply</Button>
                <Button size="sm" variant="outline" className="h-8">Assign</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Recent Resolutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tickets.filter(t => t.status === 'Resolved').map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm font-bold">{ticket.id}: {ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">{ticket.player}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-6">View</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
