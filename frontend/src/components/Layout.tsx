import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed left-[-8rem] top-24 z-0 h-72 w-72 rounded-full bg-brand-200/35 blur-3xl" />
      <div className="pointer-events-none fixed bottom-10 right-[-8rem] z-0 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
      <Header />
      <main className="relative z-10 flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
