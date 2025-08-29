import { useEffect, useState } from "react";
import { Category } from "../Types/types";

interface CategoryListProps {
    token: string | null;
}

function CategoryList({ token }: CategoryListProps) {
    const [categories, setCategories] = useState<Category[]>([]);

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
            } catch (error) {
                console.error(error);
            }
        };
        fetchCategories();
    }, [token]);

    if (categories.length === 0) {
        return <p className="text-center text-gray-600">Aucune catégorie disponible.</p>;
    }

    return (
        <ul className="space-y-3">
            {categories.map((cat) => (
                <li
                    key={cat.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        {/* 👉 pastille de couleur */}
                        <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium">{cat.name}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default CategoryList;
