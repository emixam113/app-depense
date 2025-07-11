export interface Category {
  id: number;
  name: string;
  // Ajoutez d'autres propriétés de catégorie si nécessaire
}

export interface Expense {
  id: number;
  label: string;
  amount: number;
  date: string;
  category: Category | null;
  type: 'expense' | 'income';
  // Ajoutez d'autres propriétés si nécessaire
}
