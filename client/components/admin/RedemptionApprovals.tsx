import React, { useState, useEffect } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RedemptionRequest {
  id: number;
  playerId: number;
  playerName: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  reason?: string;
}

export const RedemptionApprovals = () => {
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRedemptions();
  }, []);

  const loadRedemptions = async () => {
    try {
      setIsLoading(true);
      const [pending, approved, rejected] = await Promise.all([
        adminV2.redemptions.list('pending').catch(() => ({ data: [] })),
        adminV2.redemptions.list('approved').catch(() => ({ data: [] })),
        adminV2.redemptions.list('rejected').catch(() => ({ data: [] })),
      ]);

      const allRequests = [
        ...(Array.isArray(pending) ? pending : (pending?.data || [])),
        ...(Array.isArray(approved) ? approved : (approved?.data || [])),
        ...(Array.isArray(rejected) ? rejected : (rejected?.data || [])),
      ];

      setRequests(allRequests);
    } catch (error: any) {
      console.error('Failed to load redemptions:', error);
      toast.error('Failed to load redemptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    const notes = prompt('Add approval notes (optional):');
    try {
      setIsProcessing(true);
      await adminV2.redemptions.approve(requestId, notes || '');
      toast.success('Redemption approved');
      loadRedemptions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve redemption');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: number) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      setIsProcessing(true);
      await adminV2.redemptions.reject(requestId, reason);
      toast.success('Redemption rejected');
      loadRedemptions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject redemption');
    } finally {
      setIsProcessing(false);
    }
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    pendingAmount: requests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0),
    approved24h: requests.filter(r => r.status === 'approved').length,
    approvedAmount: requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0),
    rejected24h: requests.filter(r => r.status === 'rejected').length,
    rejectedAmount: requests
      .filter(r => r.status === 'rejected')
      .reduce((sum, r) => sum + r.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Pending</p>
            <p className="text-3xl font-black">{stats.pending}</p>
            <p className="text-xs text-orange-500 mt-2">${Number(stats.pendingAmount).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Approved</p>
            <p className="text-3xl font-black">{stats.approved24h}</p>
            <p className="text-xs text-green-500 mt-2">${Number(stats.approvedAmount).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Rejected</p>
            <p className="text-3xl font-black">{stats.rejected24h}</p>
            <p className="text-xs text-red-500 mt-2">${Number(stats.rejectedAmount).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground uppercase font-bold">Avg Processing</p>
            <p className="text-3xl font-black">4.2h</p>
            <p className="text-xs text-blue-500 mt-2">Time to approve</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
          <CardDescription>{stats.pending} requests waiting for approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : requests
            .filter(r => r.status === 'pending')
            .length > 0 ? (
            requests
              .filter(r => r.status === 'pending')
              .map((request) => (
                <div key={request.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold">{request.playerName}</p>
                      <p className="text-sm text-muted-foreground">{request.method} • {request.createdAt}</p>
                    </div>
                    <p className="font-black text-lg">${Number(request.amount).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="h-8 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
                      onClick={() => handleApprove(request.id)}
                      disabled={isProcessing}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 text-red-500 hover:bg-red-500/20"
                      onClick={() => handleReject(request.id)}
                      disabled={isProcessing}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center py-8 text-muted-foreground">No pending withdrawals</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Processing Queue</CardTitle>
          <CardDescription>Requests under review</CardDescription>
        </CardHeader>
        <CardContent>
          {requests
            .filter(r => r.status === 'processing')
            .length > 0 ? (
            <div className="space-y-2">
              {requests
                .filter(r => r.status === 'processing')
                .map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
                    <div>
                      <p className="font-bold text-sm">{request.playerName}</p>
                      <p className="text-xs text-muted-foreground">{request.method} • {request.createdAt}</p>
                    </div>
                    <p className="font-black">${Number(request.amount).toFixed(2)}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No requests in processing queue</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Payout Methods</CardTitle>
          <CardDescription>Available withdrawal methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { method: 'Bank Transfer', daily: '$50K', fee: '2.5%', time: '1-2 days' },
            { method: 'Credit Card', daily: '$10K', fee: '3.5%', time: '1-3 days' },
            { method: 'Crypto', daily: '$100K', fee: '1.0%', time: '30 min' },
            { method: 'E-Wallet', daily: '$25K', fee: '1.5%', time: '2-4 hours' },
          ].map((payout) => (
            <div key={payout.method} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
              <div>
                <p className="font-bold text-sm">{payout.method}</p>
                <p className="text-xs text-muted-foreground">Daily: {payout.daily} • Fee: {payout.fee}</p>
              </div>
              <p className="text-xs font-bold">{payout.time}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
