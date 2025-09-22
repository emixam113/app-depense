import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AddExpense from "../components/AddExpense";
import EditExpenseModal from "../components/EditExpenseModal";
import CategoryList, { Category } from "../components/CategoryList";
import Graph from "../components/Graph";
import { Expense } from "../Types/types";
import { useAccessibility } from "../Context/AccessibilityContext.tsx"// ✅ import toggle

export default function Dashboard() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [user, setUser] = useState<{ firstname: string; lastname: string; id?: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    // ✅ accessibilité
    const { accessibleFont, toggleFont } = useAccessibility();

    // --- Calcul solde total ---
    const total = useMemo(
        () => expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
        [expenses]
    );

    // --- Revenus par source ---
    const revenusData = useMemo(() => {
        const data: Record<string, number> = {};
        expenses
            .filter((exp) => exp.amount > 0)
            .forEach((exp) => {
                const catName = exp.category?.name || "Autre revenu";
                data[catName] = (data[catName] || 0) + Number(exp.amount || 0);
            });
        return data;
    }, [expenses]);

    // --- Dépenses par catégorie ---
    const depensesData = useMemo(() => {
        const data: Record<string, number> = {};
        expenses
            .filter((exp) => exp.amount < 0)
            .forEach((exp) => {
                const catName = exp.category?.name || "Sans catégorie";
                data[catName] = (data[catName] || 0) + Math.abs(Number(exp.amount || 0));
            });
        return data;
    }, [expenses]);

    // --- Couleurs des catégories ---
    const categoryColors = useMemo(() => {
        const colors: Record<string, string> = {};
        categories.forEach((cat) => {
            colors[cat.name] = cat.color;
        });
        return colors;
    }, [categories]);

    const formatAmount = (amount: number) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);

    // --- Fetch données backend ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = localStorage.getItem("user");
                if (userData) {
                    const parsed = JSON.parse(userData);
                    setUser({
                        firstname: parsed.firstname || "Utilisateur",
                        lastname: parsed.lastname || "",
                        id: parsed.id,
                    });
                }

                if (!token) throw new Error("Non authentifié");

                // Dépenses
                const resExpenses = await fetch("http://localhost:3000/expenses", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resExpenses.ok) throw new Error("Erreur lors du chargement des dépenses");
                const dataExpenses: Expense[] = await resExpenses.json();
                setExpenses(dataExpenses);

                // Catégories
                const resCategories = await fetch("http://localhost:3000/categories", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resCategories.ok) throw new Error("Erreur lors du chargement des catégories");
                const dataCategories: Category[] = await resCategories.json();
                setCategories(dataCategories);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Une erreur est survenue");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [token]);

    // --- Gestion dépenses ---
    const handleAddExpense = (expense: Expense) => setExpenses((prev) => [...prev, expense]);
    const handleSaveExpense = (updated: Expense) => {
        setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setEditingExpense(null);
    };
// --- Gestion catégories ---
    const handleCategoryAdded = (newCategory: Category) =>
        setCategories((prev) => [...prev, newCategory]);

    const handleDeleteCategory = (id: number) =>
        setCategories((prev) => prev.filter((c) => c.id !== id));

    // --- Affichage ---
    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-emerald-400 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">
                        Bonjour, {user?.firstname} {user?.lastname}
                    </h1>
                    <div className="flex gap-2">
                        {/* ✅ Toggle accessibilité */}
                        <button
                            onClick={toggleFont}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                        >
                            {accessibleFont ? "Mode standard" : "Mode accessible"}
                        </button>

                        {/* Déconnexion */}
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
                </div>

                {/* Solde total */}
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <h2 className="text-xl font-semibold">Solde actuel</h2>
                    <p
                        className={`text-3xl font-bold ${
                            total >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                    >
                        {formatAmount(total)}
                    </p>
                </div>

                {/* Graphiques */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Analyse Financière</h3>
                    <div className="flex flex-col md:flex-row gap-6 justify-center">
                        <Graph revenus={revenusData} depenses={depensesData} categoryColors={categoryColors} />
                    </div>
                </div>

                {/* Ajouter une dépense */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3">Ajouter une dépense</h3>
                    <AddExpense
                        onAdd={handleAddExpense}
                        userId={user?.id ? String(user.id) : ""}
                        onUpdate={() => {}}
                        categories={categories}
                    />
                </div>

                {/* Catégories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-3">Gérer les catégories</h3>
                        <CategoryList
                            token={token}
                            onCategoryAdded={handleCategoryAdded}
                            onDeleteCategory={handleDeleteCategory}
                        />
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-3">Liste des catégories</h3>
                        <ul>
                            {categories.map((c) => (
                                <li key={c.id} className="flex items-center gap-2 mb-1">
                  <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: c.color }}
                  ></span>
                                    {c.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal édition dépense */}
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
}
