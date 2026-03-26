import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AdminPage from "./pages/AdminPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FaqPage from "./pages/FaqPage";
import HomePage from "./pages/HomePage";
import ListingDetailsPage from "./pages/ListingDetailsPage";
import ListingsPage from "./pages/ListingsPage";
import LegalNoticePage from "./pages/LegalNoticePage";
import NotFoundPage from "./pages/NotFoundPage";
import PublishPage from "./pages/PublishPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/annonces" element={<ListingsPage />} />
        <Route path="/annonces/:id" element={<ListingDetailsPage />} />
        <Route path="/publier" element={<PublishPage />} />
        <Route path="/publier/:id" element={<PublishPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/a-propos" element={<AboutPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/mentions-legales" element={<LegalNoticePage />} />
        <Route path="/politique-confidentialite" element={<PrivacyPolicyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
