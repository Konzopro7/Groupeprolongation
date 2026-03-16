import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Accueil" },
  { to: "/annonces", label: "Annonces" },
  { to: "/a-propos", label: "A propos" },
  { to: "/contact", label: "Contact" },
];

function NavItems({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {navLinks.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onClick}
          className={({ isActive }) =>
            `rounded-xl px-3 py-2 text-sm font-semibold transition duration-200 ${
              isActive
                ? "bg-brand-100 text-brand-800 shadow-[inset_0_0_0_1px_rgba(50,140,245,0.25)]"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/branding/logo.png");
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 6);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
        isScrolled ? "shadow-[0_10px_28px_rgba(15,36,56,0.12)]" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-4 sm:gap-5">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-soft sm:h-20 sm:w-20">
            <img
              src={logoSrc}
              alt="Logo Groupe Prolongation"
              onError={() => {
                if (logoSrc !== "/logo-placeholder.svg") {
                  setLogoSrc("/logo-placeholder.svg");
                }
              }}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="leading-tight">
            <p className="font-heading text-base font-semibold tracking-wide text-brand-700 sm:text-lg">Groupe</p>
            <p className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">Prolongation</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavItems />
        </nav>

        <button
          type="button"
          className="inline-flex rounded-xl border border-slate-200 p-2 text-slate-700 md:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Ouvrir le menu"
        >
          {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            <NavItems onClick={() => setIsOpen(false)} />
          </nav>
        </div>
      )}
    </header>
  );
}
