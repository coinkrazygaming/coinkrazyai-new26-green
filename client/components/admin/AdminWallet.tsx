import React, { useEffect, useState } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, DollarSign, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: number;
  player_id: number;
  player_username: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  created_at: string;
  description: string;
}

const AdminWallet = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [totalGCCirculation, setTotalGCCirculation] = useState(0);
  const [totalSCCirculation, setTotalSCCirculation] = useState(0);
  const [filteredTrans, setFilteredTrans] = useState<Transaction[]>([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      // Fetch redemptions to understand overall circulation
      const redemptions = await adminV2.redemptions.list();
      const redeemList = Array.isArray(redemptions) ? redemptions : (redemptions?.data || []);

      // Calculate totals from transactions
      let totalGC = 0;
      let totalSC = 0;

      setTransactions([]);
      // In a real scenario, we'd fetch wallet data from an endpoint
      // For now, we'll let the user search by username
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayerTransactions = async (username: string) => {
    try {
      setIsLoading(true);
      const playerTrans = await adminV2.players.getTransactionsByUsername(username);
      const trans = Array.isArray(playerTrans) ? playerTrans : (playerTrans?.data || []);
      setFilteredTrans(trans);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
      setFilteredTrans([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUsername) {
      fetchPlayerTransactions(selectedUsername);
    } else {
      setFilteredTrans([]);
    }
  }, [selectedUsername]);

  const handleAddFunds = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const gc = parseFloat(formData.get('gcAmount') as string) || 0;
    const sc = parseFloat(formData.get('scAmount') as string) || 0;

    try {
      setIsLoading(true);
      await adminV2.players.updateBalanceByUsername(username, gc, sc, 'Admin fund addition');
      setTotalGCCirculation(totalGCCirculation + gc);
      setTotalSCCirculation(totalSCCirculation + sc);
      toast.success('Funds added successfully');
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add funds');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFunds = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const gc = parseFloat(formData.get('gcAmount') as string) || 0;
    const sc = parseFloat(formData.get('scAmount') as string) || 0;

    try {
      setIsLoading(true);
      await adminV2.players.updateBalanceByUsername(username, -gc, -sc, 'Admin fund removal');
      setTotalGCCirculation(totalGCCirculation - gc);
      setTotalSCCirculation(totalSCCirculation - sc);
      toast.success('Funds removed successfully');
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove funds');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total GC in Circulation</CardDescription>
            <Wallet className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{totalGCCirculation.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Gold Coins distributed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total SC in Circulation</CardDescription>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">{Number(totalSCCirculation).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Sweeps Coins distributed</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View and track wallet transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter username..."
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
            />
            <Button onClick={() => setSelectedUsername('')}>Clear</Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredTrans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Amount</th>
                    <th className="text-left py-2 px-2">Before</th>
                    <th className="text-left py-2 px-2">After</th>
                    <th className="text-left py-2 px-2">Description</th>
                    <th className="text-left py-2 px-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrans.map(tx => (
                    <tr key={tx.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-mono text-xs">{tx.type}</td>
                      <td className="py-3 px-2 font-mono">{Number(tx.amount ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-2 font-mono text-xs">{Number(tx.balance_before ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-2 font-mono text-xs">{Number(tx.balance_after ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-2 text-xs">{tx.description}</td>
                      <td className="py-3 px-2 text-xs">{tx.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              {selectedUsername ? 'No transactions found' : 'Enter a username to view transactions'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Wallet Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Operations</CardTitle>
          <CardDescription>Manage player wallet balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form onSubmit={handleAddFunds} className="p-4 border rounded-lg space-y-3">
              <h4 className="font-semibold">Add Funds</h4>
              <Input name="username" placeholder="Username" required />
              <Input name="gcAmount" placeholder="GC Amount" type="number" step="0.01" required />
              <Input name="scAmount" placeholder="SC Amount" type="number" step="0.01" required />
              <Button className="w-full" type="submit" disabled={isLoading}>{isLoading ? 'Processing...' : 'Add Funds'}</Button>
            </form>

            <form onSubmit={handleRemoveFunds} className="p-4 border rounded-lg space-y-3">
              <h4 className="font-semibold">Remove Funds</h4>
              <Input name="username" placeholder="Username" required />
              <Input name="gcAmount" placeholder="GC Amount" type="number" step="0.01" required />
              <Input name="scAmount" placeholder="SC Amount" type="number" step="0.01" required />
              <Button variant="destructive" className="w-full" type="submit" disabled={isLoading}>{isLoading ? 'Processing...' : 'Remove Funds'}</Button>
            </form>

            <form className="p-4 border rounded-lg space-y-3">
              <h4 className="font-semibold">Transfer Between Players</h4>
              <Input placeholder="From Username" required />
              <Input placeholder="To Username" required />
              <Input placeholder="Amount" type="number" required />
              <Button className="w-full" type="submit" onClick={() => toast.info('Transfer coming soon')}>Transfer</Button>
            </form>

            <form className="p-4 border rounded-lg space-y-3">
              <h4 className="font-semibold">Audit Trail</h4>
              <Input placeholder="Username (optional)" />
              <select className="w-full px-3 py-2 border rounded-md text-sm">
                <option>All Transactions</option>
                <option>Deposits</option>
                <option>Withdrawals</option>
                <option>Wins</option>
                <option>Losses</option>
              </select>
              <Button className="w-full" type="submit">Generate Report</Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWallet;
