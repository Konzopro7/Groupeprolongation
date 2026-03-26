import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { sendContactMessage } from "../api/client";
import { companyContact } from "../config/company";
import { publicContactError } from "../utils/publicErrorMessage";
import { useSeo } from "../hooks/useSeo";

interface ContactFormValues {
  name: string;
  email: string;
  message: string;
}

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>();

  useSeo({
    title: "Contact",
    description: "Contactez l'equipe Groupe Prolongation pour vos demandes et questions.",
  });

  useEffect(() => {
    const listingId = searchParams.get("listing");
    const listingTitle = searchParams.get("title");
    if (listingId) {
      const prefilledMessage = listingTitle
        ? `Bonjour,\n\nJe suis interesse(e) par l'annonce #${listingId} (${listingTitle}).\nPouvez-vous me contacter ?`
        : `Bonjour,\n\nJe suis interesse(e) par l'annonce #${listingId}.\nPouvez-vous me contacter ?`;
      setValue("message", prefilledMessage);
    }
  }, [searchParams, setValue]);

  const onSubmit: SubmitHandler<ContactFormValues> = async (data) => {
    setServerError(null);
    setIsSuccess(false);
    try {
      await sendContactMessage(data);
      setIsSuccess(true);
      setValue("name", "");
      setValue("email", "");
      setValue("message", "");
    } catch (apiError) {
      setServerError(publicContactError(apiError));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 page-enter">
      <section>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Contact</h1>
        <p className="mt-1 text-slate-600">
          Ecrivez-nous pour toute question. Nous repondons rapidement.
        </p>
      </section>

      {isSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Message envoye avec succes. Merci.
        </div>
      )}
      {serverError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {serverError}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold text-slate-900">Telephones</p>
          <div className="mt-3 space-y-3">
            {companyContact.phones.map((phone) => (
              <div key={phone.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{phone.label}</p>
                <a href={`tel:${phone.tel}`} className="mt-1 block text-sm font-semibold text-brand-700 hover:underline">
                  {phone.display}
                </a>
                <a
                  href={phone.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  WhatsApp {phone.label}
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold text-slate-900">Entrepots</p>
          <div className="mt-3 space-y-3">
            {companyContact.warehouses.map((warehouse) => (
              <div key={warehouse.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{warehouse.label}</p>
                <p className="mt-1 text-sm text-slate-700">{warehouse.address}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold text-slate-900">Reseaux sociaux</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {companyContact.socials.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
            >
              <img src={social.icon} alt={social.name} className="h-4 w-4 object-contain" />
              {social.name}
            </a>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Support technique:{" "}
          <a href={`mailto:${companyContact.supportEmail}`} className="text-brand-700 hover:underline">
            {companyContact.supportEmail}
          </a>
        </p>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Nom *</label>
          <input
            {...register("name", {
              required: "Le nom est obligatoire.",
              minLength: { value: 2, message: "Minimum 2 caracteres." },
            })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Email *</label>
          <input
            type="email"
            {...register("email", {
              required: "L'email est obligatoire.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Format d'email invalide.",
              },
            })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Message *</label>
          <textarea
            rows={6}
            {...register("message", {
              required: "Le message est obligatoire.",
              minLength: { value: 10, message: "Minimum 10 caracteres." },
            })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          />
          {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
        </button>
      </form>
    </div>
  );
}
