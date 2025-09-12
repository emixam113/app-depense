import { useState } from "react";
// @ts-ignore
import {Category} from '../Types/types.ts'

interface Props {
    token: string | null;
    onCategoryAdded?: (category: Category) => void;
}

const Category = ({ token, onCategoryAdded }: Props) => {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#34D399"); // couleur par défaut

    const handleSubmit = async () => {
        if (!token) return alert("Non authentifié");
        if (!name.trim()) return alert("Le nom de la catégorie est requis");

        try {
            const res = await fetch("http://localhost:3000/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, color }),
            });

            if (!res.ok) throw new Error("Erreur lors de l'ajout de la catégorie");

            const newCategory: Category = await res.json();
            setName("");
            setColor("#34D399");

            // Appel du callback pour mettre à jour le parent
            onCategoryAdded?.(newCategory);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Une erreur est survenue");
        }
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Ajouter une catégorie</h3>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Nom de la catégorie"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border p-2 rounded flex-1"
                />
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 p-0 border-0"
                />
                <button
                    onClick={handleSubmit}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                >
                    Ajouter
                </button>
            </div>
        </div>
    );
};

export default Category;
