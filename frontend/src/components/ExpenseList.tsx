import { Expense } from "../Types/types";

interface ExpenseListProps {
    expenses: Expense[];
    onDelete: (id: number) => void;
    onEdit: (expense: Expense) => void;
}

function ExpenseList({ expenses, onDelete, onEdit }: ExpenseListProps) {
    if (expenses.length === 0) {
        return <p className="text-center text-gray-600 mt-6">Aucune dépense à afficher.</p>;
    }

    return (
        // 👉 conteneur avec taille fixe et scroll
        <div className=" h-auto overflow-y-auto pr-2">
            <ul className="space-y-4">
                {expenses.map((expense) => {
                    const amount = Number(expense.amount) || 0;
                    return (
                        <li
                            key={expense.id}
                            className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md"
                        >
                            <div>
                                <p className="font-semibold text-lg">{expense.label}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(expense.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span
                                    className={`text-xl font-bold ${amount < 0 ? "text-red-500" : "text-green-500"}`}
                                >
                                    {amount.toFixed(2)} €
                                </span>
                                <button
                                    onClick={() => onEdit(expense)}
                                    className="text-blue-500 hover:underline text-sm"
                                >
                                    Modifier
                                </button>
                                <button
                                    onClick={() => onDelete(expense.id)}
                                    className="text-red-500 hover:underline text-sm"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default ExpenseList;
