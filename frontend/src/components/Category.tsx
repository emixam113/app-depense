import React, { useState } from "react";
import { Category } from "../Types/types.ts";

interface AddCategoryProps {
    onCategoryAdded: (category: Category) => void;
}

const AddCategory: React.FC<AddCategoryProps> = ({ onCategoryAdded }) => {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#000000");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!name.trim()) {
            setError("Le nom de la catégorie est requis.");
            return;
        }

        setIsSubmitting(true);

        const token = localStorage.getItem("token");
        if (!token) {
            setError("Vous devez être connecté pour ajouter une catégorie.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, color }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || "Erreur lors de l'ajout de la catégorie");
            }

            const newCategory: Category = await response.json();
            onCategoryAdded(newCategory);

            setSuccess(true);
            setName("");
            setColor("#000000");
        } catch (err) {
            console.error("Erreur :", err);
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4 max-w-md">
            <h2 className="text-lg font-semibold">Ajouter une catégorie</h2>

            {error && <div className="text-red-600">{error}</div>}
            {success && <div className="text-green-600">Catégorie ajoutée avec succès !</div>}

            <div>
                <label className="block text-sm font-medium text-gray-700">Nom de la catégorie</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Courses, Transport..."
                    className="mt-1 block w-full border rounded-md p-2"
                    disabled={isSubmitting}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Couleur</label>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 block w-16 h-10 p-0 border rounded-md"
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2 px-4 rounded text-white ${
                    isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
                {isSubmitting ? "Ajout en cours..." : "Ajouter la catégorie"}
            </button>
        </form>
    );
};

export default AddCategory;
