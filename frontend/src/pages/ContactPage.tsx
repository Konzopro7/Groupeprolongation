import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { sendContactMessage } from "../api/client";
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
      const message =
        apiError instanceof Error ? apiError.message : "Impossible d'envoyer votre message.";
      setServerError(message);
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
