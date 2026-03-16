import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { useSeo } from "../hooks/useSeo";

export default function AboutPage() {
  useSeo({
    title: "A propos",
    description: "Decouvrez la mission et la vision de Groupe Prolongation.",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 page-enter">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft sm:p-10">
        <h1 className="font-heading text-3xl font-bold text-slate-900">A propos de nous</h1>
        <p className="mt-4 text-slate-700">
          Groupe Prolongation est ne d'une idee simple: proposer une plateforme de petites annonces
          plus claire, plus rapide et plus professionnelle, d'abord pour l'automobile puis pour
          d'autres secteurs.
        </p>
        <p className="mt-4 text-slate-700">
          Notre objectif est d'offrir une experience fluide aux vendeurs comme aux acheteurs, avec
          des fiches detaillees, des filtres utiles et un socle technique evolutif.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {[
          "Publication d'annonces en quelques minutes",
          "Navigation mobile et desktop optimisee",
          "Architecture robuste React + PHP + MySQL",
          "Base prete a evoluer vers des categories multiples",
        ].map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <CheckBadgeIcon className="mt-0.5 h-5 w-5 text-accent-600" />
            <p className="text-sm text-slate-700">{item}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
