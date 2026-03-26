import { ChevronDownIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useSeo } from "../hooks/useSeo";

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "Comment publier une annonce ?",
    answer:
      "Connectez-vous d abord sur /admin, puis cliquez sur Ajouter une annonce. Remplissez les champs obligatoires, ajoutez vos medias et validez.",
  },
  {
    question: "Qui peut publier des annonces ?",
    answer:
      "Seul le compte admin peut publier, modifier et supprimer les annonces. Les visiteurs consultent seulement les annonces.",
  },
  {
    question: "Combien de photos ou videos puis-je ajouter ?",
    answer:
      "Vous pouvez ajouter jusqu a 20 medias par annonce (photos et videos).",
  },
  {
    question: "Quels formats de fichiers sont acceptes ?",
    answer:
      "Images: JPG, JPEG, JFIF, PNG, WEBP, GIF, AVIF, BMP, HEIC, HEIF, TIFF, ICO. Videos: MP4, WEBM, OGG, MOV, MPEG.",
  },
  {
    question: "Pourquoi certains champs changent selon la categorie ?",
    answer:
      "Le formulaire adapte automatiquement les attributs selon la categorie choisie (par exemple carburant, transmission, annee, kilometrage pour les vehicules).",
  },
  {
    question: "Comment modifier une annonce existante ?",
    answer:
      "Dans /admin, cliquez sur Modifier sur la ligne de l annonce. Mettez les informations a jour puis enregistrez.",
  },
  {
    question: "Comment supprimer une annonce ?",
    answer:
      "Dans /admin, cliquez sur Supprimer. Une confirmation est demandee avant la suppression definitive.",
  },
  {
    question: "Que faire en cas de blocage ?",
    answer:
      "Contactez le support technique: support@konzotechagency.com avec capture ecran, URL de la page et heure du probleme.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  useSeo({
    title: "FAQ",
    description: "Retrouvez les reponses aux questions frequentes sur Groupe Prolongation.",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 page-enter">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-100 p-2">
            <QuestionMarkCircleIcon className="h-6 w-6 text-brand-700" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-slate-900">FAQ</h1>
            <p className="text-sm text-slate-600">Questions frequentes et reponses rapides.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <article
              key={item.question}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-slate-900 sm:text-base">{item.question}</span>
                <ChevronDownIcon
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
                    isOpen ? "rotate-180 text-brand-700" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="text-sm text-slate-700">{item.answer}</p>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
