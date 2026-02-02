'use client';

import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils/format';

interface CalculatorPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  currency?: string;
  className?: string;
}

type Operation = '+' | '-' | '×' | '÷' | null;

export function CalculatorPad({
  value,
  onChange,
  onSubmit,
  currency = '฿',
  className,
}: CalculatorPadProps) {
  const [displayValue, setDisplayValue] = useState(value || '0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const calculate = useCallback(() => {
    if (!previousValue || !operation) return displayValue;

    const prev = parseFloat(previousValue);
    const current = parseFloat(displayValue);

    let result: number;
    switch (operation) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '×':
        result = prev * current;
        break;
      case '÷':
        result = current !== 0 ? prev / current : 0;
        break;
      default:
        return displayValue;
    }

    return result.toString();
  }, [previousValue, displayValue, operation]);

  const handleNumber = (num: string) => {
    let newValue: string;

    if (shouldResetDisplay || displayValue === '0') {
      newValue = num;
      setShouldResetDisplay(false);
    } else {
      // Limit to reasonable length
      if (displayValue.replace('.', '').length >= 12) return;
      newValue = displayValue + num;
    }

    setDisplayValue(newValue);
    onChange(newValue);
  };

  const handleDecimal = () => {
    if (shouldResetDisplay) {
      setDisplayValue('0.');
      setShouldResetDisplay(false);
      onChange('0.');
      return;
    }

    if (displayValue.includes('.')) return;

    const newValue = displayValue + '.';
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const handleOperation = (op: Operation) => {
    if (previousValue && operation && !shouldResetDisplay) {
      const result = calculate();
      setDisplayValue(result);
      setPreviousValue(result);
      onChange(result);
    } else {
      setPreviousValue(displayValue);
    }
    setOperation(op);
    setShouldResetDisplay(true);
  };

  const handleEquals = () => {
    if (!previousValue || !operation) {
      onSubmit?.();
      return;
    }

    const result = calculate();
    setDisplayValue(result);
    setPreviousValue(null);
    setOperation(null);
    setShouldResetDisplay(true);
    onChange(result);
  };

  const handleClear = () => {
    setDisplayValue('0');
    setPreviousValue(null);
    setOperation(null);
    setShouldResetDisplay(false);
    onChange('0');
  };

  const handleBackspace = () => {
    if (shouldResetDisplay || displayValue === '0' || displayValue.length === 1) {
      setDisplayValue('0');
      onChange('0');
      return;
    }

    const newValue = displayValue.slice(0, -1) || '0';
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const formatDisplay = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '0';
    if (val.endsWith('.')) return formatNumber(num) + '.';
    if (val.includes('.')) {
      const parts = val.split('.');
      return formatNumber(parseFloat(parts[0])) + '.' + parts[1];
    }
    return formatNumber(num);
  };

  const buttons = [
    { label: 'C', action: handleClear, variant: 'secondary' as const },
    { label: '⌫', action: handleBackspace, variant: 'secondary' as const },
    { label: '÷', action: () => handleOperation('÷'), variant: 'secondary' as const, isOp: true },
    { label: '×', action: () => handleOperation('×'), variant: 'secondary' as const, isOp: true },
    { label: '7', action: () => handleNumber('7') },
    { label: '8', action: () => handleNumber('8') },
    { label: '9', action: () => handleNumber('9') },
    { label: '-', action: () => handleOperation('-'), variant: 'secondary' as const, isOp: true },
    { label: '4', action: () => handleNumber('4') },
    { label: '5', action: () => handleNumber('5') },
    { label: '6', action: () => handleNumber('6') },
    { label: '+', action: () => handleOperation('+'), variant: 'secondary' as const, isOp: true },
    { label: '1', action: () => handleNumber('1') },
    { label: '2', action: () => handleNumber('2') },
    { label: '3', action: () => handleNumber('3') },
    { label: '=', action: handleEquals, variant: 'default' as const, span: 'row' as const },
    { label: '0', action: () => handleNumber('0'), span: 'col' as const },
    { label: '.', action: handleDecimal },
  ];

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Display */}
      <div className="flex flex-col items-end rounded-2xl bg-muted/50 px-4 py-3">
        {/* Operation Indicator */}
        {previousValue && operation && (
          <span className="text-xs text-muted-foreground">
            {formatNumber(parseFloat(previousValue))} {operation}
          </span>
        )}
        {/* Main Display */}
        <div className="flex items-baseline gap-1">
          <span className="text-lg text-muted-foreground">{currency}</span>
          <span className="font-numbers text-3xl font-bold tracking-tight text-foreground">
            {formatDisplay(displayValue)}
          </span>
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn, index) => (
          <Button
            key={index}
            variant={btn.variant || 'outline'}
            onClick={btn.action}
            className={cn(
              'h-14 text-lg font-semibold transition-all active:scale-95',
              btn.span === 'col' && 'col-span-2',
              btn.isOp && operation === btn.label && 'ring-2 ring-primary',
              btn.label === '=' && 'bg-primary text-primary-foreground hover:bg-primary/90',
              !btn.variant && 'bg-card hover:bg-accent'
            )}
          >
            {btn.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
