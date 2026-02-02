'use client';

import { cn } from '@/lib/utils';
import { CalcButton } from './calc-button';
import type { Operation } from './use-calculator';
import type { TransactionType } from '@/types';
import { Check, Sparkles } from 'lucide-react';

interface CalculatorKeypadProps {
  operation: Operation;
  transactionType: TransactionType;
  canSubmit: boolean;
  onNumber: (num: string) => void;
  onOperation: (op: Operation) => void;
  onEquals: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onSubmit: () => void;
  showSparkle?: boolean;
}

export function CalculatorKeypad({
  operation,
  transactionType,
  canSubmit,
  onNumber,
  onOperation,
  onEquals,
  onClear,
  onBackspace,
  onSubmit,
  showSparkle = true,
}: CalculatorKeypadProps) {
  return (
    <div className="mt-auto bg-muted/30 px-3 pb-safe pt-3">
      <div className="grid grid-cols-4 gap-1.5">
        {/* Row 1 */}
        <CalcButton label="C" onClick={onClear} variant="secondary" />
        <CalcButton
          label="÷"
          onClick={() => onOperation('÷')}
          variant="secondary"
          isActive={operation === '÷'}
        />
        <CalcButton
          label="×"
          onClick={() => onOperation('×')}
          variant="secondary"
          isActive={operation === '×'}
        />
        <CalcButton label="⌫" onClick={onBackspace} variant="secondary" />

        {/* Row 2 */}
        <CalcButton label="7" onClick={() => onNumber('7')} />
        <CalcButton label="8" onClick={() => onNumber('8')} />
        <CalcButton label="9" onClick={() => onNumber('9')} />
        <CalcButton
          label="-"
          onClick={() => onOperation('-')}
          variant="secondary"
          isActive={operation === '-'}
        />

        {/* Row 3 */}
        <CalcButton label="4" onClick={() => onNumber('4')} />
        <CalcButton label="5" onClick={() => onNumber('5')} />
        <CalcButton label="6" onClick={() => onNumber('6')} />
        <CalcButton
          label="+"
          onClick={() => onOperation('+')}
          variant="secondary"
          isActive={operation === '+'}
        />

        {/* Row 4 */}
        <CalcButton label="1" onClick={() => onNumber('1')} />
        <CalcButton label="2" onClick={() => onNumber('2')} />
        <CalcButton label="3" onClick={() => onNumber('3')} />
        <CalcButton
          label="="
          onClick={onEquals}
          variant="secondary"
          className="bg-muted"
        />

        {/* Row 5 */}
        <CalcButton label="00" onClick={() => { onNumber('0'); onNumber('0'); }} />
        <CalcButton label="0" onClick={() => onNumber('0')} />
        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={cn(
            "col-span-2 relative flex h-12 items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all duration-300",
            "active:scale-95 disabled:opacity-40 disabled:active:scale-100",
            canSubmit && "shadow-lg",
            transactionType === 'expense' && "bg-expense shadow-expense/30 hover:bg-expense/90",
            transactionType === 'income' && "bg-income shadow-income/30 hover:bg-income/90"
          )}
        >
          {canSubmit ? (
            <>
              <Check className="size-5" />
              <span className="text-sm">บันทึก</span>
            </>
          ) : (
            <span className="text-sm">บันทึก</span>
          )}
        </button>
      </div>
    </div>
  );
}
