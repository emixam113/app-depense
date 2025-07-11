import React, { useMemo } from 'react';
import { Expense } from '../Types/types';

interface CategorySummaryProps {
  expenses: Expense[];
}

const CategorySummary: React.FC<CategorySummaryProps> = ({ expenses }) => {
  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, Expense[]> = {};

    expenses.forEach((expense) => {
      const catName =
        typeof expense.category === 'string'
          ? expense.category
          : expense.category?.name || 'Sans catégorie';

      if (!grouped[catName]) {
        grouped[catName] = [];
      }

      grouped[catName].push(expense);
    });

    return grouped;
  }, [expenses]);

  const hasData = Object.keys(groupedByCategory).length > 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Dépenses par catégorie</h2>

      {!hasData ? (
        <p className="text-gray-500">Aucune dépense à afficher</p>
      ) : (
        Object.entries(groupedByCategory).map(([category, items]) => {
          // Calcul du total (les dépenses sont déjà en valeurs négatives)
          const total = items.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

          return (
            <div key={category} className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{category}</h3>
                <span
                  className={`text-sm ${
                    total < 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {total.toFixed(2)} €
                </span>
              </div>

              <ul className="space-y-1 text-sm text-gray-700">
                {items.map((expense, idx) => {
                  const amount = Number(expense.amount) || 0;
                  return (
                    <li
                      key={idx}
                      className="flex justify-between border-b pb-1"
                    >
                      <span>{expense.label || 'Dépense'}</span>
                      <span
                        className={amount < 0 ? 'text-red-600' : 'text-green-600'}
                      >
                        {amount.toFixed(2)} €
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CategorySummary;
