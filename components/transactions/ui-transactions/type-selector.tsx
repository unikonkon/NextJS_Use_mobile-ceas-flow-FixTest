'use client';

import { cn } from '@/lib/utils';
import type { TransactionType } from '@/types';

interface TypeOption {
  type: TransactionType;
  label: string;
  icon?: string;
}

interface TypeSelectorProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
  options?: TypeOption[];
  showIcons?: boolean;
}

const defaultOptions: TypeOption[] = [
  { type: 'expense', label: 'รายจ่าย', icon: '💸' },
  { type: 'income', label: 'รายรับ', icon: '💰' },
];

export function TypeSelector({
  value,
  onChange,
  options = defaultOptions,
  showIcons = true,
}: TypeSelectorProps) {
  return (
    <div className="relative px-4">
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl bg-muted/60 p-1 backdrop-blur-sm">
          {options.map((item) => (
            <button
              key={item.type}
              onClick={() => onChange(item.type)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
                value === item.type
                  ? "text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {value === item.type && (
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl transition-all duration-300",
                    item.type === 'expense' && "bg-expense shadow-expense/30",
                    item.type === 'income' && "bg-income shadow-income/30"
                  )}
                />
              )}
              {showIcons && item.icon && (
                <span className="relative z-10">{item.icon}</span>
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
