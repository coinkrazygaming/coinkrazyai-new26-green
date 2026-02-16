import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  amount: string;
  currency: 'GC' | 'SC';
  transactionId?: string;
  date?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  amount,
  currency,
  transactionId,
  date = new Date().toLocaleString(),
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Purchase Successful!</DialogTitle>
          <DialogDescription className="text-center">
            Your transaction has been processed successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-6 space-y-4 my-4 border border-dashed border-muted-foreground/30">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Receipt
            </span>
            <span className="text-xs text-muted-foreground font-mono">{transactionId || '#'+Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>

          <div className="pt-4 border-t border-muted-foreground/20 flex items-center justify-between">
            <span className="font-semibold">Total Amount</span>
            <span className={cn(
              "text-xl font-black",
              currency === 'GC' ? "text-secondary" : "text-primary"
            )}>
              {amount} {currency}
            </span>
          </div>

          <div className="text-[10px] text-muted-foreground text-center pt-2">
            Date: {date}
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="w-full sm:w-auto px-8">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
