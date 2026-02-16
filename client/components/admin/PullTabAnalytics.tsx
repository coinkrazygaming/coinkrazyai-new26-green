import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, Award, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { adminV2 } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PullTabStats {
  total_players: number;
  total_tickets_purchased: number;
  winning_tickets: number;
  win_percentage: number;
  total_prizes_awarded: number;
  total_sc_spent: number;
  avg_prize_amount: number;
}

interface Transaction {
  id: number;
  player_id: number;
  username: string;
  player_name: string;
  ticket_id: number;
  transaction_type: string;
  amount_sc: number;
  design_name: string;
  description: string;
  created_at: string;
}

interface PullTabResult {
  id: number;
  ticket_id: number;
  player_id: number;
  username: string;
  player_name: string;
  design_id: number;
  design_name: string;
  won: boolean;
  prize_amount: number;
  winning_tab_index: number;
  created_at: string;
}

export function PullTabAnalytics() {
  const [stats, setStats] = useState<PullTabStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [results, setResults] = useState<PullTabResult[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  useEffect(() => {
    loadStats();
    loadTransactions();
    loadResults();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await adminV2.pullTabs.getStats();
      if (response.success) {
        setStats(response.data);
      } else {
        toast.error('Failed to load statistics');
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const response = await adminV2.pullTabs.getTransactions(100);
      if (response.success) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const loadResults = async () => {
    try {
      setIsLoadingResults(true);
      const response = await adminV2.pullTabs.getResults(100);
      if (response.success) {
        setResults(response.data);
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setIsLoadingResults(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {isLoadingStats ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_players || 0}</div>
              <p className="text-xs text-gray-500">Who purchased tickets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tickets_purchased || 0}</div>
              <p className="text-xs text-gray-500">Tickets purchased</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.win_percentage ? Number(stats.win_percentage).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-gray-500">
                {stats.winning_tickets || 0} / {stats.total_tickets_purchased || 0} won
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total SC Distributed</CardTitle>
              <Award className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_prizes_awarded || 0}</div>
              <p className="text-xs text-gray-500">Prize distribution</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="results">Win/Loss Results</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All pull tab purchases and prize claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Player</th>
                        <th className="text-left py-2 px-2">Type</th>
                        <th className="text-left py-2 px-2">Design</th>
                        <th className="text-right py-2 px-2">Amount (SC)</th>
                        <th className="text-left py-2 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="py-2 px-2">
                            <div className="font-medium">{tx.player_name}</div>
                            <div className="text-xs text-gray-500">@{tx.username}</div>
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                tx.transaction_type === 'purchase'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {tx.transaction_type.charAt(0).toUpperCase() +
                                tx.transaction_type.slice(1)}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-600">{tx.design_name || 'N/A'}</td>
                          <td
                            className={`text-right py-2 px-2 font-medium ${
                              tx.transaction_type === 'purchase' ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {tx.transaction_type === 'purchase' ? '-' : '+'}
                            {tx.amount_sc}
                          </td>
                          <td className="py-2 px-2 text-gray-500 text-xs">
                            {new Date(tx.created_at).toLocaleDateString()} at{' '}
                            {new Date(tx.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Win/Loss Results</CardTitle>
              <CardDescription>
                Detailed breakdown of ticket outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingResults ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No results yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Player</th>
                        <th className="text-left py-2 px-2">Ticket</th>
                        <th className="text-left py-2 px-2">Design</th>
                        <th className="text-center py-2 px-2">Outcome</th>
                        <th className="text-right py-2 px-2">Prize</th>
                        <th className="text-left py-2 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map(result => (
                        <tr key={result.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="py-2 px-2">
                            <div className="font-medium">{result.player_name}</div>
                            <div className="text-xs text-gray-500">@{result.username}</div>
                          </td>
                          <td className="py-2 px-2 text-gray-600">#{result.ticket_id}</td>
                          <td className="py-2 px-2 text-gray-600">{result.design_name}</td>
                          <td className="text-center py-2 px-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                result.won
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {result.won ? '✓ Won' : '✗ Lost'}
                            </span>
                          </td>
                          <td
                            className={`text-right py-2 px-2 font-medium ${
                              result.won ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {result.prize_amount ? `+${result.prize_amount} SC` : '-'}
                          </td>
                          <td className="py-2 px-2 text-gray-500 text-xs">
                            {new Date(result.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
