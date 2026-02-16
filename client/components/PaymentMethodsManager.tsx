import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Check, CreditCard, Wallet, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: number;
  methodType: 'bank' | 'paypal' | 'cashapp';
  isPrimary: boolean;
  isVerified: boolean;
  bankName?: string;
  accountType?: string;
  paypalEmail?: string;
  cashappHandle?: string;
  lastUsedAt?: string;
  createdAt: string;
}

interface PaymentMethodsManagerProps {
  methods?: PaymentMethod[];
  onAdd?: (method: PaymentMethod) => Promise<void>;
  onDelete?: (methodId: number) => Promise<void>;
  onSetPrimary?: (methodId: number) => Promise<void>;
  isLoading?: boolean;
}

export const PaymentMethodsManager: React.FC<PaymentMethodsManagerProps> = ({
  methods = [],
  onAdd,
  onDelete,
  onSetPrimary,
  isLoading = false,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [methodType, setMethodType] = useState<'bank' | 'paypal' | 'cashapp'>('paypal');
  const [formData, setFormData] = useState({
    bankName: '',
    accountType: 'checking',
    accountNumber: '',
    routingNumber: '',
    paypalEmail: '',
    cashappHandle: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'paypal':
        return <Wallet className="w-5 h-5 text-blue-600" />;
      case 'cashapp':
        return <Mail className="w-5 h-5 text-green-500" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const getMethodDisplay = (method: PaymentMethod) => {
    switch (method.methodType) {
      case 'bank':
        return `${method.bankName} (${method.accountType})`;
      case 'paypal':
        return method.paypalEmail;
      case 'cashapp':
        return `Cash App: ${method.cashappHandle}`;
      default:
        return 'Payment Method';
    }
  };

  const handleAddMethod = async () => {
    if (!formData.paypalEmail && !formData.bankName && !formData.cashappHandle) {
      alert('Please fill in the required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const newMethod: PaymentMethod = {
        id: Date.now(),
        methodType,
        isPrimary: methods.length === 0,
        isVerified: false,
        ...formData,
        createdAt: new Date().toISOString()
      };

      if (onAdd) {
        await onAdd(newMethod);
      }

      setShowForm(false);
      setFormData({
        bankName: '',
        accountType: 'checking',
        accountNumber: '',
        routingNumber: '',
        paypalEmail: '',
        cashappHandle: ''
      });
    } catch (error) {
      console.error('Failed to add method:', error);
      alert('Failed to add payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (methodId: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      if (onDelete) {
        await onDelete(methodId);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete payment method');
    }
  };

  const handleSetPrimary = async (methodId: number) => {
    try {
      if (onSetPrimary) {
        await onSetPrimary(methodId);
      }
    } catch (error) {
      console.error('Failed to set primary:', error);
      alert('Failed to set as primary');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Payment Methods</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your redemption payment methods
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Method
        </Button>
      </div>

      {/* Add Method Form */}
      {showForm && (
        <div className="bg-muted/30 border border-border rounded-lg p-6">
          <h4 className="font-semibold text-foreground mb-4">Add New Payment Method</h4>

          {/* Method Type Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
              Payment Method Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['paypal', 'bank', 'cashapp'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMethodType(type as any)}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    methodType === type
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2 justify-center">
                    {getMethodIcon(type)}
                    <span className="font-medium text-sm capitalize">{type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          {methodType === 'paypal' && (
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">
                PayPal Email
              </label>
              <input
                type="email"
                value={formData.paypalEmail}
                onChange={(e) =>
                  setFormData({ ...formData, paypalEmail: e.target.value })
                }
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
          )}

          {methodType === 'cashapp' && (
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Cash App Handle
              </label>
              <input
                type="text"
                value={formData.cashappHandle}
                onChange={(e) =>
                  setFormData({ ...formData, cashappHandle: e.target.value })
                }
                placeholder="$yourhandle"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
          )}

          {methodType === 'bank' && (
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  placeholder="e.g., Chase Bank"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Account Type
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) =>
                    setFormData({ ...formData, accountType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option>checking</option>
                  <option>savings</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Account Number (encrypted)
                </label>
                <input
                  type="password"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Routing Number (encrypted)
                </label>
                <input
                  type="password"
                  value={formData.routingNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, routingNumber: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleAddMethod}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </div>
        </div>
      )}

      {/* Methods List */}
      <div className="space-y-3">
        {methods.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">No payment methods added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a payment method to enable redemptions
            </p>
          </div>
        ) : (
          methods.map((method) => (
            <div
              key={method.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border',
                method.isPrimary
                  ? 'bg-primary/5 border-primary'
                  : 'bg-muted/30 border-border'
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                {getMethodIcon(method.methodType)}
                <div>
                  <p className="font-semibold text-foreground">
                    {getMethodDisplay(method)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {method.isPrimary && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                    {method.isVerified ? (
                      <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded">
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!method.isPrimary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetPrimary(method.id)}
                    className="text-primary hover:bg-primary/10"
                  >
                    Set Primary
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(method.id)}
                  className="text-destructive hover:bg-destructive/10"
                  disabled={method.isPrimary}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
          💡 Redemption Minimum: 100 SC
        </p>
        <p className="text-xs text-muted-foreground">
          Your payment methods are encrypted and secure. We'll only use them for redemptions you authorize.
        </p>
      </div>
    </div>
  );
};
