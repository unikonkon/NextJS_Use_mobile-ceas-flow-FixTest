'use client';

import { cn } from '@/lib/utils';

interface CalcButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary';
  isActive?: boolean;
  className?: string;
}

export function CalcButton({
  label,
  onClick,
  variant = 'default',
  isActive = false,
  className,
}: CalcButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center rounded-xl text-lg font-semibold transition-all duration-150",
        "active:scale-95 active:bg-accent",
        variant === 'default' && "bg-card hover:bg-accent text-foreground",
        variant === 'secondary' && "bg-muted/60 hover:bg-muted text-muted-foreground",
        isActive && "ring-2 ring-primary bg-primary/10 text-primary",
        className
      )}
    >
      {label}
    </button>
  );
}
