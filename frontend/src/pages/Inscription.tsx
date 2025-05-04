import { useState } from "react";
import EyePassIcon from "../assets/Eye-Pass.svg";
import VectorIcon from "../assets/Vector.svg";
import {Link} from "react-router-dom";

const Inscription = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-botlogin relative">
      {/* Logo en haut à gauche */}
      <div className="absolute top-0 left-0">
        <div className="flex items-center">
          <img src="/logo.svg" alt="Finéo" className="w-44 h-44" />
          <span className="text-black font-bold text-lg p-2">L'outil pour la nouvelle finance</span>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col items-center mt-50">
        <div className="text-[32px] text-center mb-5">
          Création d'un compte 
        </div>
        
        {/* Formulaire d'inscription */}
        <div className="bg-login w-[900px] max-w-[900px] rounded-lg p-8 mt-12 shadow-md">
          {/* Colonnes */}
          <div className="grid grid-cols-2 gap-4">
            {/* Colonne 1 */}
            <div>
              {/* Champ Nom */}
              <div className="mb-4">
                <label className="block text-black text-[32px] text-left mb-2">Nom</label>
                <input
                  type="text"
                  placeholder="Votre nom"
                  className="w-full px-4 py-2 rounded bg-text text-black focus:outline-none"
                />
              </div>

              {/* Champ Prénom */}
              <div className="mb-4">
                <label className="block text-black text-[32px] text-left mb-2 rounded-lg ">Prénom</label>
                <input
                  type="text"
                  placeholder="Votre prénom"
                  className="w-full px-4 py-2 rounded bg-text text-black focus:outline-none"
                />
              </div>

              {/* Champ Date de naissance */}
              <div className="mb-4">
                <label className="block text-black text-[32px] text-left mb-2">Date de naissance</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 rounded bg-text text-black focus:outline-none"
                />
              </div>
            </div>

            {/* Colonne 2 */}
            <div>
              {/* Champ Email */}
              <div className="mb-4">
                <label className="block text-black text-[32px] text-left mb-2">E-mail</label>
                <input
                  type="email"
                  placeholder="exemple@exemple.com"
                  className="w-full px-4 py-2 rounded bg-text text-black focus:outline-none"
                />
              </div>

              {/* Champ Mot de passe */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-black text-[32px] text-left mb-2">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="w-full px-4 py-2 rounded-lg bg-text text-black focus:outline-none"
                    placeholder="password"
                  />
                  <span
                    className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <img src={VectorIcon} alt="Hide Password" /> : <img src={EyePassIcon} alt="Show Password" />}
                  </span>
                </div>
              </div>

              {/* Champ Confirmation du mot de passe */}
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-black text-[32px] text-left mb-2">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    className="w-full px-4 py-2 rounded-lg bg-text text-black focus:outline-none"
                    placeholder="password"
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

          {/* Conditions générales et bouton */}
          <div className="flex flex-col items-center">
            <span className="text-[16px] text-center text-black mb-4">En cliquant, vous acceptez les conditions générale d'utilisation</span>
            <button className="w-[229px] py-3 bg-[#DFF7E9] text-black font-bold font-poppins rounded-full shadow-lg cursor-pointer">
              S'inscrire
            </button>
          </div>

          {/* Lien Se connecter */}
          <p className="text-center mt-4 text-black">
            Déjà un compte ? <Link to="/Login" className="text-gray-500">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Inscription 