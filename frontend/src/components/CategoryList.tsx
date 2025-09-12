import { useState, useEffect } from "react";

export interface Category {
    id: number;
    name: string;
    color: string;
}

interface CategoryListProps {
    token: string | null;
    onCategoryAdded: (category: Category) => void;
    onDeleteCategory: (id: number) => void;
}

const CategoryList = ({ token, onCategoryAdded, onDeleteCategory }: CategoryListProps) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [color, setColor] = useState("#000000");

    // Charger les catégories existantes
    useEffect(() => {
        if (!token) return;
        const fetchCategories = async () => {
            try {
                const res = await fetch("http://localhost:3000/categories", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Erreur lors du chargement des catégories");
                const data = await res.json();
                setCategories(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchCategories();
    }, [token]);

    // Ajouter une catégorie
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim() || !token) return;

        try {
            const res = await fetch("http://localhost:3000/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newCategory, color }),
            });

            if (!res.ok) throw new Error("Erreur lors de l'ajout de la catégorie");

            const created = await res.json();

            // ✅ On met à jour le state directement
            setCategories((prev) => [...prev, created]);
            onCategoryAdded(created);

            setNewCategory("");
            setColor("#000000");
        } catch (error) {
            console.error(error);
        }
    };

    // Supprimer une catégorie
    const handleDeleteCategory = async (id: number) => {
        if (!token) return;
        try {
            const res = await fetch(`http://localhost:3000/categories/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Erreur lors de la suppression");

            setCategories((prev) => prev.filter((c) => c.id !== id));
            onDeleteCategory(id);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            {/* Formulaire d’ajout */}
            <form onSubmit={handleAddCategory} className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Nom de la catégorie"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 border rounded px-2 py-1"
                />
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 p-0 border rounded"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                    Ajouter
                </button>
            </form>

            {/* Liste des catégories */}
            <ul className="space-y-2">
                {categories.map((c) => (
                    <li
                        key={c.id}
                        className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded"
                    >
                        <span className="flex items-center gap-2">
                            <span
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: c.color }}
                            ></span>
                            {c.name}
                        </span>
                        <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="text-red-600 hover:underline"
                        >
                            Supprimer
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CategoryList;
