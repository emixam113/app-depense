import React, { useEffect, useState } from "react";

export interface Category {
	id: number;
	name: string;
	color: string;
	isDefault: boolean;
}

interface CategoryListProps {
	token: string | null;
	onCategoryAdded: (category: Category) => void;
	onDeleteCategory: (id: number) => void;
}

export default function CategoryList({
	                                     token,
	                                     onCategoryAdded,
	                                     onDeleteCategory,
                                     }: CategoryListProps) {
	const [categories, setCategories] = useState<Category[]>([]);
	const [newCategory, setNewCategory] = useState("");
	const [color, setColor] = useState("#000000");

	//  Charger les catégories
	useEffect(() => {
		const fetchCategories = async () => {
			if (!token) return;
			const res = await fetch("http://localhost:3000/categories", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			setCategories(data);
		};
		fetchCategories();
	}, [token]);

	//  Ajouter une catégorie
	const handleAdd = async () => {
		if (!newCategory.trim()) return;

		const res = await fetch("http://localhost:3000/categories", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ name: newCategory, color }),
		});

		if (res.ok) {
			const cat = await res.json();
			setCategories((prev) => [...prev, cat]);
			onCategoryAdded(cat);
			setNewCategory("");
		}
	};

	// Supprimer une catégorie
	const handleDelete = async (id: number) => {
		const res = await fetch(`http://localhost:3000/categories/${id}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}` },
		});

		if (res.ok) {
			setCategories((prev) => prev.filter((c) => c.id !== id));
			onDeleteCategory(id);
		}
	};

	// Séparer les catégories
	const defaultCategories = categories.filter((c) => c.isDefault);
	const userCategories = categories.filter((c) => !c.isDefault);

	return (
		<div>
			{/* === Ajout d’une catégorie === */}
			<div className="flex gap-2 mb-4">
				<input
					type="text"
					placeholder="Nom de la catégorie"
					value={newCategory}
					onChange={(e) => setNewCategory(e.target.value)}
					className="border rounded px-2 py-1 flex-1"
				/>
				<input
					type="color"
					value={color}
					onChange={(e) => setColor(e.target.value)}
					className="border rounded w-10"
				/>
				<button
					onClick={handleAdd}
					className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
				>
					Ajouter
				</button>
			</div>

			{/* === Catégories par défaut === */}
			<h4 className="font-semibold text-gray-700 mb-2">
				️ Catégories par défaut
			</h4>
			<ul className="mb-4">
				{defaultCategories.map((cat) => (
					<li key={cat.id} className="flex justify-between items-center py-1 border-b">
						<div className="flex items-center gap-2">
              <span
	              className="w-3 h-3 rounded-full"
	              style={{ backgroundColor: cat.color }}
              ></span>
							{cat.name}
						</div>
						<span className="text-gray-400 text-sm italic">(non modifiable)</span>
					</li>
				))}
			</ul>

			{/* === Catégories personnalisées === */}
			<h4 className="font-semibold text-gray-700 mb-2">
				Catégories personnalisées
			</h4>
			<ul>
				{userCategories.length === 0 ? (
					<li className="text-gray-400 text-sm italic">
						Aucune catégorie personnalisée
					</li>
				) : (
					userCategories.map((cat) => (
						<li
							key={cat.id}
							className="flex justify-between items-center py-1 border-b"
						>
							<div className="flex items-center gap-2">
                <span
	                className="w-3 h-3 rounded-full"
	                style={{ backgroundColor: cat.color }}
                ></span>
								{cat.name}
							</div>
							<button
								onClick={() => handleDelete(cat.id)}
								className="text-red-500 hover:underline"
							>
								Supprimer
							</button>
						</li>
					))
				)}
			</ul>
		</div>
	);
}