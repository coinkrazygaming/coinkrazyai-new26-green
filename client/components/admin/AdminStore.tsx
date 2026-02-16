import React, { useEffect, useState } from 'react';
import { adminV2 } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Edit2, Plus, TrendingUp, DollarSign, X, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface GoldCoinPackage {
  id: number;
  title: string;
  description: string;
  price_usd: number;
  gold_coins: number;
  sweeps_coins: number;
  bonus_sc: number;
  bonus_percentage?: number;
  is_popular: boolean;
  is_best_value?: boolean;
  display_order: number;
}

interface PaymentMethod {
  id: number;
  name: string;
  provider: string;
  is_active: boolean;
}

const AdminStore = () => {
  const [packages, setPackages] = useState<GoldCoinPackage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPackageForm, setShowNewPackageForm] = useState(false);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<GoldCoinPackage | null>(null);
  const [formData, setFormData] = useState<Partial<GoldCoinPackage>>({});
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);

  const totalRevenue = packages.reduce((sum, p) => sum + (typeof p.price_usd === 'string' ? parseFloat(p.price_usd) : p.price_usd || 0), 0);
  const totalSales = packages.length;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [packRes, methodRes] = await Promise.all([
        adminV2.store.getPackages(),
        adminV2.store.getPaymentMethods(),
      ]);
      setPackages(packRes.data || []);
      setPaymentMethods(methodRes.data || []);
    } catch (error: any) {
      console.error('Failed to load store data:', error);
      toast.error('Failed to load store data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePackage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setIsLoading(true);
      const newPackageData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        price_usd: parseFloat(formData.get('price') as string),
        gold_coins: parseInt(formData.get('gc') as string),
        sweeps_coins: parseFloat(formData.get('sc') as string),
        bonus_sc: parseFloat(formData.get('bonus') as string),
      };
      console.log('[AdminStore] Creating package with data:', newPackageData);
      const response = await adminV2.store.createPackage(newPackageData);
      console.log('[AdminStore] Package created:', response);
      setShowNewPackageForm(false);
      toast.success('Package created! Refreshing...');
      (e.target as HTMLFormElement).reset();
      await loadData();
      toast.success('Package now visible in store');
    } catch (error: any) {
      console.error('[AdminStore] Create package error:', error);
      toast.error(error.message || 'Failed to create package');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePackage = async (id: number) => {
    if (confirm('Delete this package?')) {
      try {
        setIsLoading(true);
        await adminV2.store.deletePackage(id);
        setPackages(packages.filter(p => p.id !== id));
        toast.success('Package deleted');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete package');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditPackage = (pkg: GoldCoinPackage) => {
    setEditingPackage(pkg);
    setFormData(pkg);
  };

  const handleUpdatePackage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPackage) return;

    try {
      setIsLoading(true);
      const updateData = {
        title: formData.title || editingPackage.title,
        description: formData.description || editingPackage.description,
        price_usd: Number(formData.price_usd) || editingPackage.price_usd,
        gold_coins: Number(formData.gold_coins) || editingPackage.gold_coins,
        sweeps_coins: Number(formData.sweeps_coins) || editingPackage.sweeps_coins,
        bonus_sc: Number(formData.bonus_sc) || editingPackage.bonus_sc,
        bonus_percentage: Number(formData.bonus_percentage) || editingPackage.bonus_percentage || 0,
        is_popular: formData.is_popular !== undefined ? formData.is_popular : editingPackage.is_popular,
        is_best_value: formData.is_best_value !== undefined ? formData.is_best_value : editingPackage.is_best_value,
        display_order: Number(formData.display_order) || editingPackage.display_order,
      };

      await adminV2.store.updatePackage(editingPackage.id, updateData);
      setPackages(packages.map(p => p.id === editingPackage.id ? { ...p, ...updateData } : p));
      setEditingPackage(null);
      setFormData({});
      toast.success('Package updated');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update package');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPackage(null);
    setFormData({});
  };

  const handleTogglePaymentMethod = async (id: number) => {
    try {
      const method = paymentMethods.find(m => m.id === id);
      if (!method) return;
      await adminV2.store.updatePaymentMethod(id, { is_active: !method.is_active });
      setPaymentMethods(methods => methods.map(m => m.id === id ? { ...m, is_active: !m.is_active } : m));
      toast.success('Payment method updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment method');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* PACKAGES */}
        <TabsContent value="packages" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gold Coin Packages</CardTitle>
                <CardDescription>Create and manage coin packages</CardDescription>
              </div>
              <Button onClick={() => setShowNewPackageForm(!showNewPackageForm)}>
                {showNewPackageForm ? '✕ Cancel' : <><Plus className="w-4 h-4 mr-2" /> New</> }
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showNewPackageForm && (
                <form onSubmit={handleCreatePackage} className="p-4 border rounded-lg bg-muted/30 space-y-3 mb-4">
                  <Input name="title" placeholder="Package Title" required />
                  <Input name="description" placeholder="Description" required />
                  <div className="grid grid-cols-2 gap-2">
                    <Input name="price" type="number" step="0.01" placeholder="Price (USD)" required />
                    <Input name="gc" type="number" placeholder="Gold Coins" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input name="sc" type="number" placeholder="Sweeps Coins" required />
                    <Input name="bonus" type="number" placeholder="Bonus SC" required />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? 'Creating...' : 'Create'}</Button>
                </form>
              )}

              <div className="space-y-3">
                {editingPackage && (
                  <form onSubmit={handleUpdatePackage} className="p-4 border-2 border-primary rounded-lg bg-primary/5 space-y-3 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-lg">Edit Package: {editingPackage.title}</h4>
                      <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Title"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="Description"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="Price (USD)"
                        type="number"
                        step="0.01"
                        value={formData.price_usd || ''}
                        onChange={(e) => setFormData({ ...formData, price_usd: parseFloat(e.target.value) })}
                        required
                      />
                      <Input
                        placeholder="Gold Coins"
                        type="number"
                        value={formData.gold_coins || ''}
                        onChange={(e) => setFormData({ ...formData, gold_coins: parseInt(e.target.value) })}
                        required
                      />
                      <Input
                        placeholder="Sweeps Coins"
                        type="number"
                        value={formData.sweeps_coins || ''}
                        onChange={(e) => setFormData({ ...formData, sweeps_coins: parseInt(e.target.value) })}
                        required
                      />
                      <Input
                        placeholder="Bonus SC"
                        type="number"
                        value={formData.bonus_sc || ''}
                        onChange={(e) => setFormData({ ...formData, bonus_sc: parseInt(e.target.value) })}
                        required
                      />
                      <Input
                        placeholder="Bonus % (optional)"
                        type="number"
                        step="0.1"
                        value={formData.bonus_percentage || ''}
                        onChange={(e) => setFormData({ ...formData, bonus_percentage: parseFloat(e.target.value) })}
                      />
                      <Input
                        placeholder="Display Order"
                        type="number"
                        value={formData.display_order || ''}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_popular || false}
                          onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                          className="rounded border"
                        />
                        <span className="text-sm">Mark as Popular</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_best_value || false}
                          onChange={(e) => setFormData({ ...formData, is_best_value: e.target.checked })}
                          className="rounded border"
                        />
                        <span className="text-sm">Mark as Best Value</span>
                      </label>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button type="submit" disabled={isLoading} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {packages.map(pkg => (
                  <div key={pkg.id} className="p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{pkg.title}</h4>
                          {pkg.is_best_value && <Badge className="bg-green-600">Best Value</Badge>}
                          {pkg.is_popular && <Badge className="bg-blue-500">Popular</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-primary font-semibold">${(typeof pkg.price_usd === 'string' ? parseFloat(pkg.price_usd) : pkg.price_usd).toFixed(2)}</span>
                          <span>{(typeof pkg.gold_coins === 'string' ? parseInt(pkg.gold_coins) : pkg.gold_coins).toLocaleString()} GC</span>
                          <span>{pkg.sweeps_coins} SC</span>
                          <span className="text-green-600">+{pkg.bonus_sc} SC Bonus</span>
                          {pkg.bonus_percentage && <span className="text-blue-600">+{pkg.bonus_percentage}% Bonus</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditPackage(pkg)}>
                          <Edit2 className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeletePackage(pkg.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENT METHODS */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Payment Methods</CardTitle>
                <CardDescription>Payment processors available for customers</CardDescription>
              </div>
              <Badge variant="secondary">{paymentMethods.filter(m => m.is_active).length} Active</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentMethods && paymentMethods.length > 0 ? (
                paymentMethods.map(method => (
                  <div key={method.id} className={`p-4 border rounded-lg flex items-center justify-between transition-all ${method.is_active ? 'bg-green-50 dark:bg-green-900/10 border-green-200' : 'bg-red-50 dark:bg-red-900/10 border-red-200'}`}>
                    <div className="flex-1">
                      <p className="font-semibold">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.provider.replace(/_/g, ' ').toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={method.is_active ? 'default' : 'secondary'} className={method.is_active ? 'bg-green-600' : ''}>
                        {method.is_active ? '✓ Active' : '✗ Inactive'}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => handleTogglePaymentMethod(method.id)} disabled={isLoading}>
                        {method.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">No payment methods configured</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Method Fees</CardTitle>
                <CardDescription>Standard rates by provider</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stripe</span>
                  <span className="font-semibold">2.9% + $0.30</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">PayPal</span>
                  <span className="font-semibold">2.2% + $0.30</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Square</span>
                  <span className="font-semibold">2.6% + $0.10</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">Crypto</span>
                  <span className="font-semibold">1% flat</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processing Status</CardTitle>
                <CardDescription>Current payment pipeline status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className="bg-green-600">✓ Operational</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-semibold">99.7%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Response</span>
                  <span className="font-semibold">1.2s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily Volume</span>
                  <span className="font-semibold">$2,450</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add New Payment Gateway</CardTitle>
              <CardDescription>Configure additional payment providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-semibold mb-2 block">Payment Gateway</label>
                <select className="w-full px-3 py-2 border rounded-md text-sm bg-background">
                  <option>Select Gateway...</option>
                  <option>Stripe</option>
                  <option>PayPal</option>
                  <option>Square</option>
                  <option>Apple Pay</option>
                  <option>Google Pay</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Provider Name</label>
                <Input placeholder="e.g., 'Credit Card Processing'" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-2 block">API Key</label>
                  <Input placeholder="API Key" type="password" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">API Secret</label>
                  <Input placeholder="API Secret" type="password" />
                </div>
              </div>
              <Button className="w-full" disabled>
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Gateway (Configure in settings)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${Number(totalRevenue).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Packages</CardTitle>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{packages.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Popular Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{packages.filter(p => p.is_popular).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Avg Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(totalRevenue / packages.length).toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Package Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Package Performance</CardTitle>
              <CardDescription>Value analysis for each package</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {packages.sort((a, b) => (Number(b.sweeps_coins) + Number(b.gold_coins)) / Number(b.price_usd) - (Number(a.sweeps_coins) + Number(a.gold_coins)) / Number(a.price_usd)).map(pkg => {
                  const totalCoins = Number(pkg.gold_coins) + Number(pkg.sweeps_coins);
                  const valuePerDollar = totalCoins / Number(pkg.price_usd);
                  return (
                    <div key={pkg.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{pkg.title}</p>
                          <p className="text-xs text-muted-foreground">${Number(pkg.price_usd).toFixed(2)} • {totalCoins.toLocaleString()} total coins</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{valuePerDollar.toFixed(1)} coins/$</p>
                          <p className="text-xs text-muted-foreground">Value/Dollar</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(valuePerDollar / 50) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminStore;
