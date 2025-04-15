import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col justify-center min-h-screen bg-green-100">
      <div className="flex flex-col items-center p-6 rounded-lg ">
        <img src="/logo.svg" alt="Finéo"
        className="w-44 h-44 mb-4"
        />
        <h1 className="text-lg font-bold text-center mb-2">l'outil pour la nouvelle finance</h1>
        <button className="w-48 py-2 mt-2 font-bold rounded-full bg-primary m-4 cursor-pointer">
          <Link to="/Login">
            Se Connecter
          </Link>
        </button>
        <button className="w-48 py-2 mt-2 font-bold rounded-full bg-secondary m-4 cursor-pointer">
          <Link to="/Inscription">
            S'inscrire
          </Link>
        </button>
        <p className="text-gray-500 cursor-pointer hover:underline">
          Mot de passe oublié ?
        </p>
      </div>
    </div>
  );
};

export default Home;