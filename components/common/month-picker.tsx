'use client';

import { cn } from '@/lib/utils';
import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';

interface MonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  selectedDay?: Date | null;
  onDayChange?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const monthNames = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const fullMonthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

type ViewMode = 'compact' | 'month' | 'calendar';

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function MonthPicker({
  value,
  onChange,
  selectedDay,
  onDayChange,
  minDate,
  maxDate,
  className,
}: MonthPickerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  const currentMonth = value.getMonth();
  const currentYear = value.getFullYear();

  // Generate calendar days for the view month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(viewYear, viewMonth, day));
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = useCallback(() => {
    const newDate = new Date(value);
    newDate.setMonth(newDate.getMonth() - 1);
    onChange(newDate);
    // Clear day selection when month changes
    onDayChange?.(null);
  }, [value, onChange, onDayChange]);

  const handleNextMonth = useCallback(() => {
    const newDate = new Date(value);
    newDate.setMonth(newDate.getMonth() + 1);
    onChange(newDate);
    // Clear day selection when month changes
    onDayChange?.(null);
  }, [value, onChange, onDayChange]);

  const handleMonthSelect = useCallback((month: number) => {
    const newDate = new Date(viewYear, month, 1);
    onChange(newDate);
    setViewMonth(month);
    onDayChange?.(null);
    setViewMode('calendar');
  }, [viewYear, onChange, onDayChange]);

  const handleDaySelect = useCallback((day: Date) => {
    // If same day is selected, clear selection (toggle)
    if (selectedDay && isSameDay(day, selectedDay)) {
      onDayChange?.(null);
    } else {
      onDayChange?.(day);
    }
    setViewMode('compact');
  }, [selectedDay, onDayChange]);

  const handlePrevViewMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  }, [viewMonth]);

  const handleNextViewMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  }, [viewMonth]);

  const handlePrevYear = useCallback(() => {
    setViewYear((prev) => prev - 1);
  }, []);

  const handleNextYear = useCallback(() => {
    setViewYear((prev) => prev + 1);
  }, []);

  const isMonthDisabled = useCallback((month: number) => {
    const date = new Date(viewYear, month, 1);
    if (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) {
      return true;
    }
    if (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) {
      return true;
    }
    return false;
  }, [viewYear, minDate, maxDate]);

  const isDayInCurrentMonth = useCallback((day: Date) => {
    return day.getMonth() === currentMonth && day.getFullYear() === currentYear;
  }, [currentMonth, currentYear]);

  const openCalendarView = useCallback(() => {
    setViewYear(currentYear);
    setViewMonth(currentMonth);
    setViewMode('calendar');
  }, [currentYear, currentMonth]);

  const openMonthView = useCallback(() => {
    setViewYear(currentYear);
    setViewMode('month');
  }, [currentYear]);

  const clearDaySelection = useCallback(() => {
    onDayChange?.(null);
  }, [onDayChange]);

  return (
    <div className={cn('relative', className)}>
      {/* Compact View */}
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handlePrevMonth}
          className="rounded-full"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Month/Year Button */}
        <button
          onClick={openMonthView}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium',
            'transition-all duration-200',
            'hover:bg-accent active:scale-95'
          )}
        >
          <span className="text-sm">{fullMonthNames[currentMonth]}</span>
          <span className="text-sm text-muted-foreground">{currentYear + 543}</span>
        </button>

        {/* Calendar Day Button */}
        <button
          onClick={openCalendarView}
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-1.5',
            'transition-all duration-200',
            'hover:bg-accent active:scale-95',
            selectedDay && 'bg-primary/10 text-primary'
          )}
        >
          <CalendarDays className="size-5.5" />
          {selectedDay && (
            <span className="text-xs font-semibold">
              {selectedDay.getDate()}
            </span>
          )}
        </button>

        {/* Clear Day Selection */}
        {selectedDay && (
          <button
            onClick={clearDaySelection}
            className={cn(
              'flex items-center justify-center size-6 rounded-full',
              'bg-muted/60 hover:bg-destructive/20 hover:text-destructive',
              'transition-all duration-200 active:scale-90',
              'animate-in zoom-in-50 duration-200'
            )}
          >
            <X className="size-3" />
          </button>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleNextMonth}
          className="rounded-full"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Selected Day Indicator */}
      {selectedDay && (
        <div className="mt-2 flex justify-center animate-in slide-in-from-top-2 duration-200">
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-1 rounded-full',
            'bg-primary/10 text-primary text-xs font-medium'
          )}>
            <span>
              แสดงเฉพาะวันที่ {selectedDay.getDate()} {fullMonthNames[selectedDay.getMonth()]}
            </span>
          </div>
        </div>
      )}

      {/* Expanded Views */}
      {viewMode !== 'compact' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setViewMode('compact')}
          />

          <div className={cn(
            'absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2',
            'animate-in zoom-in-95 slide-in-from-top-2 duration-200',
            'rounded-2xl border border-border/50 bg-popover shadow-2xl',
            'overflow-hidden',
            viewMode === 'calendar' ? 'w-80' : 'w-64'
          )}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/30 bg-muted/30">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={viewMode === 'calendar' ? handlePrevViewMonth : handlePrevYear}
                className="rounded-full"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <button
                onClick={() => setViewMode(viewMode === 'calendar' ? 'month' : 'calendar')}
                className={cn(
                  'font-semibold text-sm px-3 py-1 rounded-lg',
                  'hover:bg-accent transition-colors'
                )}
              >
                {viewMode === 'calendar'
                  ? `${fullMonthNames[viewMonth]} ${viewYear + 543}`
                  : `${viewYear + 543}`
                }
              </button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={viewMode === 'calendar' ? handleNextViewMonth : handleNextYear}
                className="rounded-full"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-3">
              {viewMode === 'month' ? (
                /* Month Grid */
                <div className="grid grid-cols-3 gap-1.5">
                  {monthNames.map((month, index) => {
                    const isSelected = index === currentMonth && viewYear === currentYear;
                    const isDisabled = isMonthDisabled(index);

                    return (
                      <button
                        key={index}
                        onClick={() => !isDisabled && handleMonthSelect(index)}
                        disabled={isDisabled}
                        className={cn(
                          'rounded-xl px-2 py-2.5 text-sm font-medium',
                          'transition-all duration-150',
                          'hover:scale-105 active:scale-95',
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'hover:bg-accent',
                          isDisabled && 'cursor-not-allowed opacity-40 hover:scale-100'
                        )}
                      >
                        {month}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Calendar Grid */
                <div>
                  {/* Day Names Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map((day, idx) => (
                      <div
                        key={day}
                        className={cn(
                          'text-center text-[10px] font-medium py-1',
                          idx === 0 && 'text-destructive/70',
                          idx === 6 && 'text-blue-500/70',
                          idx !== 0 && idx !== 6 && 'text-muted-foreground'
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className="size-9" />;
                      }

                      const isCurrentMonthDay = isDayInCurrentMonth(day);
                      const isSelectedDay = selectedDay && isSameDay(day, selectedDay);
                      const isTodayDay = isToday(day);
                      const dayOfWeek = day.getDay();
                      const isSunday = dayOfWeek === 0;
                      const isSaturday = dayOfWeek === 6;

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => handleDaySelect(day)}
                          className={cn(
                            'relative size-9 rounded-xl text-sm font-medium',
                            'transition-all duration-150',
                            'hover:scale-110 active:scale-95',
                            'flex items-center justify-center',
                            // Selected state
                            isSelectedDay && 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/30',
                            // Today indicator
                            isTodayDay && !isSelectedDay && 'ring-2 ring-primary/50 bg-primary/10 font-bold',
                            // Current month styling
                            isCurrentMonthDay && !isSelectedDay && !isTodayDay && 'hover:bg-accent',
                            // Outside current month
                            !isCurrentMonthDay && 'text-muted-foreground/50',
                            // Weekend colors
                            isSunday && !isSelectedDay && 'text-destructive/80',
                            isSaturday && !isSelectedDay && 'text-blue-500/80'
                          )}
                        >
                          {day.getDate()}

                          {/* Today dot */}
                          {isTodayDay && !isSelectedDay && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                    <button
                      onClick={() => {
                        const today = new Date();
                        onChange(new Date(today.getFullYear(), today.getMonth(), 1));
                        onDayChange?.(today);
                        setViewMode('compact');
                      }}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-medium',
                        'bg-primary/10 text-primary',
                        'hover:bg-primary/20 transition-colors',
                        'active:scale-98'
                      )}
                    >
                      วันนี้
                    </button>
                    <button
                      onClick={() => {
                        onDayChange?.(null);
                        setViewMode('compact');
                      }}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-medium',
                        'bg-muted hover:bg-muted/80 transition-colors',
                        'active:scale-98'
                      )}
                    >
                      ดูทั้งเดือน
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
