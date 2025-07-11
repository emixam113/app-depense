import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    birthdate: '',
    token: '',
    newPassword: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { email, birthdate } = formData;

    if (!email.trim() || !birthdate) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      // Formater la date au format JJ-MM-AAAA attendu par le backend
      const birthdateFormatted = birthdate.split('-').reverse().join('-')

      const response = await fetch('http://localhost:3000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          birthdate: birthdateFormatted 
        }),
      });

      const data = await response.json();
      
      // Si la requête a réussi (statut 200) et que les données sont valides
      if (response.ok && data.success) {
        // Rediriger vers la page de réinitialisation (étape 2)
        setStep(2);
      } else {
        // Rediriger vers la page d'erreur
        navigate('/forgot-password-error');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      navigate('/forgot-password-error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { token, newPassword, confirmPassword, email } = formData;

    if (!token || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, token }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Erreur lors de la réinitialisation.');
        return;
      }

      alert('Mot de passe réinitialisé avec succès !');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10" style={{ backgroundColor: 'var(--color-botlogin)' }}>
      {/* Logo */}
      <div className="w-full flex items-center mb-6">
        <img src="/logo.svg" alt="Logo Fineo" className="h-16 w-16" />
        <span className="ml-3 text-black font-bold text-sm">L'outil pour la nouvelle finance</span>
      </div>

      <h1 className="text-4xl font-medium text-black text-center mb-8">
        {step === 1 ? 'Mot de passe oublié ?' : 'Réinitialiser votre mot de passe'}
      </h1>

      <div className="rounded-3xl p-10 w-full max-w-3xl" style={{ backgroundColor: 'var(--color-login)' }}>
        <form
          onSubmit={step === 1 ? handleVerification : handleResetPassword}
          className="space-y-6 max-w-md mx-auto"
        >
          {step === 1 ? (
            <>
              <div>
                <label htmlFor="email" className="block text-lg font-medium text-black mb-1">E-mail</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@exemple.com"
                  required
                  className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                  style={{ backgroundColor: 'var(--color-botlogin)' }}
                />
              </div>
              <div>
                <label htmlFor="birthdate" className="block text-lg font-medium text-black mb-1">Date de naissance</label>
                <input
                  type="date"
                  id="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                  style={{ backgroundColor: 'var(--color-botlogin)' }}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="token" className="block text-lg font-medium text-black mb-1">Code de réinitialisation</label>
                <input
                  type="text"
                  id="token"
                  value={formData.token}
                  onChange={handleChange}
                  placeholder="Code reçu par email"
                  required
                  className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                  style={{ backgroundColor: 'var(--color-botlogin)' }}
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-lg font-medium text-black mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                  style={{ backgroundColor: 'var(--color-botlogin)' }}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-lg font-medium text-black mb-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl p-3 text-black placeholder-gray-600 focus:outline-none"
                  style={{ backgroundColor: 'var(--color-botlogin)' }}
                />
              </div>
            </>
          )}

          {error && <p className="text-red-600 font-medium text-center">{error}</p>}

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="text-black font-semibold px-6 py-2 rounded-full shadow hover:brightness-105 transition"
              style={{ backgroundColor: 'var(--color-botlogin)' }}
            >
              {step === 1 ? 'Vérifier' : 'Réinitialiser'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
