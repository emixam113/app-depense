import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
	const [step, setStep] = useState(1);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		birthdate: "",
		code: "",
		newPassword: "",
		confirmPassword: "",
	});

	const navigate = useNavigate();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setFormData((prev) => ({ ...prev, [id]: value }));
	};

	// ✅ Étape 1 — Vérification de l'utilisateur
	const handleVerification = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		const { email, birthdate } = formData;
		if (!email.trim() || !birthdate) {
			setError("Veuillez remplir tous les champs.");
			setLoading(false);
			return;
		}

		try {
			const birthdateFormatted = birthdate.split("-").reverse().join("-");

			const response = await fetch("http://localhost:3000/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim().toLowerCase(),
					birthdate: birthdateFormatted,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				alert("✅ Un email contenant le code de réinitialisation vous a été envoyé.");
				setStep(2);
			} else {
				setError(data.message || "Utilisateur introuvable ou erreur serveur.");
			}
		} catch (err) {
			console.error("Erreur lors de la vérification :", err);
			setError("Une erreur est survenue, veuillez réessayer.");
		} finally {
			setLoading(false);
		}
	};

	// ✅ Étape 2 — Réinitialisation du mot de passe
	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		const { code, newPassword, confirmPassword, email } = formData;

		if (!code || !newPassword || !confirmPassword) {
			setError("Veuillez remplir tous les champs.");
			setLoading(false);
			return;
		}

		if (newPassword.length < 6) {
			setError("Le mot de passe doit contenir au moins 6 caractères.");
			setLoading(false);
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("Les mots de passe ne correspondent pas.");
			setLoading(false);
			return;
		}

		try {
			const res = await fetch("http://localhost:3000/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, code, newPassword }),
			});

			const data = await res.json();

			if (res.ok) {
				alert("✅ Mot de passe réinitialisé avec succès !");
				navigate("/login");
			} else {
				setError(data.message || "Erreur lors de la réinitialisation.");
			}
		} catch (err: any) {
			setError(err.message || "Une erreur est survenue.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="min-h-screen flex flex-col items-center px-4 py-10"
			style={{ backgroundColor: "var(--color-botlogin)" }}
		>
			{/* Logo */}
			<div className="w-full flex items-center mb-6">
				<img src="/logo.svg" alt="Logo Fineo" className="h-16 w-16" />
				<span className="ml-3 text-black font-bold text-sm">
          L'outil pour la nouvelle finance
        </span>
			</div>

			<h1 className="text-4xl font-medium text-black text-center mb-8">
				{step === 1 ? "Mot de passe oublié ?" : "Réinitialiser votre mot de passe"}
			</h1>

			<div
				className="rounded-3xl p-10 w-full max-w-3xl"
				style={{ backgroundColor: "var(--color-login)" }}
			>
				<form
					onSubmit={step === 1 ? handleVerification : handleResetPassword}
					className="space-y-6 max-w-md mx-auto"
				>
					{step === 1 ? (
						<>
							<div>
								<label htmlFor="email" className="block text-lg font-medium text-black mb-1">
									E-mail
								</label>
								<input
									type="email"
									id="email"
									value={formData.email}
									onChange={handleChange}
									placeholder="exemple@exemple.com"
									required
									className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
									style={{ backgroundColor: "var(--color-botlogin)" }}
								/>
							</div>

							<div>
								<label htmlFor="birthdate" className="block text-lg font-medium text-black mb-1">
									Date de naissance
								</label>
								<input
									type="date"
									id="birthdate"
									value={formData.birthdate}
									onChange={handleChange}
									required
									className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
									style={{ backgroundColor: "var(--color-botlogin)" }}
								/>
							</div>
						</>
					) : (
						<>
							<div>
								<label htmlFor="code" className="block text-lg font-medium text-black mb-1">
									Code de réinitialisation
								</label>
								<input
									type="text"
									id="code"
									value={formData.code}
									onChange={handleChange}
									placeholder="Code reçu par email"
									required
									className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
									style={{ backgroundColor: "var(--color-botlogin)" }}
								/>
							</div>

							<div>
								<label htmlFor="newPassword" className="block text-lg font-medium text-black mb-1">
									Nouveau mot de passe
								</label>
								<input
									type="password"
									id="newPassword"
									value={formData.newPassword}
									onChange={handleChange}
									required
									className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
									style={{ backgroundColor: "var(--color-botlogin)" }}
								/>
							</div>

							<div>
								<label htmlFor="confirmPassword" className="block text-lg font-medium text-black mb-1">
									Confirmer le mot de passe
								</label>
								<input
									type="password"
									id="confirmPassword"
									value={formData.confirmPassword}
									onChange={handleChange}
									required
									className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
									style={{ backgroundColor: "var(--color-botlogin)" }}
								/>
							</div>
						</>
					)}

					{error && <p className="text-red-600 font-medium text-center">{error}</p>}

					<div className="flex justify-center pt-4">
						<button
							type="submit"
							disabled={loading}
							className="text-black font-semibold px-6 py-2 rounded-full shadow hover:brightness-105 transition"
							style={{ backgroundColor: "var(--color-botlogin)" }}
						>
							{loading
								? "Chargement..."
								: step === 1
									? "Vérifier"
									: "Réinitialiser"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
