import { useEffect, useState } from "react";
import CategorySummary from "../components/Category";
import { Expense } from "../Types/types";
import { Graph } from "../components/Graph";
import AddExpense from "../components/AddExpense";

const Dashboard = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    
    // Effet pour déboguer les changements de dépenses
    useEffect(() => {
        console.log('Dépenses mises à jour:', expenses);
    }, [expenses]);
    const [user, setUser] = useState<{firstname: string; lastname: string} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Safely calculate total
    const total = expenses?.reduce((sum, expense) => {
        return sum + (Number(expense?.amount) || 0);
    }, 0) || 0;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Récupérer les données utilisateur
                const userData = JSON.parse(localStorage.getItem("user") || "{}");
                if (userData && typeof userData === 'object') {
                    setUser({
                        firstname: userData.firstname || 'Utilisateur',
                        lastname: userData.lastname || ''
                    });
                }

                // Récupérer les dépenses depuis l'API
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Non authentifié');
                }

                const response = await fetch('http://localhost:3000/expenses', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des dépenses');
                }

                const expensesData = await response.json();
                console.log('Données reçues de l\'API :', expensesData);
                setExpenses(expensesData);
            } catch (err) {
                console.error('Error:', err);
                setError(err instanceof Error ? err.message : 'Une erreur est survenue');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fonction pour formater les montants
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    }
    
    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-emerald-400 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Bonjour, {user?.firstname} {user?.lastname}</h1>
                    <button 
                        className="bg-red-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-red-600 transition-colors"
                        onClick={() => {
                            localStorage.removeItem("token");
                            window.location.href = "/login";
                        }}
                    >
                        Déconnexion
                    </button>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
                    <h2 className="text-xl font-semibold">Solde Actuel</h2>
                    <p className="text-2xl font-bold">
                      {formatAmount(total)}
                    </p>
                </div>      
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <CategorySummary expenses={expenses} />
                    </div>
                    <div>
                        <Graph 
                            data={expenses.reduce((acc, item) => {
                                const categoryName = item.category ? (typeof item.category === 'string' ? item.category : item.category.name) : 'Sans catégorie';
                                if (!acc[categoryName]) {
                                    acc[categoryName] = 0;
                                }
                                acc[categoryName] += Number(item.amount) || 0;
                                console.log("Données du graphique pour la catégorie", categoryName, ":", item.amount);
                                return acc;
                            }, {} as Record<string, number>)} 
                        />
                    </div>
                </div>
                
                <AddExpense 
                    onAdd={expense => {
                        if (expense && typeof expense === 'object') {
                            setExpenses(prev => [...prev, expense]);
                        }
                    }} 
                />
            </div>
        </div>
    );
}

export default Dashboard;