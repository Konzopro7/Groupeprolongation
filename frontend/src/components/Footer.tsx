export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-heading text-lg font-bold text-slate-900">Groupe Prolongation</p>
          <p className="mt-2 text-sm text-slate-600">
            Plateforme d'annonces modernes pour l'automobile et d'autres categories.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">Contact</p>
          <a
            href="mailto:contact@groupeprolongation.com"
            className="mt-2 inline-block rounded-md px-1 text-sm text-brand-700 transition hover:bg-brand-50 hover:text-brand-800"
          >
            contact@groupeprolongation.com
          </a>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">Informations</p>
          <div className="mt-2 flex flex-col gap-2 text-sm text-slate-600">
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
