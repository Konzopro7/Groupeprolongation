import { Link } from "react-router-dom";
import { companyContact } from "../config/company";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-heading text-lg font-bold text-slate-900">Groupe Prolongation</p>
          <p className="mt-2 text-sm text-slate-600">
            Plateforme d'annonces modernes pour l'automobile et d'autres categories.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">Contact</p>
          <a
            href={`mailto:${companyContact.publicEmail}`}
            className="mt-2 inline-block rounded-md px-1 text-sm text-brand-700 transition hover:bg-brand-50 hover:text-brand-800"
          >
            {companyContact.publicEmail}
          </a>
          <div className="mt-2 space-y-1">
            {companyContact.phones.map((phone) => (
              <div key={phone.label} className="text-sm text-slate-600">
                <span className="font-semibold text-slate-700">{phone.label}:</span>{" "}
                <a href={`tel:${phone.tel}`} className="text-brand-700 hover:underline">
                  {phone.display}
                </a>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">Entrepots</p>
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            {companyContact.warehouses.map((warehouse) => (
              <p key={warehouse.label}>
                <span className="font-semibold text-slate-700">{warehouse.label}:</span>{" "}
                {warehouse.address}
              </p>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">Informations</p>
          <div className="mt-3 flex items-center gap-2">
            {companyContact.socials.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
                title={social.name}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft"
              >
                <img src={social.icon} alt={social.name} className="h-5 w-5 object-contain" />
              </a>
            ))}
          </div>
          <a
            href={`mailto:${companyContact.supportEmail}`}
            className="mt-3 inline-block rounded-md px-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Support: {companyContact.supportEmail}
          </a>
          <div className="mt-2 flex flex-col gap-2 text-sm text-slate-600">
            <Link to="/faq" className="rounded-md px-1 transition hover:bg-slate-100 hover:text-slate-900">
              FAQ
            </Link>
            <a href="#" className="rounded-md px-1 transition hover:bg-slate-100 hover:text-slate-900">
              Mentions legales
            </a>
            <a href="#" className="rounded-md px-1 transition hover:bg-slate-100 hover:text-slate-900">
              Politique de confidentialite
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
        (c) {new Date().getFullYear()} Groupe Prolongation. Tous droits reserves.
      </div>
    </footer>
  );
}
