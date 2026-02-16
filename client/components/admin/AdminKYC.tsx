import React, { useEffect, useState } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface KYCDocument {
  id: number;
  player_id: number;
  player_username: string;
  document_type: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  verified_at?: string;
  notes?: string;
}

const AdminKYC = () => {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchKYCDocuments();
  }, []);

  const fetchKYCDocuments = async () => {
    try {
      setIsLoading(true);
      // Since the API doesn't have a direct get KYC list endpoint,
      // we'll fetch it through the players endpoint with kyc filter
      const pending = await adminV2.players.list(1, 100, '', '', 'Basic').catch(() => ({ data: { players: [] } }));
      const pendingPlayers = Array.isArray(pending) ? pending : (pending?.data?.players || []);
      
      // Map player data to KYC documents
      const docs: KYCDocument[] = pendingPlayers
        .filter((p: any) => p.kyc_level === 'Basic')
        .map((p: any, idx: number) => ({
          id: idx + 1,
          player_id: p.id,
          player_username: p.username,
          document_type: 'ID Verification',
          status: 'pending' as const,
          created_at: p.created_at,
        }));

      setDocuments(docs);
    } catch (error: any) {
      console.error('Failed to fetch KYC documents:', error);
      toast.error('Failed to load KYC documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (documentId: number) => {
    const notes = prompt('Add approval notes (optional):');
    const doc = documents.find(d => d.id === documentId);
    if (!doc) return;

    try {
      setIsLoading(true);
      await adminV2.kyc.approve(doc.id, notes || '');
      setDocuments(docs =>
        docs.map(d =>
          d.id === documentId
            ? {
              ...d,
              status: 'verified',
              verified_at: new Date().toISOString().split('T')[0],
              notes: notes || '',
            }
            : d
        )
      );
      toast.success('KYC document approved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve KYC');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (documentId: number) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    const doc = documents.find(d => d.id === documentId);
    if (!doc) return;

    try {
      setIsLoading(true);
      await adminV2.kyc.reject(doc.id, reason);
      setDocuments(docs =>
        docs.map(d => (d.id === documentId ? { ...d, status: 'rejected', notes: reason } : d))
      );
      toast.success('KYC document rejected');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject KYC');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocs =
    statusFilter === 'all'
      ? documents
      : documents.filter((doc) => doc.status === statusFilter);

  const stats = {
    pending: documents.filter((d) => d.status === 'pending').length,
    verified: documents.filter((d) => d.status === 'verified').length,
    rejected: documents.filter((d) => d.status === 'rejected').length,
    total: documents.length,
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Verified</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Rejected</CardTitle>
            <XCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Management</CardTitle>
          <CardDescription>
            Review and manage Know Your Customer verification documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'verified', 'rejected'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status === 'pending' && <Clock className="w-4 h-4 mr-2" />}
                {status === 'verified' && <CheckCircle className="w-4 h-4 mr-2" />}
                {status === 'rejected' && <XCircle className="w-4 h-4 mr-2" />}
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Documents</CardTitle>
          <CardDescription>
            Showing {statusFilter} documents ({filteredDocs.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredDocs.length > 0 ? (
            <div className="space-y-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{doc.player_username}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.document_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {doc.created_at}
                    </p>
                    {doc.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Notes: {doc.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        doc.status === 'verified'
                          ? 'default'
                          : doc.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {doc.status}
                    </Badge>
                    {doc.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(doc.id)}
                          disabled={isLoading}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(doc.id)}
                          disabled={isLoading}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No {statusFilter} KYC documents found
            </p>
          )}
        </CardContent>
      </Card>

      {/* KYC Settings */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Requirements</CardTitle>
          <CardDescription>
            Configure KYC verification requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="font-semibold text-sm">Require ID Verification</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Players must verify identity before withdrawals
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="font-semibold text-sm">
                  Require Address Verification
                </span>
              </label>
              <p className="text-xs text-muted-foreground">
                Players must verify address for large withdrawals
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="font-semibold text-sm">Phone Verification</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Require phone number verification
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="font-semibold text-sm">Email Confirmation</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Require email confirmation before gameplay
              </p>
            </div>
          </div>
          <Button className="w-full">Save KYC Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminKYC;
