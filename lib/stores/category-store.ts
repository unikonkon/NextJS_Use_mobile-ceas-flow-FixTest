import { create } from 'zustand';
import type { Category } from '@/types';
import { db, toStoredCategory, fromStoredCategory } from './db';
import {
  expenseCategories as defaultExpenseCategories,
  incomeCategories as defaultIncomeCategories,
  enrichCategory,
} from '@/lib/constants/categories';

// ============================================
// Store Interface
// ============================================
interface CategoryInput {
  name: string;
  type: 'expense' | 'income';
  icon?: string;
}

interface CategoryStore {
  // Data
  expenseCategories: Category[];
  incomeCategories: Category[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  loadCategories: () => Promise<void>;
  addCategory: (input: CategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getAllCategories: () => Category[];
  reorderCategories: (type: 'expense' | 'income', categories: Category[]) => Promise<void>;

  // V5: Note Management
  addNoteToCategory: (categoryId: string, note: string) => Promise<void>;
  getNotesForCategory: (categoryId: string) => string[];
  removeNoteFromCategory: (categoryId: string, note: string) => Promise<void>;
}

// ============================================
// Create Store
// ============================================
export const useCategoryStore = create<CategoryStore>((set, get) => ({
  // Initial State
  expenseCategories: [],
  incomeCategories: [],
  isLoading: false,
  isInitialized: false,

  // Actions
  loadCategories: async () => {
    // Prevent multiple loads
    if (get().isLoading || get().isInitialized) return;

    set({ isLoading: true });

    try {
      // Load from IndexedDB
      const storedCategories = await db.categories.toArray();

      if (storedCategories.length === 0) {
        // Seed with default categories from constants on first run
        const allDefaultCategories = [
          ...defaultExpenseCategories,
          ...defaultIncomeCategories,
        ];

        // Store to IndexedDB (only name, type, order - not icon/color)
        await db.categories.bulkPut(
          allDefaultCategories.map(toStoredCategory)
        );

        set({
          expenseCategories: defaultExpenseCategories,
          incomeCategories: defaultIncomeCategories,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        // Convert stored categories back to runtime format, enrich with icon/color, and sort by order
        const categories = storedCategories
          .map(fromStoredCategory)
          .map(enrichCategory); // Add icon/color from constants
        const expense = categories
          .filter((c) => c.type === 'expense')
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const income = categories
          .filter((c) => c.type === 'income')
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        set({
          expenseCategories: expense,
          incomeCategories: income,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to default categories from constants
      set({
        expenseCategories: defaultExpenseCategories,
        incomeCategories: defaultIncomeCategories,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  addCategory: async (input) => {
    const { expenseCategories, incomeCategories } = get();
    const existingCategories = input.type === 'expense' ? expenseCategories : incomeCategories;

    // Create base category with optional custom icon
    const baseCategory: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: input.name,
      type: input.type,
      order: existingCategories.length, // Add at end
      icon: input.icon, // Store custom icon if provided
    };

    // Enrich with icon/color from constants for UI display (will use custom icon if set)
    const newCategory = enrichCategory(baseCategory);

    // Update Zustand state immediately (with enriched data)
    if (input.type === 'expense') {
      set((state) => ({
        expenseCategories: [...state.expenseCategories, newCategory],
      }));
    } else {
      set((state) => ({
        incomeCategories: [...state.incomeCategories, newCategory],
      }));
    }

    // Persist to IndexedDB (includes icon if provided)
    try {
      await db.categories.put(toStoredCategory(baseCategory));
    } catch (error) {
      console.error('Failed to persist category:', error);
    }

    return newCategory;
  },

  deleteCategory: async (id: string) => {
    const { expenseCategories, incomeCategories } = get();

    // Find which list contains the category
    const isExpense = expenseCategories.some((c) => c.id === id);

    // Update Zustand state immediately
    if (isExpense) {
      const updated = expenseCategories
        .filter((c) => c.id !== id)
        .map((cat, index) => ({ ...cat, order: index }));
      set({ expenseCategories: updated });
    } else {
      const updated = incomeCategories
        .filter((c) => c.id !== id)
        .map((cat, index) => ({ ...cat, order: index }));
      set({ incomeCategories: updated });
    }

    // Delete from IndexedDB
    try {
      await db.categories.delete(id);
    } catch (error) {
      console.error('Failed to delete category from DB:', error);
    }
  },

  getCategoryById: (id: string) => {
    const { expenseCategories, incomeCategories } = get();
    return (
      expenseCategories.find((c) => c.id === id) ||
      incomeCategories.find((c) => c.id === id)
    );
  },

  getAllCategories: () => {
    const { expenseCategories, incomeCategories } = get();
    return [...expenseCategories, ...incomeCategories];
  },

  reorderCategories: async (type, categories) => {
    // Update order field for each category based on new position
    const orderedCategories = categories.map((cat, index) => ({
      ...cat,
      order: index,
    }));

    // Update Zustand state immediately
    if (type === 'expense') {
      set({ expenseCategories: orderedCategories });
    } else {
      set({ incomeCategories: orderedCategories });
    }

    // Persist new order to IndexedDB
    try {
      const { expenseCategories, incomeCategories } = get();
      const allCategories = [...expenseCategories, ...incomeCategories];

      // Update each category with its order
      await db.categories.bulkPut(
        allCategories.map((cat, index) => toStoredCategory(cat, cat.order ?? index))
      );
    } catch (error) {
      console.error('Failed to persist category order:', error);
    }
  },

  // V5: Add note to category
  addNoteToCategory: async (categoryId: string, note: string) => {
    if (!note || note.trim() === '') return;

    const trimmedNote = note.trim();
    const { expenseCategories, incomeCategories } = get();

    let category = expenseCategories.find((c) => c.id === categoryId);
    let isExpense = true;

    if (!category) {
      category = incomeCategories.find((c) => c.id === categoryId);
      isExpense = false;
    }

    if (!category) return;

    const currentNotes = category.notes || [];

    // Skip if note already exists
    if (currentNotes.includes(trimmedNote)) return;

    // Add note with FIFO limit of 50
    const MAX_NOTES = 50;
    let updatedNotes = [...currentNotes, trimmedNote];
    if (updatedNotes.length > MAX_NOTES) {
      updatedNotes = updatedNotes.slice(-MAX_NOTES);
    }

    const updatedCategory: Category = {
      ...category,
      notes: updatedNotes,
    };

    if (isExpense) {
      set({
        expenseCategories: expenseCategories.map((c) =>
          c.id === categoryId ? updatedCategory : c
        ),
      });
    } else {
      set({
        incomeCategories: incomeCategories.map((c) =>
          c.id === categoryId ? updatedCategory : c
        ),
      });
    }

    try {
      await db.categories.put(toStoredCategory(updatedCategory));
    } catch (error) {
      console.error('Failed to add note to category:', error);
    }
  },

  // V5: Get notes for a category
  getNotesForCategory: (categoryId: string) => {
    const { expenseCategories, incomeCategories } = get();
    const category =
      expenseCategories.find((c) => c.id === categoryId) ||
      incomeCategories.find((c) => c.id === categoryId);
    return category?.notes || [];
  },

  // V5: Remove note from category
  removeNoteFromCategory: async (categoryId: string, note: string) => {
    const { expenseCategories, incomeCategories } = get();

    let category = expenseCategories.find((c) => c.id === categoryId);
    let isExpense = true;

    if (!category) {
      category = incomeCategories.find((c) => c.id === categoryId);
      isExpense = false;
    }

    if (!category) return;

    const updatedCategory: Category = {
      ...category,
      notes: (category.notes || []).filter((n) => n !== note),
    };

    if (isExpense) {
      set({
        expenseCategories: expenseCategories.map((c) =>
          c.id === categoryId ? updatedCategory : c
        ),
      });
    } else {
      set({
        incomeCategories: incomeCategories.map((c) =>
          c.id === categoryId ? updatedCategory : c
        ),
      });
    }

    try {
      await db.categories.put(toStoredCategory(updatedCategory));
    } catch (error) {
      console.error('Failed to remove note from category:', error);
    }
  },
}));
