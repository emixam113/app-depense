import { useState } from "react";
import { Expense, Category } from "../Types/types";

interface AddExpenseProps {
    onAdd: (expense: Expense) => void;
    userId: string;
    onUpdate: (expense: Expense) => void;
    categories: Category[];
}

function AddExpense({ onAdd, userId, categories }: AddExpenseProps) {
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const amountValue = parseFloat(amount);

        if (isNaN(amountValue) || amountValue <= 0) {
            setError("Veuillez entrer un montant valide supérieur à 0");
            setIsSubmitting(false);
            return;
        }

        if (!desc.trim()) {
            setError("Veuillez entrer une description");
            setIsSubmitting(false);
            return;
        }

        if (!categoryId) {
            setError("Veuillez sélectionner une catégorie");
            setIsSubmitting(false);
            return;
        }

        const expenseData = {
            label: desc,
            amount: transactionType === "expense" ? -Math.abs(amountValue) : Math.abs(amountValue),
            date: new Date().toISOString(),
            categoryId: parseInt(categoryId, 10),
            type: transactionType,
            userId: parseInt(userId, 10),
        };

        const token = localStorage.getItem("token");
        if (!token) {
            setError("Session expirée. Veuillez vous reconnecter.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/expenses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(expenseData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Erreur lors de l'ajout de la dépense");
            }

            const createdExpense = await response.json();
            onAdd(createdExpense);

            // Reset du formulaire
            setDesc("");
            setAmount("");
            setCategoryId("");

            // ✅ Message de succès
            setSuccess("✅ Dépense ajoutée avec succès !");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Erreur lors de l'ajout de la dépense:", err);
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
            {/* Message d'erreur */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Message de succès */}
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {success}
                </div>
            )}

            {/* Type de transaction */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de transaction</label>
                <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio"
                            checked={transactionType === "expense"}
                            onChange={() => setTransactionType("expense")}
                        />
                        <span className="ml-2">Revenu</span>
                    </label>
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio"
                            checked={transactionType === "income"}
                            onChange={() => setTransactionType("income")}
                        />
                        <span className="ml-2">Dépense</span>
                    </label>
                </div>
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <input
                    id="description"
                    type="text"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Ex: Courses, Abonnement..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                    required
                />
            </div>

            {/* Montant */}
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Montant
                </label>
                <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 10.50"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                    required
                />
            </div>

            {/* Catégorie */}
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Catégorie
                </label>
                <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                    required
                >
                    {categories.length === 0 ? (
                        <option value="">⚠️ Aucune catégorie disponible (ajoutez-en d'abord)</option>
                    ) : (
                        <>
                            <option value="">Sélectionnez une catégorie</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </>
                    )}
                </select>
            </div>

            {/* Bouton */}
            <div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-white text-sm font-medium ${
                        isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    {isSubmitting ? "Ajout en cours..." : "Ajouter la dépense"}
                </button>
            </div>
        </form>
    );
}

export default AddExpense;
