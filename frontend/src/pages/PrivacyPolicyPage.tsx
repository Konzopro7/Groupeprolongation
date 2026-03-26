import { companyContact } from "../config/company";
import { useSeo } from "../hooks/useSeo";

export default function PrivacyPolicyPage() {
  useSeo({
    title: "Politique de confidentialite",
    description: "Politique de confidentialite de Groupe Prolongation.",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 page-enter">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Politique de confidentialite</h1>
        <p className="mt-2 text-sm text-slate-600">
          Derniere mise a jour: {new Date().toLocaleDateString("fr-CA")}
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Donnees collectees</h2>
        <p className="text-sm text-slate-700">
          Nous collectons uniquement les donnees necessaires au fonctionnement du service, notamment celles envoyees via
          les formulaires (nom, email, message) et les informations des annonces gerees par l administrateur.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Utilisation des donnees</h2>
        <p className="text-sm text-slate-700">
          Les donnees servent a traiter les demandes de contact, afficher les annonces, maintenir la securite et
          ameliorer l experience utilisateur.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Base legale</h2>
        <p className="text-sm text-slate-700">
          Le traitement repose sur l interet legitime du service (gestion des annonces et reponses aux demandes) et, si
          necessaire, sur le consentement de l utilisateur lors de l envoi de formulaires.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Conservation</h2>
        <p className="text-sm text-slate-700">
          Les donnees sont conservees pendant la duree necessaire a la finalite du service et aux obligations legales.
          Les messages de contact et donnees d annonces peuvent etre supprimes sur demande legitime.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Vos droits</h2>
        <p className="text-sm text-slate-700">
          Vous pouvez demander l acces, la rectification ou la suppression de vos donnees en contactant:
          <br />
          <a href={`mailto:${companyContact.supportEmail}`} className="text-brand-700 hover:underline">
            {companyContact.supportEmail}
          </a>
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Cookies et journaux techniques</h2>
        <p className="text-sm text-slate-700">
          Le site peut utiliser des cookies techniques strictement necessaires au fonctionnement, ainsi que des journaux
          serveur pour la securite, le diagnostic et la prevention des abus.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Securite</h2>
        <p className="text-sm text-slate-700">
          Nous mettons en place des mesures techniques raisonnables pour proteger les donnees. Toutefois, aucun systeme
          n est totalement exempt de risque.
        </p>
      </section>
    </div>
  );
}
