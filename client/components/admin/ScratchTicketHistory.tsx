import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { adminApiCall } from '@/lib/api';

interface Transaction {
  id: number;
  player_id: number;
  ticket_id: number;
  transaction_type: string;
  amount_sc: number;
  balance_before: number;
  balance_after: number;
  description: string;
  created_at: string;
  username?: string;
  player_name?: string;
  design_name?: string;
}

export const ScratchTicketHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'purchase' | 'claim'>('all');

  const pageSize = 50;

  useEffect(() => {
    fetchTransactions();
  }, [page, filterType]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
        ...(filterType !== 'all' && { type: filterType }),
      });

      const response = await adminApiCall<any>(
        `/admin/v2/scratch-tickets/transactions?${params}`
      );

      if (response.success) {
        setTransactions(response.data || []);
        setTotalTransactions(response.total || 0);
      } else {
        toast.error('Failed to load transactions');
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'claim':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return '🎫';
      case 'claim':
        return '🎉';
      default:
        return '📊';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Ticket Purchase';
      case 'claim':
        return 'Prize Claim';
      default:
        return 'Transaction';
    }
  };

  const totalPages = Math.ceil(totalTransactions / pageSize);

  const exportCSV = () => {
    const csv = [
      ['Date', 'Player', 'Type', 'Amount SC', 'Balance Before', 'Balance After', 'Description'].join(','),
      ...transactions.map(t =>
        [
          new Date(t.created_at).toLocaleString(),
          t.player_name || t.username || `Player ${t.player_id}`,
          getTransactionLabel(t.transaction_type),
          t.amount_sc,
          t.balance_before,
          t.balance_after,
          t.description,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scratch-tickets-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('CSV exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Scratch Ticket Transaction History</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View all player scratch ticket purchases and prize claims
        </p>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex gap-2">
              {(['all', 'purchase', 'claim'] as const).map(type => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  onClick={() => {
                    setFilterType(type);
                    setPage(1);
                  }}
                  size="sm"
                >
                  {type === 'all' ? '📊 All' : type === 'purchase' ? '🎫 Purchases' : '🎉 Claims'}
                </Button>
              ))}
            </div>
            <div className="flex-1"></div>
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={transactions.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {totalTransactions > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalTransactions)} of{' '}
              {totalTransactions} transactions
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <p>No transactions found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
                  <th className="px-4 py-3 text-left font-semibold">Player</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold">Balance Before</th>
                  <th className="px-4 py-3 text-right font-semibold">Balance After</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="border-t border-gray-200 dark:border-gray-700">
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-sm">
                          {transaction.player_name || transaction.username || `Player #${transaction.player_id}`}
                        </p>
                        <p className="text-xs text-gray-500">ID: {transaction.player_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                        {getTransactionIcon(transaction.transaction_type)} {getTransactionLabel(transaction.transaction_type)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={transaction.transaction_type === 'claim' ? 'text-green-600 font-bold' : 'text-red-600'}>
                        {transaction.transaction_type === 'claim' ? '+' : '-'}{transaction.amount_sc} SC
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {Number(transaction.balance_before).toFixed(2)} SC
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold">
                      {Number(transaction.balance_after).toFixed(2)} SC
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs">
                      <p className="truncate" title={transaction.description}>
                        {transaction.description}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && page > 3) {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
