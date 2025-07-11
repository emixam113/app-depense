import { useNavigate } from "react-router-dom";

export default function ForgotPasswordError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-green-100 flex flex-col items-center justify-start p-4">
      <header className="w-full flex items-center p-4">
        <img
          src="/logo.svg"
          alt="Finéo"
          className="h-12 mr-4"
        />
        <h2 className="text-sm text-green-900 font-medium underline">
          L’outil pour la nouvelle finance
        </h2>
      </header>

      <main className="w-full max-w-xl bg-green-200 rounded-2xl p-6 text-center mt-8">
        <h1 className="text-2xl font-semibold text-green-900 mb-6">
          Mot de passe oublié ?
        </h1>

        <p className="text-black mb-4">
          Malheureusement, nous n'avons pas pu trouver de compte correspondant
          aux informations fournies (email et date de naissance).
        </p>
        <p className="text-black mb-6">
          Veuillez vérifier que les informations saisies sont correctes et
          réessayer. Si vous pensez qu'il s'agit d'une erreur ou si vous avez
          besoin d'aide, n'hésitez pas à contacter notre support.
        </p>

        <button
          onClick={() => navigate("/")}
          className="bg-green-50 hover:bg-green-300 text-black font-semibold py-2 px-6 rounded-full"
        >
          Home
        </button>
      </main>
    </div>
  );
}
