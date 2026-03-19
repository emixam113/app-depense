export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Expense{
	id: number;
	label: string;
	amount: number;
	date: string;
	type: string;
	category?: {name: string}
}

export interface CategoryListProps {
  token: string | null;
}
