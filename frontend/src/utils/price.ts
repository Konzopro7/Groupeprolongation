function normalizeCurrency(currency: string | null | undefined): string {
  const code = String(currency || "XAF").trim().toUpperCase();
  return code || "XAF";
}

export function formatPrice(amount: number, currency: string | null | undefined): string {
  const normalized = normalizeCurrency(currency);
  const value = Number.isFinite(amount) ? amount : 0;

  try {
    return new Intl.NumberFormat(normalized === "XAF" ? "fr-CM" : "fr-CA", {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: normalized === "XAF" ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString("fr-FR")} ${normalized}`;
  }
}

export function currencyLabel(currency: string | null | undefined): string {
  const normalized = normalizeCurrency(currency);
  if (normalized === "XAF") {
    return "FCFA";
  }
  return normalized;
}
