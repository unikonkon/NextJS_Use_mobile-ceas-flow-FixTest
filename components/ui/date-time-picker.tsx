'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

// Thai month names
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  showTime?: boolean;
  className?: string;
  triggerClassName?: string;
  children?: React.ReactNode;
}

// Utility: days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Utility: first day of month (0 = Sunday)
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Utility: format relative date in Thai
function formatRelativeDateThai(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) return 'วันนี้';
  if (isSameDay(date, yesterday)) return 'เมื่อวาน';
  if (isSameDay(date, tomorrow)) return 'พรุ่งนี้';

  return `${date.getDate()} ${THAI_MONTHS_SHORT[date.getMonth()]}`;
}

// Wheel Picker Component for smooth scrolling selection
interface WheelPickerProps {
  items: { value: number; label: string }[];
  selectedValue: number;
  onSelect: (value: number) => void;
  itemHeight?: number;
  visibleItems?: number;
}

function WheelPicker({
  items,
  selectedValue,
  onSelect,
  itemHeight = 40,
  visibleItems = 5,
}: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const selectedIndex = items.findIndex((item) => item.value === selectedValue);
  const centerOffset = Math.floor(visibleItems / 2) * itemHeight;

  useEffect(() => {
    if (containerRef.current && !isDragging) {
      containerRef.current.scrollTop = selectedIndex * itemHeight;
    }
  }, [selectedIndex, itemHeight, isDragging]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isDragging) return;
    const scrollPosition = containerRef.current.scrollTop;
    const newIndex = Math.round(scrollPosition / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));
    if (items[clampedIndex] && items[clampedIndex].value !== selectedValue) {
      onSelect(items[clampedIndex].value);
    }
  }, [items, itemHeight, selectedValue, onSelect, isDragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    scrollTop.current = containerRef.current?.scrollTop || 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const deltaY = startY.current - e.touches[0].clientY;
    containerRef.current.scrollTop = scrollTop.current + deltaY;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (!containerRef.current) return;
    const scrollPosition = containerRef.current.scrollTop;
    const newIndex = Math.round(scrollPosition / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));
    containerRef.current.scrollTo({
      top: clampedIndex * itemHeight,
      behavior: 'smooth',
    });
    if (items[clampedIndex]) {
      onSelect(items[clampedIndex].value);
    }
  };

  return (
    <div
      className="relative"
      style={{ height: visibleItems * itemHeight }}
    >
      {/* Selection highlight */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-10 rounded-lg bg-primary/10 border border-primary/20"
        style={{
          top: centerOffset,
          height: itemHeight,
        }}
      />

      {/* Gradient masks */}
      <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-card to-transparent pointer-events-none z-20" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-card to-transparent pointer-events-none z-20" />

      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory' }}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top padding */}
        <div style={{ height: centerOffset }} />

        {items.map((item, index) => {
          const isSelected = item.value === selectedValue;
          const distance = Math.abs(index - selectedIndex);
          const opacity = Math.max(0.3, 1 - distance * 0.25);
          const scale = Math.max(0.85, 1 - distance * 0.05);

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center justify-center transition-all duration-150 snap-center cursor-pointer",
                isSelected && "text-primary font-semibold"
              )}
              style={{
                height: itemHeight,
                opacity,
                transform: `scale(${scale})`,
              }}
              onClick={() => onSelect(item.value)}
            >
              <span className="text-base">{item.label}</span>
            </div>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: centerOffset }} />
      </div>
    </div>
  );
}

// Calendar Grid Component
interface CalendarGridProps {
  year: number;
  month: number;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onMonthChange: (delta: number) => void;
  onMonthYearSelect?: (year: number, month: number) => void;
}

