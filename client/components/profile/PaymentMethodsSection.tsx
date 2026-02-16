import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  DollarSign,
  CreditCard,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

interface PaymentMethod {
  id: number;
  method_type: 'bank' | 'paypal' | 'cashapp';
  is_primary: boolean;
  bank_name?: string;
  account_type?: string;
  paypal_email?: string;
  cashapp_handle?: string;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
}

const MIN_REDEMPTION_SC = 100;
const MIN_REDEMPTION_USD = 5;

export function PaymentMethodsSection() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [methodType, setMethodType] = useState<'bank' | 'paypal' | 'cashapp'>('paypal');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall<any>('/payment-methods');
      setMethods(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const payload: Record<string, any> = {
        method_type: methodType,
        is_primary: methods.length === 0, // Auto-set as primary if first method
      };

      if (methodType === 'bank') {
        payload.bank_account_holder = formData.account_holder;
        payload.bank_name = formData.bank_name;
        payload.account_number = formData.account_number;
        payload.routing_number = formData.routing_number;
        payload.account_type = formData.account_type;
      } else if (methodType === 'paypal') {
        payload.paypal_email = formData.paypal_email;
      } else if (methodType === 'cashapp') {
        payload.cashapp_handle = formData.cashapp_handle;
      }

      const response = await apiCall<any>('/payment-methods/add', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Payment method added successfully');
      setMethods([...methods, response.data]);
      setShowAddForm(false);
      setFormData({});
    } catch (error: any) {
      toast.error(error.message || 'Failed to add payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      await apiCall(`/payment-methods/${methodId}`, {
        method: 'DELETE',
      });

      setMethods(methods.filter(m => m.id !== methodId));
      toast.success('Payment method deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete payment method');
    }
  };

  const handleSetPrimary = async (methodId: number) => {
    try {
      await apiCall(`/payment-methods/${methodId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_primary: true }),
      });

      setMethods(
        methods.map(m => ({
          ...m,
          is_primary: m.id === methodId,
        }))
      );

      toast.success('Primary payment method updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment method');
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <DollarSign className="w-5 h-5" />;
      case 'paypal':
        return <CreditCard className="w-5 h-5" />;
      case 'cashapp':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getMethodLabel = (type: string) => {
    switch (type) {
      case 'bank':
        return 'Bank Account';
      case 'paypal':
        return 'PayPal';
      case 'cashapp':
        return 'Cash App';
      default:
        return type;
    }
  };

  const getMethodDisplay = (method: PaymentMethod) => {
    switch (method.method_type) {
      case 'bank':
        return `${method.bank_name} • ${method.account_type}`;
      case 'paypal':
        return method.paypal_email || 'PayPal Account';
      case 'cashapp':
        return method.cashapp_handle || 'Cash App';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Payment Methods</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Save payment methods for redemption (minimum ${MIN_REDEMPTION_USD} / {MIN_REDEMPTION_SC} SC)
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Add Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              {/* Method Type Selection */}
              <div>
                <label className="text-sm font-semibold mb-3 block">Payment Method Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['bank', 'paypal', 'cashapp'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMethodType(type)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        methodType === type
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        {getMethodIcon(type)}
                      </div>
                      <p className="text-xs font-semibold">{getMethodLabel(type)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Fields */}
              {methodType === 'bank' && (
                <>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Account Holder Name</label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={formData.account_holder || ''}
                      onChange={e => setFormData({ ...formData, account_holder: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Bank Name</label>
                    <Input
                      type="text"
                      placeholder="Chase, Bank of America, etc"
                      value={formData.bank_name || ''}
                      onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Account Number (Encrypted)</label>
                    <Input
                      type="password"
                      placeholder="•••••••••••••••••"
                      value={formData.account_number || ''}
                      onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Routing Number (Encrypted)</label>
                    <Input
                      type="password"
                      placeholder="•••••••••"
                      value={formData.routing_number || ''}
                      onChange={e => setFormData({ ...formData, routing_number: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Account Type</label>
                    <select
                      value={formData.account_type || ''}
                      onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      required
                    >
                      <option value="">Select</option>
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>
                </>
              )}

              {methodType === 'paypal' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">PayPal Email</label>
                  <Input
                    type="email"
                    placeholder="your@paypal.email"
                    value={formData.paypal_email || ''}
                    onChange={e => setFormData({ ...formData, paypal_email: e.target.value })}
                    required
                  />
                </div>
              )}

              {methodType === 'cashapp' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Cash App Handle</label>
                  <Input
                    type="text"
                    placeholder="$handle"
                    value={formData.cashapp_handle || ''}
                    onChange={e => setFormData({ ...formData, cashapp_handle: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Info Alert */}
              <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg text-sm text-blue-700 flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Your sensitive information is encrypted and securely stored</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Payment Method'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      {methods.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No payment methods added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a payment method to redeem your winnings
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {methods.map(method => (
            <Card key={method.id} className={method.is_primary ? 'border-primary ring-1 ring-primary/20' : ''}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-muted rounded-lg">
                    {getMethodIcon(method.method_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{getMethodLabel(method.method_type)}</h4>
                      {method.is_primary && (
                        <Badge className="text-xs">Primary</Badge>
                      )}
                      {method.is_verified && (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{getMethodDisplay(method)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!method.is_primary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetPrimary(method.id)}
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeletePaymentMethod(method.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
