import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center min-h-96';

  return (
    <div className={cn(containerClass, className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
        {text && <p className="text-muted-foreground text-sm">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
