import { ChevronDownIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { companyContact } from "../config/company";
import { useSeo } from "../hooks/useSeo";

interface FaqItem {
  key: string;
  question: string;
  answer: ReactNode;
}

const visitorFaq: FaqItem[] = [
  {
    key: "v-1",
    question: "Comment rechercher une annonce rapidement ?",
    answer: (
      <>
        Ouvrez la page <Link to="/annonces" className="text-brand-700 hover:underline">Annonces</Link> puis utilisez
        les filtres (categorie, carburant, prix) et la recherche par mot cle.
      </>
    ),
  },
  {
    key: "v-2",
    question: "Comment contacter Groupe Prolongation ?",
    answer: (
      <>
        Depuis la fiche annonce, cliquez sur <strong>Contacter</strong> ou allez sur{" "}
        <Link to="/contact" className="text-brand-700 hover:underline">/contact</Link>. Vous pouvez aussi envoyer un
        email a{" "}
        <a href={`mailto:${companyContact.publicEmail}`} className="text-brand-700 hover:underline">
          {companyContact.publicEmail}
        </a>.
      </>
    ),
  },
  {
    key: "v-3",
    question: "Puis-je publier une annonce si je suis visiteur ?",
    answer: (
      <>
        Non. La publication et la gestion des annonces sont reservees uniquement a l administrateur du site.
      </>
    ),
  },
  {
    key: "v-4",
    question: "Ou se trouvent les entrepots ?",
    answer: (
      <>
        <a
          href={companyContact.warehouses[0].mapUrl}
          target="_blank"
          rel="noreferrer"
          className="text-brand-700 hover:underline"
        >
          Entrepot Canada: {companyContact.warehouses[0].address}
        </a>
        <br />
        <a
          href={companyContact.warehouses[1].mapUrl}
          target="_blank"
          rel="noreferrer"
          className="text-brand-700 hover:underline"
        >
          Entrepot Cameroun: {companyContact.warehouses[1].address}
        </a>
      </>
    ),
  },
  {
    key: "v-5",
    question: "Que faire en cas de blocage ?",
    answer: (
      <>
        Contactez le support technique a{" "}
        <a href={`mailto:${companyContact.supportEmail}`} className="text-brand-700 hover:underline">
          {companyContact.supportEmail}
        </a>{" "}
        avec une capture ecran, l URL et l heure du probleme.
      </>
    ),
  },
];

interface FaqGroupProps {
  title: string;
  description: string;
  items: FaqItem[];
  openKey: string | null;
  onToggle: (key: string) => void;
}

function FaqGroup({ title, description, items, openKey, onToggle }: FaqGroupProps) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {items.map((item) => {
        const isOpen = openKey === item.key;
        return (
          <article
            key={item.key}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
          >
            <button
              type="button"
              onClick={() => onToggle(item.key)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <p className="text-sm font-semibold text-slate-900 sm:text-base">{item.question}</p>
              <ChevronDownIcon
                className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
                  isOpen ? "rotate-180 text-brand-700" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 px-5 py-4">
                <div className="text-sm text-slate-700">{item.answer}</div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

export default function FaqPage() {
  const [openKey, setOpenKey] = useState<string | null>(visitorFaq[0]?.key ?? null);

  useSeo({
    title: "FAQ",
    description: "Guide d utilisation pour les visiteurs de Groupe Prolongation.",
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
            <p className="text-sm text-slate-600">Questions frequentes pour les visiteurs.</p>
          </div>
        </div>
      </section>

      <FaqGroup
        title="Pour les visiteurs"
        description="Consulter les annonces, trouver les contacts et obtenir de l aide."
        items={visitorFaq}
        openKey={openKey}
        onToggle={(key) => setOpenKey((current) => (current === key ? null : key))}
      />
    </div>
  );
}
