// Interface pour une catégorie
export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Expense {
  id: number;
  label: string;
  amount: number;
  date: string;
  category: Category | null;
  type: 'expense' | 'income';
}

export interface CategoryListProps {
  token: string | null;
}
