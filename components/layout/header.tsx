'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBookSelector?: boolean;
  currentBook?: string;
  onBookSelect?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function Header({
  title,
  subtitle,
  showBookSelector = false,
  currentBook = 'บัญชีส่วนตัว',
  onBookSelect,
  leftAction,
  rightAction,
  className,
}: HeaderProps) {
  return (
    <header className={cn(
      'sticky top-0 z-40 w-full bg-background border-b border-border/50 pt-safe',
      className
    )}>
      <div className="flex h-10 items-center justify-between px-4 bg-background">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {leftAction}

          {showBookSelector && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBookSelect}
              className="gap-1 font-medium hover:bg-accent/50"
            >
              <span className="text-lg">📒</span>
              <span className="max-w-[120px] truncate">{currentBook}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          )}

          {title && !showBookSelector && (
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {rightAction}
        </div>
      </div>
    </header>
  );
}
