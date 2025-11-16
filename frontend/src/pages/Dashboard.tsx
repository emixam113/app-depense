import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AddExpense from "../components/AddExpense";
import EditExpenseModal from "../components/EditExpenseModal";
import CategoryList, { Category } from "../components/CategoryList";
import Graph from "../components/Graph";
import { Expense } from "../Types/types";
import { useAccessibility } from "../Context/AccessibilityContext.tsx";
import { useAuth } from "../Context/AuthContext";
import { useTheme } from "../Context/ThemeContext";
import settings from "../assets/settings.svg";

export default function Dashboard() {
	const { user, expenses, refreshExpenses, logout } = useAuth();
	const { accessibleFont, toggleFont } = useAccessibility();
	const { theme, toggleTheme } = useTheme();
	const navigate = useNavigate();
	const token = localStorage.getItem("token");

	const [categories, setCategories] = useState<Category[]>([]);
	const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const normalizedExpenses = useMemo(
		() =>
			expenses.map((exp) => ({
				...exp,
				amount: Number(exp.amount),
			})),
		[expenses]
	);

	const total = useMemo(
		() =>
			normalizedExpenses.reduce(
				(sum, exp) => sum + (isNaN(exp.amount) ? 0 : exp.amount),
				0
			),
		[normalizedExpenses]
	);

	const revenusData = useMemo(() => {
		const data: Record<string, number> = {};
		const activeCategories = new Set(categories.map((c) => c.name));
		normalizedExpenses
			.filter((exp) => exp.amount > 0)
			.forEach((exp) => {
				const catName = exp.category?.name || "Autre revenu";
				if (!exp.category || activeCategories.has(catName)) {
					data[catName] = (data[catName] || 0) + exp.amount;
				}
			});
		return data;
	}, [normalizedExpenses, categories]);

	const depensesData = useMemo(() => {
		const data: Record<string, number> = {};
		const activeCategories = new Set(categories.map((c) => c.name));
		normalizedExpenses
			.filter((exp) => exp.amount < 0)
			.forEach((exp) => {
				const catName = exp.category?.name || "Sans catégorie";
				if (!exp.category || activeCategories.has(catName)) {
					data[catName] = (data[catName] || 0) + Math.abs(exp.amount);
				}
			});
		return data;
	}, [normalizedExpenses, categories]);

	const categoryColors = useMemo(() => {
		const colors: Record<string, string> = {};
		categories.forEach((cat) => {
			if (cat.color) colors[cat.name] = cat.color;
		});
		return colors;
	}, [categories]);

	const formatAmount = (amount: number) =>
		new Intl.NumberFormat("fr-FR", {
			style: "currency",
			currency: "EUR",
		}).format(amount);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				if (!token) throw new Error("Non authentifié");
				const res = await fetch("http://localhost:3000/categories", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) throw new Error("Erreur lors du chargement des catégories");
				const data: Category[] = await res.json();
				setCategories(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Une erreur est survenue");
			} finally {
				setIsLoading(false);
			}
		};
		fetchCategories();
		refreshExpenses();
	}, [token, refreshExpenses]);

	useEffect(() => {
		if (!user) navigate("/login");
	}, [user, navigate]);

	const handleAddExpense = () => {
		refreshExpenses();
	};

	const handleSaveExpense = async () => {
		await refreshExpenses();
		setEditingExpense(null);
	};

	const handleCategoryAdded = (newCategory: Category) =>
		setCategories((prev) => [...prev, newCategory]);

	const handleDeleteCategory = async (id: number) => {
		const categoryToDelete = categories.find((c) => c.id === id);
		const confirmDelete = window.confirm(
			`Supprimer la catégorie "${categoryToDelete?.name || "cette catégorie"}" ?`
		);
		if (!confirmDelete) return;
		try {
			await fetch(`http://localhost:3000/categories/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			setCategories((prev) => prev.filter((c) => c.id !== id));
			await refreshExpenses();
			alert(`Catégorie "${categoryToDelete?.name}" supprimée avec succès.`);
		} catch {
			alert("Une erreur est survenue lors de la suppression de la catégorie.");
		}
	};

	if (isLoading)
		return (
			<div className="min-h-screen flex items-center justify-center">
				Chargement...
			</div>
		);

	if (error)
		return (
			<div className="min-h-screen flex items-center justify-center text-red-500">
				{error}
			</div>
		);

	return (
		<div
			className={`min-h-screen p-6 transition-colors duration-500 ${
				theme === "light"
					? "bg-gradient-to-b from-emerald-600 to bg-emerald-700 text-gray-900"
					: "bg-[#0e0e0e] text-gray-100"
			} ${accessibleFont ? "text-lg leading-7" : ""}`}
		>
			<div className="max-w-6xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4">
					<h1 className="text-2xl font-bold text-white">
						Bonjour {user?.firstName || "Utilisateur"} {user?.lastName || ""}
					</h1>

					<div className="flex flex-wrap items-center gap-3">
						<button
							onClick={toggleFont}
							className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
						>
							{accessibleFont ? "Mode standard" : "Accessibilité"}
						</button>
						<button
							onClick={toggleTheme}
							className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition"
						>
							{theme === "light" ? "Sombre" : "Clair"}
						</button>
						<button
							className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
							onClick={() => {
								logout();
								navigate("/login");
							}}
						>
							Déconnexion
						</button>
						<img
							src={settings}
							alt="Paramètres"
							className="w-10 h-10 cursor-pointer invert dark:invert-0"
							title="Paramètres"
							onClick={() => navigate("/Settings")}
						/>
					</div>
				</div>

				{/* Solde total */}
				<div
					className={`p-4 rounded-lg shadow text-center ${
						theme === "light" ? "bg-white text-gray-900" : "bg-[#1f1f1f] text-gray-100"
					}`}
				>
					<h2 className="text-xl font-semibold">Solde actuel</h2>
					<p
						className={`text-3xl font-bold ${
							total >= 0 ? "text-green-600" : "text-red-500"
						}`}
					>
						{formatAmount(total)}
					</p>
				</div>

				{/* Graphique */}
				<div
					className={`p-6 rounded-lg shadow ${
						theme === "light" ? "bg-white text-gray-900" : "bg-[#1f1f1f] text-gray-100"
					}`}
				>
					<h3 className="text-lg font-semibold mb-4">Analyse Financière</h3>
					<Graph
						revenus={revenusData}
						depenses={depensesData}
						categoryColors={categoryColors}
					/>
				</div>

				{/* Formulaire */}
				<div
					className={`p-4 rounded-lg shadow ${
						theme === "light" ? "bg-white text-gray-900" : "bg-[#1f1f1f] text-gray-100"
					}`}
				>
					<h3 className="text-lg font-semibold mb-3">
						Ajouter une dépense
					</h3>
					<AddExpense
						onAdd={handleAddExpense}
						onUpdate={refreshExpenses}
						categories={categories}
					/>
				</div>

				{/* Catégories & Liste */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div
						className={`p-4 rounded-lg shadow ${
							theme === "light"
								? "bg-white text-gray-900"
								: "bg-[#1f1f1f] text-gray-100"
						}`}
					>
						<h3 className="text-lg font-semibold mb-3">Gérer les catégories</h3>
						<CategoryList
							token={token}
							onCategoryAdded={handleCategoryAdded}
							onDeleteCategory={handleDeleteCategory}
						/>
					</div>

					<div
						className={`p-4 rounded-lg shadow ${
							theme === "light"
								? "bg-white text-gray-900"
								: "bg-[#1f1f1f] text-gray-100"
						}`}
					>
						<h3 className="text-lg font-semibold mb-3">
							Liste des dépenses et revenus
						</h3>
						{normalizedExpenses.length === 0 ? (
							<p className="opacity-70">Aucune donnée pour le moment.</p>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{normalizedExpenses.map((e) => (
									<li key={e.id} className="flex justify-between items-center py-2">
										<div className="flex flex-col">
                      <span className="font-medium">
                        {e.label} — {e.category?.name || "Sans catégorie"}
                      </span>
											<span className="text-sm opacity-70">
                        {new Date(e.date).toLocaleDateString("fr-FR")}
                      </span>
										</div>
										<div className="flex items-center gap-3">
                      <span
	                      className={`font-semibold ${
		                      e.amount < 0 ? "text-red-500" : "text-green-600"
	                      }`}
                      >
                        {e.amount < 0
	                        ? `- ${formatAmount(Math.abs(e.amount))}`
	                        : `+ ${formatAmount(e.amount)}`}
                      </span>
											<button
												onClick={() => setEditingExpense(e)}
												className="px-3 py-1 text-sm rounded bg-indigo-500 text-white "
											>
												Éditer
											</button>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>

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