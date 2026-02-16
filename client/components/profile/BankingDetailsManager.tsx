import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, CheckCircle2, AlertCircle, Lock, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

interface PaymentMethod {
  id: number;
  method_type: 'bank' | 'paypal' | 'cashapp';
  is_primary: boolean;
  is_verified: boolean;
  bank_account_holder?: string;
  bank_name?: string;
  paypal_email?: string;
  cashapp_handle?: string;
  verification_method?: string;
  verified_at?: string;
  last_used_at?: string;
  created_at: string;
}

interface BankingDetailsManagerProps {
  onMethodAdded?: () => void;
  onMethodRemoved?: () => void;
}

type MethodType = 'bank' | 'paypal' | 'cashapp';

export const BankingDetailsManager: React.FC<BankingDetailsManagerProps> = ({
  onMethodAdded,
  onMethodRemoved,
}) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMethodType, setSelectedMethodType] = useState<MethodType>('bank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall<{ success: boolean; data?: PaymentMethod[] }>(
        '/payment-methods'
      );
      if (response.success && response.data) {
        setMethods(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMethod = async () => {
    if (!formData[selectedMethodType + '_field']) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Record<string, any> = {
        method_type: selectedMethodType,
      };

      if (selectedMethodType === 'bank') {
        payload.bank_account_holder = formData.account_holder;
        payload.bank_name = formData.bank_name;
        payload.account_number = formData.account_number;
        payload.routing_number = formData.routing_number;
        payload.account_type = formData.account_type;
      } else if (selectedMethodType === 'paypal') {
        payload.paypal_email = formData.paypal_email;
      } else if (selectedMethodType === 'cashapp') {
        payload.cashapp_handle = formData.cashapp_handle;
      }

      const response = await apiCall<{ success: boolean; data?: PaymentMethod }>(
        '/payment-methods',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (response.success) {
        toast.success('Payment method added successfully!');
        await fetchPaymentMethods();
        setShowAddDialog(false);
        setFormData({});
        onMethodAdded?.();
      }
    } catch (error: any) {
      console.error('Failed to add payment method:', error);
      toast.error(error.message || 'Failed to add payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMethod = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      await apiCall(`/payment-methods/${id}`, { method: 'DELETE' });
      toast.success('Payment method deleted');
      await fetchPaymentMethods();
      onMethodRemoved?.();
    } catch (error: any) {
      console.error('Failed to delete payment method:', error);
      toast.error(error.message || 'Failed to delete payment method');
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      await apiCall('/payment-methods/primary', {
        method: 'POST',
        body: JSON.stringify({ methodId: id }),
      });
      toast.success('Primary payment method updated');
      await fetchPaymentMethods();
    } catch (error: any) {
      console.error('Failed to set primary method:', error);
      toast.error(error.message || 'Failed to set primary method');
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return '🏦';
      case 'paypal':
        return '🅿️';
      case 'cashapp':
        return '💰';
      default:
        return '💳';
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
        return 'Payment Method';
    }
  };

  const getMethodDisplay = (method: PaymentMethod) => {
    switch (method.method_type) {
      case 'bank':
        return `${method.bank_name} - ****${method.bank_account_holder?.slice(-4)}`;
      case 'paypal':
        return method.paypal_email;
      case 'cashapp':
        return `@${method.cashapp_handle}`;
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Manage your banking details for withdrawals</CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {methods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No payment methods added yet
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Method
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map(method => (
                <div
                  key={method.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    method.is_primary
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getMethodIcon(method.method_type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {getMethodLabel(method.method_type)}
                          </h3>
                          {method.is_primary && (
                            <Badge className="bg-blue-600 text-white">Primary</Badge>
                          )}
                          {method.is_verified ? (
                            <Badge className="bg-green-600 text-white flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Unverified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {getMethodDisplay(method)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Added {new Date(method.created_at).toLocaleDateString()}
                          {method.last_used_at &&
                            ` • Last used ${new Date(method.last_used_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!method.is_primary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(method.id)}
                        >
                          Set as Primary
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMethod(method.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 flex gap-3 mt-4">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Your Data is Encrypted
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                All payment information is encrypted using industry-standard SSL encryption.
                We never store sensitive banking data in plain text.
              </p>
            </div>
          </div>

          {/* Minimum Redemption Note */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Redemption Minimum
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                You must have at least 100 SC to request a withdrawal. All payments are processed
                within 5-7 business days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>Choose a payment method to add to your account</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Method Type Selection */}
            <div className="grid grid-cols-3 gap-2">
              {(['bank', 'paypal', 'cashapp'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedMethodType(type);
                    setFormData({});
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    selectedMethodType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl block mb-1">{getMethodIcon(type)}</span>
                  <p className="text-xs font-semibold">{getMethodLabel(type)}</p>
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <div className="space-y-3 py-4 border-t border-b border-gray-200 dark:border-gray-700">
              {selectedMethodType === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Account Holder Name</label>
                    <Input
                      placeholder="Full name on account"
                      value={formData.account_holder || ''}
                      onChange={e => setFormData({ ...formData, account_holder: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Bank Name</label>
                    <Input
                      placeholder="e.g., Bank of America"
                      value={formData.bank_name || ''}
                      onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Account Type</label>
                    <select
                      value={formData.account_type || ''}
                      onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-900 dark:text-white"
                    >
                      <option value="">Select account type</option>
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Account Number</label>
                    <Input
                      type="password"
                      placeholder="Account number (encrypted)"
                      value={formData.account_number || ''}
                      onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Routing Number</label>
                    <Input
                      type="password"
                      placeholder="Routing number (encrypted)"
                      value={formData.routing_number || ''}
                      onChange={e => setFormData({ ...formData, routing_number: e.target.value })}
                    />
                  </div>
                </>
              )}

              {selectedMethodType === 'paypal' && (
                <div>
                  <label className="block text-sm font-semibold mb-1">PayPal Email</label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.paypal_email || ''}
                    onChange={e => setFormData({ ...formData, paypal_email: e.target.value })}
                  />
                </div>
              )}

              {selectedMethodType === 'cashapp' && (
                <div>
                  <label className="block text-sm font-semibold mb-1">Cash App Handle</label>
                  <div className="flex items-center">
                    <span className="text-gray-600 dark:text-gray-400 mr-2">@</span>
                    <Input
                      placeholder="yourhandle"
                      value={formData.cashapp_handle || ''}
                      onChange={e => setFormData({ ...formData, cashapp_handle: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMethod}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Method
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
