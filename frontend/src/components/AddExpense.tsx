import React, { useState } from "react";
import { Expense } from "../Types/types";
import { Category } from "./CategoryList";
import { useAuth } from "../Context/AuthContext";
import { useTheme } from "../Context/ThemeContext";

interface AddExpenseProps {
	onAdd: (expense: Expense) => void;
	onUpdate: () => void;
	categories: Category[];
}

export default function AddExpense({
	                                   onAdd,
	                                   onUpdate,
	                                   categories,
                                   }: AddExpenseProps) {
	const { token } = useAuth();
	const { theme } = useTheme();

	const [formData, setFormData] = useState({
		label: "",
		amount: "",
		type: "expense",
		date: new Date().toISOString().split("T")[0],
		categoryId: "",
	});

	const [error, setError] = useState<string | null>(null);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!token) {
			setError("Vous devez être connecté pour ajouter une dépense.");
			return;
		}

		try {
			const response = await fetch("http://localhost:3000/expenses", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					label: formData.label.trim(),
					amount:
						formData.type === "expense"
							? -Math.abs(parseFloat(formData.amount))
							: Math.abs(parseFloat(formData.amount)),
					type: formData.type,
					date: formData.date,
					categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || "Erreur lors de la création de la dépense");
			}

			const newExpense: Expense = await response.json();
			onAdd(newExpense);
			onUpdate();

			setFormData({
				label: "",
				amount: "",
				type: "expense",
				date: new Date().toISOString().split("T")[0],
				categoryId: "",
			});
			setError(null);
		} catch (err) {
			console.error("Erreur lors de l’ajout :", err);
			setError(err instanceof Error ? err.message : "Erreur inconnue");
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className={`flex flex-col gap-4 p-4 rounded-lg shadow transition-colors ${
				theme === "light"
					? "bg-white text-gray-900"
					: "bg-[#1f1f1f] text-gray-100"
			}`}
		>
			<label className="font-semibold">Libellé</label>
			<input
				type="text"
				name="label"
				placeholder="Ex: courses, salaire..."
				value={formData.label}
				onChange={handleChange}
				required
				className={`border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
					theme === "light"
						? "bg-white border-gray-300 focus:ring-green-400"
						: "bg-[#2a2a2a] border-gray-600 focus:ring-green-500"
				}`}
			/>

			<label className="font-semibold">Montant</label>
			<input
				type="number"
				name="amount"
				placeholder="Ex: 50"
				value={formData.amount}
				onChange={handleChange}
				required
				className={`border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
					theme === "light"
						? "bg-white border-gray-300 focus:ring-green-400"
						: "bg-[#2a2a2a] border-gray-600 focus:ring-green-500"
				}`}
			/>

			<label className="font-semibold">Type</label>
			<div className="flex gap-4">
				<label className="flex items-center gap-1">
					<input
						type="radio"
						name="type"
						value="expense"
						checked={formData.type === "expense"}
						onChange={handleChange}
						className="accent-red-500"
					/>
					Dépense
				</label>
				<label className="flex items-center gap-1">
					<input
						type="radio"
						name="type"
						value="income"
						checked={formData.type === "income"}
						onChange={handleChange}
						className="accent-green-500"
					/>
					Revenu
				</label>
			</div>

			<label className="font-semibold">Catégorie</label>
			<select
				name="categoryId"
				value={formData.categoryId}
				onChange={handleChange}
				className={`border rounded px-3 py-2 focus:outline-none focus:ring-2 font-poppins ${
					theme === "light"
						? "bg-white border-gray-300 focus:ring-green-400"
						: "bg-[#2a2a2a] border-gray-600 focus:ring-green-500"
				}`}
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
				className={`w-full py-2 rounded font-semibold text-white transition ${
					formData.type === "expense"
						? "bg-[#c0392b] hover:bg-[#a93226]"
						: "bg-[#179C6E] hover:bg-[#127B77]"
				}`}
			>
				{formData.type === "expense"
					? "Ajouter une dépense"
					: "Ajouter un revenu"}
			</button>

			{error && <p className="text-red-500 text-sm text-center">{error}</p>}
		</form>
	);
}
