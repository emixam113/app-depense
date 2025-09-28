import { useState } from "react";
import { Expense } from "../Types/types";

interface AddExpenseProps {
    onAdd: (expense: Expense) => void;
    userId: string;
    onUpdate: () => void;
    categories: { id: number; name: string }[];
}

export default function AddExpense({ onAdd, userId, onUpdate, categories }: AddExpenseProps) {
    const [form, setForm] = useState({
        label: "",
        amount: "",
        type: "expense", // ✅ par défaut une dépense
        categoryId: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newExpense: Expense = {
            id: Date.now(), // provisoire, backend doit générer
            label: form.label,
            amount: Number(form.amount),
            type: form.type as "expense" | "income",
            date: new Date().toISOString(), // ✅ ajout de la date locale
            category: categories.find((c) => c.id === Number(form.categoryId)),
        };

        // 👉 envoie vers le backend
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/expenses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                label: form.label,
                amount: Number(form.amount),
                type: form.type,
                date: new Date().toISOString(), // ✅ envoi obligatoire pour @IsDateString
                categoryId: Number(form.categoryId),
                userId: Number(userId),
            }),
        });

        if (!res.ok) {
            console.error("Erreur lors de l’ajout de la dépense");
            return;
        }

        const saved = await res.json();
        onAdd(saved); // ✅ ajoute à l’état parent
        onUpdate();

        // reset form
        setForm({ label: "", amount: "", type: "expense", categoryId: "" });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input
                type="text"
                name="label"
                value={form.label}
                onChange={handleChange}
                placeholder="Libellé"
                required
                className="border rounded p-2 w-full"
            />

            <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="Montant"
                required
                className="border rounded p-2 w-full"
            />

            {/* ✅ Boutons radio adaptés */}
            <div className="flex gap-4">
                <label>
                    <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={form.type === "expense"}
                        onChange={handleChange}
                    />{" "}
                    Dépense
                </label>
                <label>
                    <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={form.type === "income"}
                        onChange={handleChange}
                    />{" "}
                    Revenu
                </label>
            </div>

            <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="border rounded p-2 w-full"
            >
                <option value="">-- Choisir une catégorie --</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                ))}
            </select>

            <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            >
                Ajouter
            </button>
        </form>
    );
}
