import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Category from "../components/Category";
import { Expense } from "../Types/types";
import { Graph } from "../components/Graph";
import AddExpense from "../components/AddExpense";
import ExpenseList from "../components/ExpenseList";
import CategoryList from "../components/CategoryList";
import EditExpenseModal from "../components/EditExpenseModal";

const Dashboard = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [user, setUser] = useState<{ firstname: string; lastname: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    // Total des dépenses
    const total = useMemo(
        () => expenses.reduce((sum, expense) => sum + (Number(expense?.amount) || 0), 0),
        [expenses]
    );

    // Données du graphique
    const categoryData = useMemo(() => {
        return expenses.reduce((acc, item) => {
            const cat =
                typeof item.category === "string"
                    ? item.category
                    : item.category?.name || "Sans catégorie";
            acc[cat] = (acc[cat] || 0) + (Number(item.amount) || 0);
            return acc;
        }, {} as Record<string, number>);
    }, [expenses]);

    // Chargement initial : utilisateur + dépenses
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = localStorage.getItem("user");
                if (userData) {
                    const parsed = JSON.parse(userData);
                    setUser({
                        firstname: parsed.firstname || "Utilisateur",
                        lastname: parsed.lastname || "",
                    });
                }

                if (!token) throw new Error("Non authentifié");

                const res = await fetch("http://localhost:3000/expenses", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Erreur lors du chargement des dépenses");

                const data: Expense[] = await res.json();
                setExpenses(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Une erreur est survenue");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const formatAmount = (amount: number) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);

    // Gestion suppression dépense côté backend
    const handleDeleteExpense = async (id: number) => {
        if (!token) return alert("Non authentifié");
        try {
            const res = await fetch(`http://localhost:3000/expenses/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Erreur lors de la suppression");

            setExpenses((prev) => prev.filter((expense) => expense.id !== id));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Une erreur est survenue");
        }
    };

    // Ouverture modale édition
    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
    };

    // Sauvegarde après édition
    const handleSaveExpense = (updated: Expense) => {
        setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setEditingExpense(null);
    };

    // Gestion ajout dépense côté backend
    const handleAddExpense = async (expenses: Expense) => {
        if (!token) return alert("Non authentifié");
        try {
            // DTO attendu par le backend
            const expenseDto = {
                label: expenses.label,
                amount: expenses.amount,
                date: expenses.date,
                type: expenses.type,
                categoryId: expenses.category ? expenses.category.id : null,
                userId: expenses.userId ?? undefined,
            };

            const res = await fetch("http://localhost:3000/expenses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(expenseDto),
            });

            if (!res.ok) throw new Error("Erreur lors de l'ajout de la dépense");

            const newExpense: Expense = await res.json();
            setExpenses((prev) => [...prev, newExpense]);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Une erreur est survenue");
        }
    };

    if (isLoading)
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                {error}
            </div>
        );

    return (
        <div className="min-h-screen bg-emerald-400 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header utilisateur + bouton déconnexion */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">
                        Bonjour, {user?.firstname} {user?.lastname}
                    </h1>
                    <button
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/login");
                        }}
                    >
                        Déconnexion
                    </button>
                </div>

                {/* Solde actuel */}
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <h2 className="text-xl font-semibold">Solde actuel</h2>
                    <p className="text-3xl font-bold text-green-600">{formatAmount(total)}</p>
                </div>

                {/* Graphique + Liste des dépenses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">Dépenses par catégorie</h3>
                        <Graph data={categoryData} />
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">Liste des dépenses</h3>
                        <ExpenseList
                            expenses={expenses}
                            onEdit={handleEditExpense}
                            onDelete={handleDeleteExpense}
                        />
                    </div>
                </div>

                {/* Ajouter une dépense */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3">Ajouter une dépense</h3>
                    <AddExpense onAdd={handleAddExpense} />
                </div>

                {/* Gérer les catégories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-3">Gérer les catégories</h3>
                        <Category />
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-3">Liste des Catégories</h3>
                        <CategoryList token={token} />
                    </div>
                </div>
            </div>

            {/* Modale d’édition */}
            {editingExpense && (
                <EditExpenseModal
                    expense={editingExpense}
                    onClose={() => setEditingExpense(null)}
                    onSave={handleSaveExpense}
                    token={token}
                />
            )}
        </div>
    );
};

export default Dashboard;
