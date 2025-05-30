import React, { useState } from 'react';

export default function ForgotPassword() {
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  // Simulation de vérification
  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    const birthdate = (e.target as any).birthdate.value;

    // Exemple de condition à remplacer par ta logique réelle
    if (email === 'test@example.com' && birthdate === '01/01/1968') {
      setIsVerified(true);
      setError('');
    } else {
      setError("Les informations ne correspondent pas.");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Logique de réinitialisation ici
    alert('Mot de passe réinitialisé !');
  };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: 'var(--color-botlogin)' }}>
      {/* Header */}
      <div className="w-full flex items-center p-4">
        <img
          src="/logo.svg"
          alt="Logo Fineo"
          className="h-16 w-16"
        />
        <span className="ml-2 font-bold text-sm text-black">
          L’outil pour la nouvelle finance
        </span>
      </div>

      <h1 className="text-4xl font-medium mt-8 mb-6 text-black text-center">
        Mot de passe oublié ?
      </h1>

      {/* Contenu conditionnel */}
      <div
        className="rounded-3xl p-10 w-[90%] max-w-3xl flex flex-col items-center"
        style={{ backgroundColor: 'var(--color-login)' }}
      >
        {!isVerified ? (
          <form onSubmit={handleVerification} className="space-y-6 w-full max-w-md">
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-black mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                placeholder="exemple@exemple.com"
                className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                style={{ backgroundColor: 'var(--color-botlogin)' }}
              />
            </div>

            <div>
              <label htmlFor="birthdate" className="block text-lg font-medium text-black mb-1">
                Date de naissance
              </label>
              <input
                type="text"
                id="birthdate"
                placeholder="01/01/1968"
                className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                style={{ backgroundColor: 'var(--color-botlogin)' }}
              />
            </div>

            {error && <p className="text-red-600 font-medium">{error}</p>}

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="text-black font-semibold px-6 py-2 rounded-full shadow hover:brightness-105 transition"
                style={{ backgroundColor: 'var(--color-botlogin)' }}
              >
                Réinitialiser
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6 w-full max-w-md">
            <div>
              <label htmlFor="newPassword" className="block text-lg font-medium text-black mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="newPassword"
                placeholder="********"
                className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                style={{ backgroundColor: 'var(--color-botlogin)' }}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-lg font-medium text-black mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="********"
                className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                style={{ backgroundColor: 'var(--color-botlogin)' }}
              />
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="text-black font-semibold px-6 py-2 rounded-full shadow hover:brightness-105 transition"
                style={{ backgroundColor: 'var(--color-botlogin)' }}
              >
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
