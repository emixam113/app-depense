import React, { useState } from 'react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email et date de naissance, 2: token et nouveau mot de passe
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  // Étape 1 : Vérification email + date de naissance
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const emailInput = form.email.value;
    const birthdate = form.birthdate.value;

    const birthdateFormatted = birthdate.split('-').reverse().join('-'); // yyyy-mm-dd -> dd-mm-yyyy

    try {
      const res = await fetch('http://localhost:3000/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailInput, birthdate: birthdateFormatted }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la vérification');
      }

      const data = await res.json();
      console.log('Réponse du serveur:', data);
      setEmail(emailInput);
      setStep(2); // Passer à l'étape suivante
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  // Étape 2 : Réinitialisation du mot de passe
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const tokenInput = form.token.value;
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    if (!tokenInput) {
      setError('Veuillez entrer le code de réinitialisation reçu par email.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          newPassword,
          token: tokenInput 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la réinitialisation');
      }

      const data = await res.json();
      console.log('Réinitialisation réussie:', data);
      alert('Mot de passe réinitialisé avec succès !');
      window.location.href = '/login'; // Rediriger vers la page de connexion
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: 'var(--color-botlogin)' }}>
      <div className="w-full flex items-center p-4">
        <img src="/logo.svg" alt="Logo Fineo" className="h-16 w-16" />
        <span className="ml-2 font-bold text-sm text-black">
          L’outil pour la nouvelle finance
        </span>
      </div>

      <h1 className="text-4xl font-medium mt-8 mb-6 text-black text-center">
        Mot de passe oublié ?
      </h1>

      <div className="rounded-3xl p-10 w-[90%] max-w-3xl flex flex-col items-center"
           style={{ backgroundColor: 'var(--color-login)' }}>
        {step === 1 ? (
          <form onSubmit={handleVerification} className="space-y-6 w-full max-w-md">
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-black mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                placeholder="exemple@exemple.com"
                required
                className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                style={{ backgroundColor: 'var(--color-botlogin)' }}
              />
            </div>

            <div>
              <label htmlFor="birthdate" className="block text-lg font-medium text-black mb-1">
                Date de naissance
              </label>
              <input
                type="date"
                id="birthdate"
                required
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
                Vérifier
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6 w-full max-w-md">
            <div>
              <label htmlFor="token" className="block text-lg font-medium text-black mb-1">
                Code de réinitialisation
              </label>
              <input
                type="text"
                id="token"
                placeholder="Entrez le code reçu par email"
                required
                className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                style={{ backgroundColor: 'var(--color-botlogin)' }}
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-lg font-medium text-black mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="newPassword"
                required
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
                required
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
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
