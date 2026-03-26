import { companyContact } from "../config/company";
import { useSeo } from "../hooks/useSeo";

export default function LegalNoticePage() {
  useSeo({
    title: "Mentions legales",
    description: "Informations legales du site Groupe Prolongation.",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 page-enter">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Mentions legales</h1>
        <p className="mt-2 text-sm text-slate-600">
          Derniere mise a jour: {new Date().toLocaleDateString("fr-CA")}
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Editeur du site</h2>
        <p className="text-sm text-slate-700">
          Groupe Prolongation
          <br />
          Email public:{" "}
          <a href={`mailto:${companyContact.publicEmail}`} className="text-brand-700 hover:underline">
            {companyContact.publicEmail}
          </a>
          <br />
          Support technique:{" "}
          <a href={`mailto:${companyContact.supportEmail}`} className="text-brand-700 hover:underline">
            {companyContact.supportEmail}
          </a>
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Direction de publication</h2>
        <p className="text-sm text-slate-700">
          La publication des annonces est assuree exclusivement par l administrateur officiel du site.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Hebergement</h2>
        <p className="text-sm text-slate-700">
          Site heberge sur une infrastructure mutualisee de type GreenGeeks (PHP/MySQL), avec securisation standard,
          sauvegardes et maintenance courante.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Objet du site</h2>
        <p className="text-sm text-slate-700">
          Ce site permet la consultation d annonces et la gestion d annonces par un compte administrateur autorise.
          Les visiteurs peuvent consulter les contenus et envoyer des demandes via la page Contact.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Propriete intellectuelle</h2>
        <p className="text-sm text-slate-700">
          Les contenus du site (textes, images, elements graphiques, logo) sont proteges. Toute reproduction partielle
          ou totale sans autorisation ecrite prealable est interdite.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Responsabilite</h2>
        <p className="text-sm text-slate-700">
          Groupe Prolongation met en oeuvre des moyens raisonnables pour assurer l exactitude des informations, mais ne
          peut garantir l absence totale d erreurs ou d interruptions techniques.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Contact et support</h2>
        <p className="text-sm text-slate-700">
          Pour toute demande legale ou technique:
          <br />
          <a href={`mailto:${companyContact.publicEmail}`} className="text-brand-700 hover:underline">
            {companyContact.publicEmail}
          </a>
          <br />
          <a href={`mailto:${companyContact.supportEmail}`} className="text-brand-700 hover:underline">
            {companyContact.supportEmail}
          </a>
        </p>
      </section>
    </div>
  );
}
