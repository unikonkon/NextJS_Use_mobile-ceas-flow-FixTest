'use client';

import { cn } from '@/lib/utils';
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Check,
  Settings2,
  GripVertical,
  Eye,
  EyeOff,
  Plus,
  X,
  Sparkles,
  Tag,
  Move,
  Trash2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
} from 'lucide-react';
import type { Category, TransactionType, CategoryType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { iconGroups } from '@/lib/constants/categories';
import { CategorySelectSheet } from './category-selete';

interface CategoryScrollProps {
  categories: Category[];
  selectedCategory: Category | null;
  transactionType: TransactionType;
  onSelect: (category: Category) => void;
  onReorderCategories?: (categories: Category[]) => void;
  onAddCategory?: (name: string, type: CategoryType, icon?: string) => void;
  onDeleteCategory?: (id: string) => void;
  label?: string;
}

const VISIBLE_COUNT_KEY = 'category-visible-count';
const LONG_PRESS_DURATION = 170; // ms - standard mobile long-press
const DRAG_THRESHOLD = 5; // px - minimum movement to cancel long-press

export function CategoryScroll({
  categories,
  selectedCategory,
  transactionType,
  onSelect,
  onReorderCategories,
  onAddCategory,
  onDeleteCategory,
  label = 'เลือกหมวดหมู่',
}: CategoryScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const categoryGridRef = useRef<HTMLDivElement>(null);
  const categoryItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const ghostRef = useRef<HTMLDivElement | null>(null);

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [orderedCategories, setOrderedCategories] = useState<Category[]>(categories);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [localVisibleCount, setLocalVisibleCount] = useState(12);
  const [hasChanges, setHasChanges] = useState(false);

  // Drag state (for both mouse and touch)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const initialTouchOffset = useRef<{ x: number; y: number } | null>(null);

  // Add category form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Delete mode state
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Category select sheet state
  const [showCategorySelect, setShowCategorySelect] = useState(false);

  // Load visible count from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`${VISIBLE_COUNT_KEY}-${transactionType}`);
    if (stored) {
      const count = parseInt(stored, 10);
      setVisibleCount(count);
      setLocalVisibleCount(count);
    }
  }, [transactionType]);

  // Sync ordered categories when categories prop changes
  useEffect(() => {
    setOrderedCategories(categories);
    setLocalCategories(categories);
  }, [categories]);

  // Reset modal state when opened
  useEffect(() => {
    if (showSettings) {
      setLocalCategories([...orderedCategories]);
      setLocalVisibleCount(visibleCount);
      setHasChanges(false);
      setShowAddForm(false);
      setNewCategoryName('');
      setNewCategoryIcon(null);
      setShowIconPicker(false);
      setExpandedGroup(null);
      setIsDeleteMode(false);
      setCategoryToDelete(null);
    }
  }, [showSettings, orderedCategories, visibleCount]);

  // Focus input when add form opens
  useEffect(() => {
    if (showAddForm && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showAddForm]);

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        setDragOverIndex(index);
      }
    },
    [draggedIndex]
  );

  // Clean up drag state only - reorder happens in onDrop
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Create ghost element for touch dragging
  const createGhostElement = useCallback((sourceElement: HTMLElement, touch: React.Touch) => {
    // Remove existing ghost
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }

    const rect = sourceElement.getBoundingClientRect();
    const ghost = sourceElement.cloneNode(true) as HTMLDivElement;

    // Style the ghost element
    ghost.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.9;
      transform: scale(1.05);
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      border-radius: 12px;
      transition: transform 0.1s ease-out;
    `;

    document.body.appendChild(ghost);
    ghostRef.current = ghost;

    // Store offset from touch to element center
    initialTouchOffset.current = {
      x: touch.clientX - (rect.left + rect.width / 2),
      y: touch.clientY - (rect.top + rect.height / 2),
    };
  }, []);

  // Update ghost position
  const updateGhostPosition = useCallback((touch: React.Touch) => {
    if (!ghostRef.current || !initialTouchOffset.current) return;

    const element = ghostRef.current;
    const rect = element.getBoundingClientRect();
    const newX = touch.clientX - initialTouchOffset.current.x - rect.width / 2;
    const newY = touch.clientY - initialTouchOffset.current.y - rect.height / 2;

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;
  }, []);

  // Remove ghost element
  const removeGhostElement = useCallback(() => {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
    initialTouchOffset.current = null;
  }, []);

  // Touch handlers for mobile with long-press detection
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      const element = categoryItemRefs.current.get(index);
      if (element) {
        setDraggedIndex(index);
        setIsTouchDragging(true);
        createGhostElement(element, touch);

        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, LONG_PRESS_DURATION);
  }, [createGhostElement]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];

      // Cancel long press if moved before it triggers
      if (longPressTimer.current && touchStartPos.current) {
        const dx = Math.abs(touch.clientX - touchStartPos.current.x);
        const dy = Math.abs(touch.clientY - touchStartPos.current.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }

      if (draggedIndex === null || !categoryGridRef.current) return;

      // Prevent scrolling while dragging
      e.preventDefault();

      // Update ghost position
      updateGhostPosition(touch);

      const elements = categoryItemRefs.current;

      // Find which element the touch is over
      let foundIndex: number | null = null;
      for (const [idx, element] of elements.entries()) {
        if (!element || idx === draggedIndex) continue;
        const rect = element.getBoundingClientRect();

        // Check if touch is within element bounds with some tolerance
        const tolerance = 10;
        if (
          touch.clientX >= rect.left - tolerance &&
          touch.clientX <= rect.right + tolerance &&
          touch.clientY >= rect.top - tolerance &&
          touch.clientY <= rect.bottom + tolerance
        ) {
          foundIndex = idx;
          break;
        }
      }

      setDragOverIndex(foundIndex);
    },
    [draggedIndex, updateGhostPosition]
  );

  const handleTouchEnd = useCallback(() => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;

    // Perform reorder if valid
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newCategories = [...localCategories];
      const [removed] = newCategories.splice(draggedIndex, 1);
      newCategories.splice(dragOverIndex, 0, removed);
      setLocalCategories(newCategories);
      setHasChanges(true);

      // Haptic feedback on drop
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }

    // Cleanup
    removeGhostElement();
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsTouchDragging(false);
  }, [draggedIndex, dragOverIndex, localCategories, removeGhostElement]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
    removeGhostElement();
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsTouchDragging(false);
  }, [removeGhostElement]);

  // Cleanup ghost on unmount
  useEffect(() => {
    return () => {
      removeGhostElement();
    };
  }, [removeGhostElement]);

  const handleVisibleCountChange = useCallback((count: number) => {
    setLocalVisibleCount(count);
    setHasChanges(true);
  }, []);

  const handleAddCategory = useCallback(() => {
    const trimmedName = newCategoryName.trim();
    if (trimmedName && onAddCategory) {
      onAddCategory(trimmedName, transactionType as CategoryType, newCategoryIcon || undefined);
      setNewCategoryName('');
      setNewCategoryIcon(null);
      setShowIconPicker(false);
      setShowAddForm(false);
    }
  }, [newCategoryName, newCategoryIcon, onAddCategory, transactionType]);

  const handleSave = useCallback(() => {
    setOrderedCategories(localCategories);
    setVisibleCount(localVisibleCount);
    localStorage.setItem(`${VISIBLE_COUNT_KEY}-${transactionType}`, localVisibleCount.toString());

    if (onReorderCategories) {
      onReorderCategories(localCategories);
    }
    setShowSettings(false);
  }, [localCategories, localVisibleCount, transactionType, onReorderCategories]);

  // Delete handlers
  const handleDeleteClick = useCallback((category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToDelete(category);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (categoryToDelete && onDeleteCategory) {
      // Remove from local state immediately
      setLocalCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      // Delete from database
      onDeleteCategory(categoryToDelete.id);
      setHasChanges(true);
      setCategoryToDelete(null);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
    }
  }, [categoryToDelete, onDeleteCategory]);

  const handleCancelDelete = useCallback(() => {
    setCategoryToDelete(null);
  }, []);

  // Get visible categories for display
  const displayCategories = orderedCategories.slice(0, visibleCount);

  // Visible count options
  const visibleCountOptions = [5, 6, 7, 10, 12, 14];
  const uniqueOptions = [...new Set([...visibleCountOptions, localCategories.length])].filter(
    (n) => n <= localCategories.length
  );

  // Auto scroll to selected category
  useEffect(() => {
    if (selectedCategory && scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector(
        `[data-category-id="${selectedCategory.id}"]`
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedCategory]);

  return (
    <div className="relative border-b border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <button
          onClick={() => setShowCategorySelect(true)}
          className={cn(
            "flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 transition-all border border-border/50 shadow-xs",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            transactionType === 'expense'
              ? 'hover:text-expense'
              : 'hover:text-income'
          )}
        >
          <LayoutGrid className="size-3" />
          <span>เลือกหมวดหมู่อื่นๆ</span>
        </button>

        <div className="flex items-center gap-2">

          {/* Selected Category Badge */}
          {selectedCategory && (
            <div
              className={cn(
                'flex items-center px-2.5 py-1 rounded-full text-xs ',
                'animate-in slide-in-from-right-2 duration-300',
                'shadow-sm',
                transactionType === 'expense' && 'text-expense bg-expense/10',
                transactionType === 'income' && 'text-income bg-income/10'
              )}
            >
              <Check className="size-3" />
              <span className="flex size-5 items-center justify-center rounded-lg text-lg shrink-0 mr-1">
                {selectedCategory.icon || selectedCategory.name.charAt(0)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap max-w-[80px] truncate">
                {selectedCategory.name}
              </span>
            </div>
          )}

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className={cn(
              'group flex items-center gap-1.5 pl-2.5 py-1.5 rounded-xl',
              'text-xs font-medium transition-all duration-300',
              'border border-transparent',
              'hover:scale-105 active:scale-95',
              transactionType === 'expense'
                ? 'text-expense/70 hover:text-expense hover:bg-expense/10 hover:border-expense/30'
                : 'text-income/70 hover:text-income hover:bg-income/10 hover:border-income/30'
            )}
          >
            <Settings2 className="size-3.5 transition-transform duration-300 group-hover:rotate-90" />
            <span className="font-semibold">ตั้งค่า</span>
          </button>

        </div>
      </div>

      {/* Category Grid - Vertical with overflow-y-auto */}
      <div
        ref={scrollRef}
        className={cn(
          'relative px-4 py-1.5 scroll-smooth',
          'max-h-[175px] overflow-y-auto'
        )}
      >
        <div className="flex flex-wrap gap-1 content-start justify-between">
          {displayCategories.map((category, index) => {
            const isSelected = category.id === selectedCategory?.id;
            return (
              <button
                key={category.id}
                data-category-id={category.id}
                onClick={() => onSelect(category)}
                className={cn(
                  'group relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl',
                  'transition-all duration-300 w-[60px]',
                  'hover:bg-accent/50 active:scale-95',
                  isSelected &&
                  cn(
                    'ring-2 shadow-lg',
                    transactionType === 'expense' &&
                    'bg-expense/10 ring-expense/50 shadow-expense/20',
                    transactionType === 'income' &&
                    'bg-income/10 ring-income/50 shadow-income/20'
                  )
                )}
                style={{
                  animationDelay: `${index * 20}ms`,
                }}
              >
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl text-3xl font-semibold',
                    'transition-all duration-200',
                    'bg-muted/50',
                    isSelected && cn(
                      'scale-105 shadow-md',
                      transactionType === 'expense' && 'bg-expense/20 text-expense',
                      transactionType === 'income' && 'bg-income/20 text-income'
                    ),
                    !isSelected && 'group-hover:bg-muted'
                  )}
                >
                  {category.icon || category.name.charAt(0)}
                </div>
                <span
                  className={cn(
                    'text-[9px] font-medium text-muted-foreground whitespace-nowrap max-w-[56px] truncate',
                    isSelected && 'text-foreground font-semibold'
                  )}
                >
                  {category.name}
                </span>
              </button>
            );
          })}

        </div>
      </div>

      {/* Category Select Sheet */}
      <CategorySelectSheet
        open={showCategorySelect}
        onOpenChange={setShowCategorySelect}
        categories={categories}
        selectedCategory={selectedCategory}
        transactionType={transactionType}
        onSelect={onSelect}
      />

      {/* Settings Modal - Inline like showDeleteConfirm */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowSettings(false)}
        >
          <div
            className={cn(
              'relative w-full max-w-md overflow-hidden',
              'bg-card rounded-t-[2rem] sm:rounded-[2rem]',
              'shadow-2xl animate-in slide-in-from-bottom-8 duration-300',
              'max-h-[85vh] flex flex-col'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-20 overflow-hidden pointer-events-none">
              <div
                className={cn(
                  'absolute -top-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-20',
                  transactionType === 'expense' ? 'bg-expense' : 'bg-income'
                )}
              />
              <div
                className={cn(
                  'absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-15',
                  transactionType === 'expense' ? 'bg-expense' : 'bg-income'
                )}
              />
            </div>

            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-border" />
            </div>

            {/* Modal Header */}
            <div className="relative px-5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex size-11 items-center justify-center rounded-2xl shadow-lg',
                      transactionType === 'expense'
                        ? 'bg-expense/15 shadow-expense/20'
                        : 'bg-income/15 shadow-income/20'
                    )}
                  >
                    <Settings2
                      className={cn(
                        'size-5',
                        transactionType === 'expense' ? 'text-expense' : 'text-income'
                      )}
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">ตั้งค่าหมวดหมู่</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {transactionType === 'expense' ? 'รายจ่าย' : 'รายรับ'} •{' '}
                      {localCategories.length} หมวดหมู่
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {/* Visible Count Selector */}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">จำนวนที่แสดง</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {uniqueOptions.map((count) => (
                  <button
                    key={count}
                    onClick={() => handleVisibleCountChange(count)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                      'border-2',
                      localVisibleCount === count
                        ? cn(
                          'scale-105 shadow-md',
                          transactionType === 'expense'
                            ? 'border-expense bg-expense/15 text-expense shadow-expense/20'
                            : 'border-income bg-income/15 text-income shadow-income/20'
                        )
                        : 'border-border bg-muted/30 text-muted-foreground hover:border-foreground/30'
                    )}
                  >
                    {count === localCategories.length ? 'ทั้งหมด' : count}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Toggle - Delete / Reorder */}
            <div className="px-5 pb-3">
              <div className="flex items-center justify-between">
                {/* Delete Mode Toggle */}
                <button
                  onClick={() => setIsDeleteMode(!isDeleteMode)}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 rounded-xl',
                    'text-xs font-medium transition-all duration-300',
                    'border-2',
                    isDeleteMode
                      ? 'border-destructive/50 bg-destructive/10 text-destructive'
                      : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-destructive/30 hover:text-destructive'
                  )}
                >
                  {isDeleteMode ? (
                    <ToggleRight className="size-4" />
                  ) : (
                    <ToggleLeft className="size-4" />
                  )}
                  <Trash2 className={cn(
                    'size-3.5 transition-transform',
                    isDeleteMode && 'animate-pulse'
                  )} />
                  <span>{isDeleteMode ? 'โหมดลบเปิดอยู่' : 'โหมดลบ'}</span>
                </button>

                {/* Instruction Text */}
                <span className={cn(
                  "text-[10px] font-medium flex items-center gap-1 transition-colors",
                  isDeleteMode
                    ? 'text-destructive'
                    : isTouchDragging
                      ? transactionType === 'expense' ? 'text-expense' : 'text-income'
                      : 'text-muted-foreground'
                )}>
                  {isDeleteMode ? (
                    <>
                      <AlertTriangle className="size-2.5" />
                      กดเพื่อลบ
                    </>
                  ) : isTouchDragging ? (
                    <>
                      <Move className="size-2.5 animate-pulse" />
                      ลากไปวางตำแหน่งใหม่
                    </>
                  ) : (
                    <>
                      <GripVertical className="size-2.5" />
                      กดค้างเพื่อลาก
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Category Grid - Horizontal Rows with Scroll-Y */}
            <div
              className={cn(
                'flex-1 overflow-y-auto px-3 py-2 min-h-0 max-h-[40vh] relative',
                isTouchDragging && 'overflow-hidden'
              )}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
            >
              {/* Touch drag overlay indicator */}
              {isTouchDragging && (
                <div className={cn(
                  "absolute inset-0 z-40 pointer-events-none",
                  "bg-linear-to-b from-transparent via-transparent to-background/50",
                  "animate-in fade-in duration-200"
                )} />
              )}

              <div ref={categoryGridRef} className="flex flex-wrap gap-2 content-start relative z-10 justify-between">
                {localCategories.map((category, index) => {
                  const isVisible = index < localVisibleCount;
                  const isDragging = draggedIndex === index;
                  const isDragOver = dragOverIndex === index;

                  return (
                    <div
                      key={category.id}
                      ref={(el) => {
                        if (el) categoryItemRefs.current.set(index, el);
                      }}
                      draggable={!isTouchDragging}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', index.toString());
                        handleDragStart(index);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        handleDragOver(e, index);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (fromIndex !== index && !isNaN(fromIndex)) {
                          const newCategories = [...localCategories];
                          const [removed] = newCategories.splice(fromIndex, 1);
                          newCategories.splice(index, 0, removed);
                          setLocalCategories(newCategories);
                          setHasChanges(true);
                        }
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      className={cn(
                        'group relative flex flex-col items-center gap-1 p-2 rounded-xl',
                        'w-[70px] select-none',
                        'border-2 transition-all',
                        // Delete mode styling
                        isDeleteMode
                          ? cn(
                            'cursor-pointer hover:border-destructive/50 hover:bg-destructive/5',
                            'hover:shadow-lg hover:shadow-destructive/10',
                            'animate-in fade-in duration-200'
                          )
                          : 'cursor-grab active:cursor-grabbing hover:shadow-md',
                        // Touch dragging - disable pointer events on all items except the source
                        !isDeleteMode && isTouchDragging && draggedIndex !== null && 'touch-none pointer-events-none',
                        // Dragging item - make it semi-transparent (ghost follows finger)
                        !isDeleteMode && isDragging && cn(
                          'opacity-30 scale-95',
                          transactionType === 'expense'
                            ? 'border-expense/50 bg-expense/5'
                            : 'border-income/50 bg-income/5'
                        ),
                        // Drop target - highlight with animation
                        !isDeleteMode && isDragOver && cn(
                          'border-dashed scale-110 animate-pulse',
                          transactionType === 'expense'
                            ? 'border-expense bg-expense/20 shadow-lg shadow-expense/20'
                            : 'border-income bg-income/20 shadow-lg shadow-income/20'
                        ),
                        // Normal state
                        !isDragging && !isDragOver && (
                          isVisible
                            ? 'border-border/50 bg-card hover:border-foreground/30 hover:bg-accent/30 duration-200'
                            : 'border-transparent bg-muted/20 opacity-50 duration-200'
                        )
                      )}
                    >
                      {/* Order Badge */}
                      <div
                        className={cn(
                          'absolute -top-1.5 -left-1.5 size-4 rounded-full flex items-center justify-center',
                          'text-[10px] font-bold shadow-sm',
                          isVisible
                            ? transactionType === 'expense'
                              ? 'bg-expense text-white'
                              : 'bg-income text-white'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {index + 1}
                      </div>

                      {/* Delete Button - visible in delete mode */}
                      {isDeleteMode ? (
                        <button
                          onClick={(e) => handleDeleteClick(category, e)}
                          className={cn(
                            'absolute -top-2 -right-1 z-20',
                            'flex size-6 items-center justify-center rounded-full',
                            'bg-red-600 text-white shadow-lg shadow-destructive/30',
                            'transition-all duration-200',
                            'hover:scale-110 hover:shadow-xl hover:shadow-destructive/40',
                            'active:scale-95',
                            'animate-in zoom-in-50 duration-200'
                          )}
                        >
                          <X className="size-3.5" strokeWidth={3} />
                        </button>
                      ) : (
                        /* Drag Handle Icon - visible when not in delete mode */
                        <div className={cn(
                          "absolute top-1 right-1 transition-all duration-200",
                          "opacity-40 group-hover:opacity-100",
                          isDragOver && "opacity-100 scale-110"
                        )}>
                          <GripVertical className={cn(
                            "size-3",
                            isDragOver
                              ? transactionType === 'expense' ? 'text-expense' : 'text-income'
                              : 'text-muted-foreground'
                          )} />
                        </div>
                      )}

                      {/* Category Icon */}
                      <div
                        className={cn(
                          'flex size-10 items-center justify-center rounded-xl text-3xl font-bold',
                          'transition-all duration-200',
                          isVisible
                            ? cn(
                              'shadow-sm',
                              transactionType === 'expense'
                                ? 'bg-expense/20 text-expense'
                                : 'bg-income/20 text-income'
                            )
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {category.icon || category.name.charAt(0)}
                      </div>

                      {/* Category Name */}
                      <span
                        className={cn(
                          'text-[9px] font-medium text-center truncate w-full',
                          isVisible ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {category.name}
                      </span>

                      {/* Visibility Indicator */}
                      {!isVisible && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                          <EyeOff className="size-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Category Section */}
            <div className="px-3 py-2 border-t border-border/50 bg-muted/10">
              {showAddForm ? (
                <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-1.5">
                    <Tag
                      className={cn(
                        'size-3.5',
                        transactionType === 'expense' ? 'text-expense' : 'text-income'
                      )}
                    />
                    <span className="text-xs font-medium">เพิ่มหมวดหมู่ใหม่ และเลือกไอคอน</span>
                  </div>
                  <div className="flex gap-2">
                    {/* Icon Selector Button */}
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className={cn(
                        'relative flex size-10 items-center justify-center rounded-xl shrink-0',
                        'border-2 transition-all duration-200 cursor-pointer',
                        'text-base group',
                        'hover:scale-105 active:scale-95',
                        showIconPicker
                          ? transactionType === 'expense'
                            ? 'border-expense bg-expense/10 shadow-sm shadow-expense/20'
                            : 'border-income bg-income/10 shadow-sm shadow-income/20'
                          : 'border-border hover:border-primary/50 bg-muted/50 hover:bg-muted'
                      )}
                      title="คลิกเพื่อเลือกไอคอน"
                    >
                      <span className="text-base">
                        {newCategoryIcon || (newCategoryName ? newCategoryName.charAt(0).toUpperCase() : '📦')}
                      </span>
                      {/* Edit indicator */}
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full',
                        'flex items-center justify-center',
                        'border-2 border-background',
                        'transition-all duration-200',
                        showIconPicker
                          ? transactionType === 'expense'
                            ? 'bg-expense'
                            : 'bg-income'
                          : 'bg-primary/60 group-hover:bg-primary'
                      )}>
                        {showIconPicker ? (
                          <ChevronUp className="size-2 text-white" />
                        ) : (
                          <ChevronDown className="size-2 text-white" />
                        )}
                      </div>
                    </button>

                    <div className="relative flex-1">
                      <Input
                        ref={inputRef}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newCategoryName.trim()) {
                            handleAddCategory();
                          }
                          if (e.key === 'Escape') {
                            setShowAddForm(false);
                            setNewCategoryName('');
                            setNewCategoryIcon(null);
                            setShowIconPicker(false);
                          }
                        }}
                        placeholder="ชื่อหมวดหมู่..."
                        className={cn(
                          'h-10 rounded-xl border-2 pl-3 pr-3 text-sm',
                          transactionType === 'expense'
                            ? 'focus:border-expense'
                            : 'focus:border-income'
                        )}
                        maxLength={30}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCategoryName('');
                        setNewCategoryIcon(null);
                        setShowIconPicker(false);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                    <Button
                      disabled={!newCategoryName.trim()}
                      onClick={handleAddCategory}
                      className={cn(
                        'h-10 w-10 rounded-xl text-white shrink-0',
                        transactionType === 'expense'
                          ? 'bg-expense hover:bg-expense/90 disabled:bg-expense/40'
                          : 'bg-income hover:bg-income/90 disabled:bg-income/40'
                      )}
                    >
                      <Check className="size-4" />
                    </Button>
                  </div>

                  {/* Icon Picker - Grouped */}
                  {showIconPicker && (
                    <div className={cn(
                      'rounded-2xl border border-border/30 bg-linear-to-b from-background to-muted/20',
                      'max-h-[280px] overflow-hidden',
                      'animate-in slide-in-from-top-2 duration-300',
                      'shadow-lg shadow-black/5'
                    )}>
                      {/* Group Tabs - Horizontal Scroll */}
                      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide border-b border-border/30 bg-muted/30">
                        {iconGroups.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0',
                              'text-xs font-medium transition-all duration-200',
                              'hover:scale-105 active:scale-95',
                              expandedGroup === group.id
                                ? 'text-white shadow-md'
                                : 'bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background'
                            )}
                            style={{
                              backgroundColor: expandedGroup === group.id ? group.color : undefined,
                              boxShadow: expandedGroup === group.id ? `0 4px 12px ${group.color}40` : undefined,
                            }}
                          >
                            <span className="text-sm">{group.emoji}</span>
                            <span className={cn(
                              'transition-all duration-200',
                             'max-w-[80px] opacity-100' 
                            )}>
                              {group.name}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Icons Grid */}
                      <div className="p-2 max-h-[200px] overflow-y-auto">
                        {expandedGroup ? (
                          // Show selected group's icons
                          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {iconGroups
                              .filter(g => g.id === expandedGroup)
                              .map((group) => (
                                <div key={group.id}>
                                  <div className="grid grid-cols-6 gap-1.5">
                                    {group.icons.map((icon, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          setNewCategoryIcon(icon);
                                          setShowIconPicker(false);
                                          setExpandedGroup(null);
                                        }}
                                        className={cn(
                                          'flex size-11 items-center justify-center rounded-xl text-3xl',
                                          'transition-all duration-150',
                                          'hover:scale-110 active:scale-95',
                                          newCategoryIcon === icon
                                            ? 'ring-2 shadow-md'
                                            : 'bg-muted/40 hover:bg-muted'
                                        )}
                                        style={{
                                          backgroundColor: newCategoryIcon === icon ? `${group.color}20` : undefined,
                                          boxShadow: newCategoryIcon === icon ? `0 2px 8px ${group.color}30` : undefined,
                                          // @ts-expect-error CSS custom property for ring color
                                          '--tw-ring-color': newCategoryIcon === icon ? group.color : undefined,
                                        }}
                                      >
                                        {icon}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          // Show all groups preview
                          <div className="space-y-3">
                            {iconGroups.map((group) => (
                              <button
                                key={group.id}
                                type="button"
                                onClick={() => setExpandedGroup(group.id)}
                                className={cn(
                                  'w-full flex items-center gap-3 p-2 rounded-xl',
                                  'bg-muted/30 hover:bg-muted/50',
                                  'transition-all duration-200',
                                  'hover:scale-[1.01] active:scale-[0.99]',
                                  'group'
                                )}
                              >
                                {/* Group Icon */}
                                <div
                                  className="flex size-9 items-center justify-center rounded-lg text-lg shrink-0 shadow-sm"
                                  style={{ backgroundColor: `${group.color}20` }}
                                >
                                  {group.emoji}
                                </div>

                                {/* Group Name & Preview Icons */}
                                <div className="flex-1 flex items-center justify-between min-w-0">
                                  <span className="text-xs font-medium text-foreground">{group.name}</span>
                                  <div className="flex items-center gap-0.5">
                                    {group.icons.slice(0, 5).map((icon, idx) => (
                                      <span
                                        key={idx}
                                        className="text-sm opacity-60 group-hover:opacity-100 transition-opacity"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                      >
                                        {icon}
                                      </span>
                                    ))}
                                    <span className="text-[10px] text-muted-foreground ml-1">
                                      +{group.icons.length - 5}
                                    </span>
                                  </div>
                                </div>

                                {/* Arrow */}
                                <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className={cn(
                    'w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl',
                    'border-2 border-dashed transition-all duration-200',
                    'text-xs font-medium',
                    'hover:scale-[1.01] active:scale-[0.99]',
                    transactionType === 'expense'
                      ? 'border-expense/30 text-expense hover:border-expense hover:bg-expense/5'
                      : 'border-income/30 text-income hover:border-income hover:bg-income/5'
                  )}
                >
                  <Plus className="size-3.5" />
                  เพิ่มหมวดหมู่ใหม่
                </button>
              )}
            </div>

            {/* Delete Confirmation Dialog */}
            {categoryToDelete && (
              <div
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200 rounded-t-[2rem] sm:rounded-[2rem]"
                onClick={handleCancelDelete}
              >
                <div
                  className="mx-6 w-full max-w-xs overflow-hidden rounded-3xl bg-card shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                  onClick={(e) => e.stopPropagation()}
                >

                  <div className="p-5">
                    {/* Icon & Title */}
                    <div className="flex flex-col items-center text-center mb-4">
                      <div className="relative mb-3">
                        <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative flex size-16 items-center justify-center rounded-full bg-destructive/15 ring-4 ring-destructive/10">
                          <Trash2 className="size-7 text-destructive" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        คุณต้องการลบ
                      </p>
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        ลบหมวดหมู่?
                      </h3>
                    </div>

                    {/* Category Preview */}
                    <div className={cn(
                      'flex items-center gap-3 p-3 rounded-lg mb-4',
                      'bg-destructive/5 border-2 border-destructive/20'
                    )}>
                      <div className={cn(
                        'flex size-12 items-center justify-center rounded-xl text-lg font-bold',
                        transactionType === 'expense'
                          ? 'bg-expense/20 text-expense'
                          : 'bg-income/20 text-income'
                      )}>
                        {categoryToDelete.icon || categoryToDelete.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {categoryToDelete.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transactionType === 'expense' ? 'หมวดหมู่รายจ่าย' : 'หมวดหมู่รายรับ'}
                        </p>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                      <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        การลบหมวดหมู่นี้จะไม่สามารถกู้คืนได้ <br />
                        ข้อมูลจะถูกลบออกจากระบบ
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 rounded-xl border-2 font-semibold"
                        onClick={handleCancelDelete}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        variant="destructive"
                        className={cn(
                          'flex-1 h-11 rounded-xl font-semibold',
                          'bg-destructive hover:bg-destructive/90',
                          'shadow-lg shadow-destructive/30'
                        )}
                        onClick={handleConfirmDelete}
                      >
                        <Trash2 className="size-4 mr-1.5" />
                        ลบเลย
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="px-3 pb-5 pt-2 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl border-2 font-semibold"
                onClick={() => setShowSettings(false)}
              >
                ยกเลิก
              </Button>
              <Button
                disabled={!hasChanges}
                onClick={handleSave}
                className={cn(
                  'flex-1 h-11 rounded-xl font-semibold text-white',
                  'transition-all duration-200 disabled:opacity-50',
                  hasChanges && 'shadow-lg',
                  transactionType === 'expense'
                    ? cn('bg-expense hover:bg-expense/90', hasChanges && 'shadow-expense/30')
                    : cn('bg-income hover:bg-income/90', hasChanges && 'shadow-income/30')
                )}
              >
                <Sparkles className="size-3.5 mr-1.5" />
                บันทึก
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
