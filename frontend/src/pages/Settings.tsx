import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; // ✅ correction ici

type Section = "account" | "security" | "preferences" | "notifications";

interface UserAccount {
	id: number;
	firstName?: string;
	lastName?: string;
	email: string;
}

const SettingsPage: React.FC = () => {
	const { user, token, logout } = useAuth() as {
		user: UserAccount | null;
		token: string | null;
		logout: () => void;
		updateUser: (fields: Partial<UserAccount>) => void;
	};

	const navigate = useNavigate(); // ✅ hook de navigation

	const [activeSection, setActiveSection] = useState<Section>("account");
	const [theme, setTheme] = useState<"light" | "dark">("light");

	// Charger le thème depuis le localStorage ou la préférence système
	useEffect(() => {
		const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
		if (savedTheme) {
			setTheme(savedTheme);
		} else {
			const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			setTheme(prefersDark ? "dark" : "light");
		}
	}, []);

	// Appliquer le thème
	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		localStorage.setItem("theme", theme);
	}, [theme]);

	// Modifier un champ utilisateur
	const handleEdit = async (field: keyof UserAccount) => {
		if (!user || !token) return;

		const currentValue = user[field] ?? "";
		const newValue = prompt(`Nouveau ${field} :`, String(currentValue));
		if (!newValue || newValue === currentValue) return;

		try {
			const res = await fetch(`http://localhost:3000/users/${user.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ [field]: newValue }),
			});

			if (!res.ok) throw new Error("Erreur de mise à jour");
			alert("✅ Profil mis à jour !");
			window.location.reload();
		} catch (err) {
			console.error(err);
			alert("❌ Erreur lors de la mise à jour");
		}
	};

	// Supprimer le compte
	const handleDelete = async () => {
		if (!user || !token) return;

		const confirmDelete = window.confirm("⚠️ Supprimer ton compte ? Cette action est irréversible !");
		if (!confirmDelete) return;

		try {
			const res = await fetch(`http://localhost:3000/users/${user.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!res.ok) throw new Error("Erreur de suppression");

			alert("Compte supprimé ✅");

			// ✅ Déconnexion et redirection vers la page d’inscription
			logout();
			navigate("/signup");
		} catch (err) {
			console.error(err);
			alert("❌ Erreur lors de la suppression");
		}
	};

	if (!user) {
		return <p className="text-center mt-10">Chargement du profil...</p>;
	}

	// Composant interne pour les champs modifiables
	const EditableField = ({
		                       label,
		                       value,
		                       field,
	                       }: {
		label: string;
		value?: string;
		field: keyof UserAccount;
	}) => (
		<div
			className={`flex justify-between items-center rounded-xl p-4 mb-4 ${
				theme === "light" ? "bg-white" : "bg-[#3A3A3A]"
			}`}
		>
			<div>
				<p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
				<p className="text-lg font-medium">{value || "Non défini"}</p>
			</div>
			<button
				onClick={() => handleEdit(field)}
				className="px-4 py-2 text-sm bg-[#2ECC71] text-white rounded-lg hover:bg-[#27ae60] transition"
			>
				Modifier
			</button>
		</div>
	);

	return (
		<div
			className={`min-h-screen flex transition-colors duration-300 ${
				theme === "light"
					? "bg-[#A8E6CF] text-gray-800"
					: "bg-[#1B1B1B] text-gray-100"
			}`}
		>
			{/* --- Sidebar --- */}
			<aside
				className={`w-64 p-6 flex flex-col shadow-lg ${
					theme === "light" ? "bg-[#9CE3B1]" : "bg-[#2E2E2E]"
				}`}
			>
				<h2 className="text-2xl font-semibold mb-8 text-center">Paramètres</h2>

				<nav className="flex flex-col gap-3">
					{["account", "security", "preferences", "notifications"].map((section) => (
						<button
							key={section}
							onClick={() => setActiveSection(section as Section)}
							className={`text-left px-4 py-2 rounded-lg font-medium transition ${
								activeSection === section
									? theme === "light"
										? "bg-[#2ECC71] text-white"
										: "bg-[#27AE60] text-white"
									: theme === "light"
										? "hover:bg-[#C8F7DC]"
										: "hover:bg-[#3A3A3A]"
							}`}
						>
							{section === "account" && "Mon compte"}
							{section === "security" && "Sécurité"}
							{section === "preferences" && "Préférences"}
							{section === "notifications" && "Notifications"}
						</button>
					))}
				</nav>

				<button
					onClick={logout}
					className="mt-auto px-4 py-2 rounded-lg bg-red-400 text-white hover:bg-red-500 transition"
				>
					Déconnexion
				</button>
			</aside>

			{/* --- Contenu principal --- */}
			<main className="flex-1 p-10">
				{/* --- Section Compte --- */}
				{activeSection === "account" && (
					<>
						<h1 className="text-3xl font-bold mb-8">Mon compte</h1>
						<div
							className={`shadow-lg rounded-2xl p-6 max-w-2xl mx-auto ${
								theme === "light" ? "bg-[#9CE3B1]" : "bg-[#2E2E2E]"
							}`}
						>
							<EditableField label="Prénom" value={user.firstName} field="firstName" />
							<EditableField label="Nom" value={user.lastName} field="lastName" />

							<div
								className={`flex justify-between items-center rounded-xl p-4 mb-4 ${
									theme === "light" ? "bg-white" : "bg-[#3A3A3A]"
								}`}
							>
								<div>
									<p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
									<p className="text-lg font-medium">{user.email}</p>
								</div>
							</div>

							{/* ✅ Suppression de compte */}
							<div className="text-center mt-6">
								<button
									onClick={handleDelete}
									className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition"
								>
									Supprimer le compte
								</button>
							</div>
						</div>
					</>
				)}

				{/* --- Section Préférences --- */}
				{activeSection === "preferences" && (
					<>
						<h1 className="text-3xl font-bold mb-8">Préférences</h1>
						<div
							className={`shadow-lg rounded-2xl p-6 max-w-2xl mx-auto ${
								theme === "light" ? "bg-[#9CE3B1]" : "bg-[#2E2E2E]"
							}`}
						>
							<div className="flex justify-between items-center bg-white dark:bg-[#3A3A3A] rounded-xl p-4">
								<div>
									<p className="text-lg font-medium mb-1">Thème</p>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Choisis ton apparence
									</p>
								</div>
								<button
									onClick={() => setTheme(theme === "light" ? "dark" : "light")}
									className={`px-4 py-2 rounded-lg font-medium transition ${
										theme === "light"
											? "bg-[#2ECC71] text-white hover:bg-[#27AE60]"
											: "bg-gray-700 text-white hover:bg-gray-600"
									}`}
								>
									{theme === "light" ? "🌙 Mode sombre" : "☀️ Mode clair"}
								</button>
							</div>
						</div>
					</>
				)}

				{/* --- Section Sécurité --- */}
				{activeSection === "security" && (
					<h1 className="text-3xl font-bold mb-8 text-center">
						Section Sécurité (à venir 🔒)
					</h1>
				)}

				{/* --- Section Notifications --- */}
				{activeSection === "notifications" && (
					<h1 className="text-3xl font-bold mb-8 text-center">
						Section Notifications (à venir 🔔)
					</h1>
				)}
			</main>
		</div>
	);
};

export default SettingsPage;
