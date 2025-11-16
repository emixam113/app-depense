import { useState } from "react";
import EyePassIcon from "../assets/Eye-Pass.svg";
import VectorIcon from "../assets/Vector.svg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            // ✅ Appel du contexte Auth
            const success = await login(email, password);

            if (success) {
                navigate("/dashboard");
            } else {
                setError("Email ou mot de passe incorrect");
            }
        } catch (err) {
            console.error("Erreur lors de la connexion :", err);
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-botlogin">
            {/* En-tête */}
            <div className="w-full flex items-center space-x-3">
                <img src="/logo.svg" alt="Finéo Logo" className="w-44 h-44" />
                <span className="text-black font-bold text-lg">
                    L'outil pour la nouvelle finance
                </span>
            </div>

            {/* Titre */}
            <h1 className="text-[32px] text-black pt-20">Bienvenue</h1>

            {/* Formulaire */}
            <div className="bg-login w-[600px] max-w-[600px] rounded-lg p-12 mt-12 shadow-md">
                {/* Champ Email */}
                <div className="mb-6 rounded-full">
                    <label className="block text-black text-[32px] text-left mb-2">
                        E-mail
                    </label>
                    <input
                        type="email"
                        placeholder="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded bg-text text-black focus:outline-none"
                    />
                </div>

                {/* Champ Mot de passe */}
                <div className="mb-6">
                    <label
                        htmlFor="password"
                        className="block text-black text-[32px] text-left mb-2"
                    >
                        Mot de passe
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-text text-black focus:outline-none pl-10"
                            placeholder="Password"
                        />
                        <span
                            className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <img src={VectorIcon} alt="Hide Password" />
                            ) : (
                                <img src={EyePassIcon} alt="Show Password" />
                            )}
                        </span>
                    </div>
                    <Link
                        to="/forgot-password"
                        className="text-sm text-black mt-2 cursor-pointer text-left"
                    >
                        Mot de passe oublié?
                    </Link>
                </div>

                {/* Erreur */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* Bouton Se connecter */}
                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleLogin}
                        className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 transition duration-200 flex items-center justify-center disabled:bg-gray-400"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <svg
                                className="h-5 w-5 mr-2 text-white animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                                ></path>
                            </svg>
                        ) : (
                            "Se Connecter"
                        )}
                    </button>
                </div>

                {/* Lien Inscription */}
                <p className="text-center mt-6 text-black">
                    Pas encore de compte ?{" "}
                    <a href="/signup" className="text-gray-500">
                        S'inscrire
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;
