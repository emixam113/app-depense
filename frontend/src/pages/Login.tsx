import { useState } from "react";
import EyePassIcon from "../assets/Eye-Pass.svg";
import VectorIcon from "../assets/Vector.svg";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("✅ Réponse du serveur :", data);
    } catch (error) {
      console.error("❌ Erreur lors de la connexion :", error);
    }
  };





  return (
    <div className="flex flex-col items-center min-h-screen bg-botlogin">
      {/* En-tête */}
      <div className="w-full flex items-center space-x-3">
        <img src="/logo.svg" alt="Finéo Logo" className="w-44 h-44" />
        <span className="text-black font-bold text-lg">L'outil pour la nouvelle finance</span>
      </div>

      {/* Titre */}
      <h1 className="text-[32px] text-black pt-20">Bienvenue</h1>

      {/* Formulaire */}
      <div className="bg-login w-[600px] max-w-[600px] rounded-lg p-12 mt-12 shadow-md">
        {/* Champ Email */}
        <div className="mb-6 rounded-full">
          <label className="block text-black text-[32px] text-left mb-2 ">E-mail</label>
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
          <label htmlFor="password" className="block text-black text-[32px] text-left mb-2 font-poppins">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-text text-black focus:outline-none pl-10 font-poppins"
              placeholder="Password"
            />
            <span
              className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <img src={VectorIcon} alt="Hide Password" /> : <img src={EyePassIcon} alt="Show Password" />}
            </span>
          </div>
          <p className="text-sm text-black mt-2 cursor-pointer text-left">Mot de passe oublié ?</p>
        </div>

        {/* Bouton Se connecter */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLogin}
            className="w-[229px] py-3 bg-[#DFF7E9] text-black font-bold font-poppins rounded-full shadow-lg">
            Se Connecter
          </button>
        </div>

        {/* Lien Inscription */}
        <p className="text-center mt-6 text-black">
          Pas encore de compte ? <a href="/Inscription" className="text-gray-500">S'inscrire</a>

        </p>
      </div>
    </div>
  );
};

export default Login
