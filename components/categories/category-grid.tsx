'use client';

import { cn } from '@/lib/utils';
import { Category } from '@/types';

interface CategoryGridProps {
  categories: Category[];
  selectedId?: string;
  onSelect?: (category: Category) => void;
  columns?: 4 | 5 | 6;
  className?: string;
}

export function CategoryGrid({
  categories,
  selectedId,
  onSelect,
  columns = 4,
  className,
}: CategoryGridProps) {
  const gridCols = {
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div
      className={cn(
        'grid gap-3',
        gridCols[columns],
        className
      )}
    >
      {categories.map((category) => {
        const isSelected = category.id === selectedId;

        return (
          <button
            key={category.id}
            onClick={() => onSelect?.(category)}
            className={cn(
              'group flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all duration-200',
              'hover:bg-accent/50 active:scale-95',
              isSelected && 'bg-primary/10 ring-2 ring-primary/50'
            )}
          >
            <div
              className={cn(
                'flex size-12 items-center justify-center rounded-xl bg-muted/60 text-xl transition-transform group-hover:scale-110',
                isSelected && 'scale-110 bg-primary/10'
              )}
            >
              <span className="text-sm font-medium">{category.icon || category.name.charAt(0)}</span>
            </div>
            <span
              className={cn(
                'text-[10px] font-medium text-muted-foreground text-center leading-tight line-clamp-2',
                'group-hover:text-foreground',
                isSelected && 'text-foreground font-semibold'
              )}
            >
              {category.name}
            </span>
          </button>
        );
      })}

      {/* Add New Category Button */}
      <button
        className={cn(
          'group flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all duration-200',
          'hover:bg-accent/50 active:scale-95'
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 transition-colors group-hover:border-primary/50">
          <svg
            className="size-5 text-muted-foreground transition-colors group-hover:text-primary"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
          เพิ่มใหม่
        </span>
      </button>
    </div>
  );
}
