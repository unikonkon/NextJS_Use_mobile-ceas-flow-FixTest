'use client';

import { cn } from '@/lib/utils';

interface CategoryIconProps {
  icon: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'size-8 text-base',
  md: 'size-10 text-lg',
  lg: 'size-12 text-xl',
  xl: 'size-16 text-3xl',
};

const colorVariants: Record<string, string> = {
  'category-food': 'bg-[color:oklch(0.72_0.18_45/0.15)] dark:bg-[color:oklch(0.72_0.18_45/0.2)]',
  'category-shopping': 'bg-[color:oklch(0.70_0.20_330/0.15)] dark:bg-[color:oklch(0.70_0.20_330/0.2)]',
  'category-transport': 'bg-[color:oklch(0.65_0.18_260/0.15)] dark:bg-[color:oklch(0.65_0.18_260/0.2)]',
  'category-entertainment': 'bg-[color:oklch(0.72_0.22_300/0.15)] dark:bg-[color:oklch(0.72_0.22_300/0.2)]',
  'category-health': 'bg-[color:oklch(0.70_0.18_175/0.15)] dark:bg-[color:oklch(0.70_0.18_175/0.2)]',
  'category-bills': 'bg-[color:oklch(0.62_0.15_230/0.15)] dark:bg-[color:oklch(0.62_0.15_230/0.2)]',
  'category-family': 'bg-[color:oklch(0.74_0.15_85/0.15)] dark:bg-[color:oklch(0.74_0.15_85/0.2)]',
  'category-social': 'bg-[color:oklch(0.72_0.20_350/0.15)] dark:bg-[color:oklch(0.72_0.20_350/0.2)]',
  'category-housing': 'bg-[color:oklch(0.60_0.12_200/0.15)] dark:bg-[color:oklch(0.60_0.12_200/0.2)]',
  'category-communication': 'bg-[color:oklch(0.68_0.18_280/0.15)] dark:bg-[color:oklch(0.68_0.18_280/0.2)]',
  'category-clothing': 'bg-[color:oklch(0.76_0.16_60/0.15)] dark:bg-[color:oklch(0.76_0.16_60/0.2)]',
  'category-other': 'bg-[color:oklch(0.60_0.08_260/0.15)] dark:bg-[color:oklch(0.60_0.08_260/0.2)]',
};

export function CategoryIcon({
  icon,
  color = 'category-other',
  size = 'md',
  className,
}: CategoryIconProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl transition-transform hover:scale-105',
        sizeClasses[size],
        colorVariants[color] || colorVariants['category-other'],
        className
      )}
    >
      <span className="select-none">{icon}</span>
    </div>
  );
}
