import { useEffect, useState } from "react";
import { Expense } from "../Types/types";

interface Props {
    expense: Expense;
    onClose: () => void;
    onSave: (updated: Expense) => void;
    token: string | null;
}

interface Category {
    id: number;
    name: string;
    color: string;
}

const EditExpenseModal = ({ expense, onClose, onSave, token }: Props) => {
    const [form, setForm] = useState({
        label: expense.label,
        amount: expense.amount,
        date: expense.date,
        type: expense.type,
        categoryId: expense.category ? expense.category.id : null,
    });

    const [categories, setCategories] = useState<Category[]>([]);

    // Charger les catégories depuis le backend
    useEffect(() => {
        const fetchCategories = async () => {
            if (!token) return;
            try {
                const res = await fetch("http://localhost:3000/categories", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Erreur lors du chargement des catégories");
                const data: Category[] = await res.json();
                setCategories(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCategories();
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!token) return alert("Non authentifié");

        const payload = {
            label: form.label,
            amount: Number(form.amount),
            date: new Date(form.date).toISOString(), //conversion ISO pour la date;
            type: form.type,
            categoryId: form.categoryId ? Number(form.categoryId) : null,
        }

        const res = await fetch(`http://localhost:3000/expenses/${expense.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) return alert("Erreur lors de la modification");

        const updated: Expense = await res.json();
        onSave(updated);
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-lg font-semibold mb-4">Modifier la dépense</h2>

                {/* Libellé */}
                <input
                    type="text"
                    name="label"
                    value={form.label}
                    onChange={handleChange}
                    placeholder="Libellé"
                    className="border p-2 w-full mb-3 rounded"
                />

                {/* Montant */}
                <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Montant"
                    className="border p-2 w-full mb-3 rounded"
                />

                {/* Date */}
                <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="border p-2 w-full mb-3 rounded"
                />

                {/* Type */}
                <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="border p-2 w-full mb-3 rounded"
                >
                    <option value="expense">Dépense</option>
                    <option value="income">Revenu</option>
                </select>

                {/* Catégorie */}
                <select
                    name="categoryId"
                    value={form.categoryId ?? ""}
                    onChange={handleChange}
                    className="border p-2 w-full mb-3 rounded"
                >
                    <option value="">-- Choisir une catégorie --</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                {/* Pastilles couleurs en aperçu */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded border ${
                                form.categoryId === cat.id ? "border-emerald-500" : "border-gray-300"
                            }`}
                            onClick={() => setForm({ ...form, categoryId: cat.id })}
                        >
              <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: cat.color }}
              ></span>
                            <span>{cat.name}</span>
                        </div>
                    ))}
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    >
                        Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditExpenseModal;
