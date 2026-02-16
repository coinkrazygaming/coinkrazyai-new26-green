import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

export const useWallet = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<'GC' | 'SC'>('GC');

  const toggleCurrency = useCallback(() => {
    setCurrency(curr => curr === 'GC' ? 'SC' : 'GC');
  }, []);

  const wallet = {
    goldCoins: Number(user?.gc_balance ?? 0),
    sweepsCoins: Number(user?.sc_balance ?? 0),
  };

  return {
    wallet,
    currency,
    toggleCurrency,
  };
};
