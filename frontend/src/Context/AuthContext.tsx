import React, {
	createContext,
	useState,
	useEffect,
	useContext,
	useCallback,
} from "react";

interface User {
	id: number;
	email: string;
	firstname?: string;
	lastname?: string;
}

interface Expense {
	id: number;
	label: string;
	amount: number;
	date: string;
	type: string;
	category?: { name: string };
}

interface AuthContextType {
	user: User | null;
	expenses: Expense[];
	token: string | null;
	login: (email: string, password: string) => Promise<boolean>;
	logout: () => void;
	refreshExpenses: () => Promise<void>;
	updateUser: (fields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	expenses: [],
	token: null,
	login: async () => false,
	logout: () => {},
	refreshExpenses: async () => {},
	updateUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	                                                                      children,
                                                                      }) => {
	const [user, setUser] = useState<User | null>(null);
	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [token, setToken] = useState<string | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	// 🔹 Charger les infos depuis localStorage
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		const storedToken = localStorage.getItem("token");

		if (storedUser && storedToken) {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);
			setToken(storedToken);

			const storedExpenses = localStorage.getItem(`expenses_${parsedUser.id}`);
			if (storedExpenses) {
				setExpenses(JSON.parse(storedExpenses));
			}
		}

		setIsInitialized(true);
	}, []);

	// 🔹 Récupérer les dépenses depuis le backend
	const fetchExpenses = useCallback(
		async (authToken?: string) => {
			const tokenToUse = authToken || token;
			if (!tokenToUse || !user) return;

			try {
				const res = await fetch("http://localhost:3000/expenses/me", {
					headers: { Authorization: `Bearer ${tokenToUse}` },
				});

				if (!res.ok) {
					console.error("Erreur fetchExpenses:", res.statusText);
					return;
				}

				const data = await res.json();
				setExpenses(data);
				localStorage.setItem(`expenses_${user.id}`, JSON.stringify(data));
			} catch (error) {
				console.error("❌ Erreur fetchExpenses:", error);
			}
		},
		[token, user]
	);

	// 🔹 Rafraîchir les dépenses manuellement
	const refreshExpenses = useCallback(async () => {
		if (!token || !user) return;
		await fetchExpenses(token);
	}, [fetchExpenses, token, user]);

	// 🔹 Connexion utilisateur
	const login = async (email: string, password: string): Promise<boolean> => {
		try {
			const res = await fetch("http://localhost:3000/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await res.json();

			if (!res.ok || !data.access_token) {
				console.error("❌ Erreur login:", data.message);
				return false;
			}

			const accessToken = data.access_token;
			setToken(accessToken);
			localStorage.setItem("token", accessToken);

			// 🔹 Récupération du profil
			const profileRes = await fetch("http://localhost:3000/users/me", {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (!profileRes.ok) throw new Error("Impossible de récupérer le profil");
			const userData = await profileRes.json();

			setUser(userData);
			localStorage.setItem("user", JSON.stringify(userData));

			await fetchExpenses(accessToken);

			return true;
		} catch (error) {
			console.error("❌ Erreur login:", error);
			return false;
		}
	};

	// 🔹 Déconnexion
	const logout = () => {
		if (user) localStorage.removeItem(`expenses_${user.id}`);
		localStorage.removeItem("user");
		localStorage.removeItem("token");
		setUser(null);
		setToken(null);
		setExpenses([]);
	};

	// 🔹 Mettre à jour les infos utilisateur localement
	const updateUser = (fields: Partial<User>) => {
		setUser((prev) => {
			if (!prev) return prev;
			const updated = { ...prev, ...fields };
			localStorage.setItem("user", JSON.stringify(updated));
			return updated;
		});
	};

	// 🔹 Chargement automatique des dépenses après connexion
	useEffect(() => {
		if (isInitialized && user && token && expenses.length === 0) {
			fetchExpenses(token);
		}
	}, [isInitialized, user, token, expenses.length, fetchExpenses]);

	return (
		<AuthContext.Provider
			value={{ user, expenses, token, login, logout, refreshExpenses, updateUser }}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
