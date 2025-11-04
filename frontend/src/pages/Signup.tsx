import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import EyePassIcon from "../assets/Eye-Pass.svg";
import VectorIcon from "../assets/Vector.svg";

const Signup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [acceptCGU, setAcceptCGU] = useState(false);

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        dateNaissance: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (!acceptCGU) {
            setError("Vous devez accepter les conditions générales d’utilisation.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    firstName: formData.prenom,
                    lastName: formData.nom,
                    birthDate: formData.dateNaissance,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erreur lors de l'inscription");
            }

            // ✅ Nettoyer localStorage avant de stocker les nouvelles infos
            localStorage.clear();

            if (data.access_token) {
                localStorage.setItem("token", data.access_token);
            }
            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            setError(null);
            setSuccess(true);

            setTimeout(() => {
                navigate("/dashboard");
                window.location.href = "/dashboard";
            }, 1500);
        } catch (err: any) {
            setError(err.message);
            setSuccess(false);
            console.error("Erreur d'inscription :", err);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-botlogin relative">
            {/* Logo */}
            <div className="absolute top-0 left-0">
                <div className="flex items-center">
                    <img src="/logo.svg" alt="Finéo" className="w-44 h-44" />
                    <span className="text-black font-bold text-lg p-2">L'outil pour la nouvelle finance</span>
                </div>
            </div>

            {/* Formulaire */}
            <div className="flex flex-col items-center mt-50">
                <div className="text-[32px] text-center mb-5">Création d'un compte</div>

                <form onSubmit={handleSubmit} className="bg-login w-[900px] max-w-[900px] rounded-lg p-8 mt-12 shadow-md">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Colonne gauche */}
                        <div>
                            <div className="mb-4">
                                <label className="block text-black text-[32px] text-left mb-2">Nom</label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    placeholder="Votre nom"
                                    className="w-full px-4 py-2 rounded bg-text text-black focus:outline-none"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-black text-[32px] text-left mb-2">Prénom</label>
                                <input
                                    type="text"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    placeholder="Votre prénom"
                                    className="w-full px-4 py-2 rounded bg-text text-black focus:outline-none"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-black text-[32px] text-left mb-2">Date de naissance</label>
                                <input
                                    type="date"
                                    name="dateNaissance"
                                    value={formData.dateNaissance}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-text text-black focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Colonne droite */}
                        <div>
                            <div className="mb-4">
                                <label className="block text-black text-[32px] text-left mb-2">E-mail</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="exemple@exemple.com"
                                    className="w-full px-4 py-2 rounded bg-text text-black focus:outline-none"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="password" className="block text-black text-[32px] text-left mb-2">Mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg bg-text text-black focus:outline-none"
                                        placeholder="Mot de passe"
                                    />
                                    <span
                                        className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                    {showPassword ? <img src={VectorIcon} alt="Hide Password" /> : <img src={EyePassIcon} alt="Show Password" />}
                  </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="confirmPassword" className="block text-black text-[32px] text-left mb-2">Confirmer le mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg bg-text text-black focus:outline-none"
                                        placeholder="Confirmer mot de passe"
                                    />
                                    <span
                                        className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                    {showConfirmPassword ? <img src={VectorIcon} alt="Hide Password" /> : <img src={EyePassIcon} alt="Show Password" />}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Message d'erreur ou de succès */}
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    {success && <p className="text-green-600 text-center mb-4">Inscription réussie ! Redirection...</p>}

                    {/* Case CGU */}
                    <div className="flex items-center justify-center mb-6">
                        <input
                            id="cgu"
                            type="checkbox"
                            checked={acceptCGU}
                            onChange={(e) => setAcceptCGU(e.target.checked)}
                            className="mr-2 w-5 h-5"
                        />
                        <label htmlFor="cgu" className="text-[16px] text-black cursor-pointer">
                            {" "}
                            <Link to="/cgu" className="text-blue-600 underline">
	                              J'ai lu et j'accepte les conditions générales
                            </Link>
                        </label>
                    </div>

                    <div className="flex flex-col items-center">
                        <button
                            type="submit"
                            disabled={!acceptCGU}
                            className={`w-[229px] py-3 rounded-full shadow-lg font-bold font-poppins transition 
                ${!acceptCGU ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-[#DFF7E9] text-black hover:bg-[#c9efd9]"}`}
                        >
                            S'inscrire
                        </button>
                    </div>

                    <p className="text-center mt-4 text-black">
                        Déjà un compte ? <Link to="/Login" className="text-gray-500">Se connecter</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signup;
