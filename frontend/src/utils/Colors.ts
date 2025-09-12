



export const categoryColors: Record<string, string> = {
    Salaire: "#10B981",
    Logement: "#3B82F6",
    Courses: "#F59E0B",
    Transport: "#EF4444",
    Loisirs: "#8B5CF6",
    Santé: "#10B981",
    Autre: "#6B7280"
};


//fonction utilitaire pour récupérer une couleur
export const getCategoryColor = (category: string): string => {
    return categoryColors[category] || "#9CA3AF"
};

//Liste des couleurs disponibles si tu veux un sélecteur:

export const avialiableCategoryColors: string[] = [
    "#34D399",
    "#3B82F6",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#10B981",
    "#6366F1", 
    "#6B7280",
]