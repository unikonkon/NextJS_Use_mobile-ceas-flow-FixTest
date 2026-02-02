'use client';

import { AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertBannerProps {
  variant: 'warning' | 'danger';
  title: string;
  description?: string;
  onDismiss?: () => void;
  className?: string;
}

export function AlertBanner({ variant, title, description, onDismiss, className }: AlertBannerProps) {
  const isWarning = variant === 'warning';

  return (
    <div
      className={cn(
        'relative flex items-start gap-1 rounded-xl border px-3 py-2 text-sm animate-slide-up',
        isWarning
          ? 'border-amber-300/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200'
          : 'border-red-300/50 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200',
        className
      )}
    >
      <div className="mt-0.5 shrink-0">
        {isWarning ? (
          <AlertTriangle className="size-4 text-amber-500 dark:text-amber-400" />
        ) : (
          <XCircle className="size-4 text-red-500 dark:text-red-400" />
        )}
      </div>
      <div className="flex justify-between w-full items-center">
        <p className="font-medium leading-tight text-xs">{title}</p>
        {description && (
          <p className="text-xs opacity-80">{description}</p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
