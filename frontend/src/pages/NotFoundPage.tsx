import { Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";

export default function NotFoundPage() {
  useSeo({
    title: "Page introuvable",
    description: "La page demandee est introuvable sur Groupe Prolongation.",
  });

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft page-enter">
      <h1 className="font-heading text-4xl font-bold text-slate-900">404</h1>
      <p className="mt-3 text-slate-700">La page demandee n'existe pas.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Retour a l'accueil
      </Link>
    </div>
  );
}