function CalendarGrid({
  year,
  month,
  selectedDate,
  onSelectDate,
  onMonthChange,
  onMonthYearSelect,
}: CalendarGridProps) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  // Reset picker year when year changes
  useEffect(() => {
    setPickerYear(year);
  }, [year]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const isSelected = (day: number) =>
    day === selectedDate.getDate() &&
    month === selectedDate.getMonth() &&
    year === selectedDate.getFullYear();

  const handleMonthSelect = (selectedMonth: number) => {
    if (onMonthYearSelect) {
      onMonthYearSelect(pickerYear, selectedMonth);
    }
    setShowMonthPicker(false);
  };

  return (
    <div className="space-y-3">
      {/* Month/Year Header */}
      <div className="relative flex items-center justify-between px-1">
        <button
          onClick={() => onMonthChange(-1)}
          className="p-2 rounded-full hover:bg-muted/60 transition-colors active:scale-95"
        >
          <ChevronLeft className="size-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => {
            setPickerYear(year);
            setShowMonthPicker(!showMonthPicker);
          }}
          className="text-sm font-semibold text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/60 transition-colors active:scale-95"
        >
          {THAI_MONTHS[month]} {year + 543}
        </button>
        <button
          onClick={() => onMonthChange(1)}
          className="p-2 rounded-full hover:bg-muted/60 transition-colors active:scale-95"
        >
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>

        {/* Month/Year Picker Grid - Floating */}
        {showMonthPicker && (
          <>
            {/* Backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMonthPicker(false)}
            />

            {/* Floating picker */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-56 rounded-2xl bg-card border border-border/50 p-3 space-y-3 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
              {/* Year Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPickerYear((prev) => prev - 1)}
                  className="p-1.5 rounded-full hover:bg-muted/60 transition-colors active:scale-95"
                >
                  <ChevronLeft className="size-4 text-muted-foreground" />
                </button>
                <span className="text-sm font-semibold">{pickerYear + 543}</span>
                <button
                  onClick={() => setPickerYear((prev) => prev + 1)}
                  className="p-1.5 rounded-full hover:bg-muted/60 transition-colors active:scale-95"
                >
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {THAI_MONTHS_SHORT.map((monthName, index) => {
                  const isCurrentMonth = index === month && pickerYear === year;

                  return (
                    <button
                      key={index}
                      onClick={() => handleMonthSelect(index)}
                      className={cn(
                        "rounded-lg px-2 py-2 text-xs font-medium transition-all active:scale-95",
                        isCurrentMonth
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted/60 text-foreground"
                      )}
                    >
                      {monthName}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1">
        {THAI_WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center text-xs font-medium py-2",
              i === 0 && "text-expense/70",
              i !== 0 && "text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayOfWeek = (firstDay + day - 1) % 7;
          const isSunday = dayOfWeek === 0;

          return (
            <button
              key={day}
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setFullYear(year);
                newDate.setMonth(month);
                newDate.setDate(day);
                onSelectDate(newDate);
              }}
              className={cn(
                "aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all",
                "hover:bg-muted/60 active:scale-90",
                isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary/90",
                isToday(day) && !isSelected(day) && "ring-2 ring-primary/40",
                isSunday && !isSelected(day) && "text-expense/70"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Time Picker Component
interface TimePickerProps {
  hours: number;
  minutes: number;
  onTimeChange: (hours: number, minutes: number) => void;
}

function TimePicker({ hours, minutes, onTimeChange }: TimePickerProps) {
  const hourItems = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i.toString().padStart(2, '0'),
  }));

  const minuteItems = Array.from({ length: 60 }, (_, i) => ({
    value: i,
    label: i.toString().padStart(2, '0'),
  }));

  return (
    <div className="flex items-center justify-center gap-2 px-4">
      <div className="flex-1">
        <WheelPicker
          items={hourItems}
          selectedValue={hours}
          onSelect={(h) => onTimeChange(h, minutes)}
        />
      </div>
      <div className="text-2xl font-bold text-muted-foreground">:</div>
      <div className="flex-1">
        <WheelPicker
          items={minuteItems}
          selectedValue={minutes}
          onSelect={(m) => onTimeChange(hours, m)}
        />
      </div>
    </div>
  );
}

// Quick Date Buttons
interface QuickDateButtonsProps {
  onSelect: (date: Date) => void;
  selectedDate: Date;
}

function QuickDateButtons({ onSelect, selectedDate }: QuickDateButtonsProps) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const buttons = [
    { label: 'วันนี้', date: today },
    { label: 'เมื่อวาน', date: yesterday },
  ];

  return (
    <div className="flex gap-2 px-4 pb-3">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setFullYear(btn.date.getFullYear());
            newDate.setMonth(btn.date.getMonth());
            newDate.setDate(btn.date.getDate());
            onSelect(newDate);
          }}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all",
            "border border-border/50",
            isSameDay(selectedDate, btn.date)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/60"
          )}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// Main DateTimePicker Component
export function DateTimePicker({
  value,
  onChange,
  showTime = false,
  className: _className,
  triggerClassName,
  children,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState(value);
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [viewYear, setViewYear] = useState(value.getFullYear());

  // Reset temp values when opening
  useEffect(() => {
    if (open) {
      setTempDate(value);
      setViewMonth(value.getMonth());
      setViewYear(value.getFullYear());
      setActiveTab('date');
    }
  }, [open, value]);

  const handleMonthChange = (delta: number) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setOpen(false);
  };

  const formatDisplayDate = () => {
    const relative = formatRelativeDateThai(value);
    if (showTime) {
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      return `${relative} ${hours}:${minutes}`;
    }
    return relative;
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1.5 transition-all",
          triggerClassName
        )}
      >
        {children || (
          <>
            <CalendarIcon className="size-3.5" />
            <span>{formatDisplayDate()}</span>
          </>
        )}
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[340px] p-0 rounded-3xl overflow-hidden border-0 shadow-2xl bg-linear-to-br from-primary/10 via-primary/5 to-transparent "
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">เลือกวันที่</DialogTitle>

          {/* Header with tabs */}
          <div className="">

            {/* Tab buttons */}
            {/* {showTime && (
              <div className="relative flex gap-1 mx-4 p-1 rounded-xl bg-muted/40">
                <button
                  onClick={() => setActiveTab('date')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                    activeTab === 'date'
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CalendarIcon className="size-3.5" />
                  วันที่
                </button>
                <button
                  onClick={() => setActiveTab('time')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                    activeTab === 'time'
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Clock className="size-3.5" />
                  เวลา
                </button>
              </div>
            )} */}
          </div>

          {/* Content */}
          <div className="px-4 py-1">
            {activeTab === 'date' ? (
              <>
                <QuickDateButtons
                  selectedDate={tempDate}
                  onSelect={(date) => {
                    setTempDate(date);
                    setViewMonth(date.getMonth());
                    setViewYear(date.getFullYear());
                  }}
                />
                <CalendarGrid
                  year={viewYear}
                  month={viewMonth}
                  selectedDate={tempDate}
                  onSelectDate={setTempDate}
                  onMonthChange={handleMonthChange}
                  onMonthYearSelect={(y, m) => {
                    setViewYear(y);
                    setViewMonth(m);
                  }}
                />
              </>
            ) : (
              <TimePicker
                hours={tempDate.getHours()}
                minutes={tempDate.getMinutes()}
                onTimeChange={(h, m) => {
                  const newDate = new Date(tempDate);
                  newDate.setHours(h);
                  newDate.setMinutes(m);
                  setTempDate(newDate);
                }}
              />
            )}
          </div>

          {/* Footer actions */}
          <div className="flex gap-2 p-4 pt-2 border-t border-border/30">
            <button
              onClick={handleCancel}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl",
                "text-sm font-medium text-muted-foreground",
                "bg-muted/40 hover:bg-muted/60 transition-all active:scale-98"
              )}
            >
              <X className="size-4" />
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl",
                "text-sm font-medium text-primary-foreground",
                "bg-primary hover:bg-primary/90 transition-all active:scale-98",
                "shadow-lg shadow-primary/25"
              )}
            >
              <Check className="size-4" />
              ยืนยัน
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact inline date selector for quick navigation
interface DateNavigatorProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DateNavigator({ value, onChange, className }: DateNavigatorProps) {
  const changeDate = (days: number) => {
    const newDate = new Date(value);
    newDate.setDate(newDate.getDate() + days);
    onChange(newDate);
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <button
        onClick={() => changeDate(-1)}
        className="flex items-center justify-center size-7 rounded-lg hover:bg-muted/60 transition-colors active:scale-95"
      >
        <ChevronLeft className="size-4 text-muted-foreground" />
      </button>

      <DateTimePicker
        value={value}
        onChange={onChange}
        triggerClassName={cn(
          "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5",
          "text-xs font-medium text-muted-foreground hover:text-foreground",
          "rounded-lg hover:bg-muted/40 transition-all"
        )}
      >
        <CalendarIcon className="size-3.5" />
        <span>{formatRelativeDateThai(value)}</span>
      </DateTimePicker>

      <button
        onClick={() => changeDate(1)}
        className="flex items-center justify-center size-7 rounded-lg hover:bg-muted/60 transition-colors active:scale-95"
      >
        <ChevronRight className="size-4 text-muted-foreground" />
      </button>
    </div>
  );
}
