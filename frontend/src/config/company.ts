export interface ContactPhone {
  label: string;
  display: string;
  tel: string;
  whatsappUrl: string;
}

export interface WarehouseAddress {
  label: string;
  address: string;
  mapUrl: string;
  mapEmbedUrl: string;
}

export interface SocialLink {
  name: "Instagram" | "Facebook" | "WhatsApp";
  href: string;
  icon: string;
}

export const companyContact = {
  publicEmail: "contact@groupeprolongation.com",
  supportEmail: "support@konzotechagency.com",
  phones: [
    {
      label: "Canada",
      display: "+1 514 241 5538",
      tel: "+15142415538",
      whatsappUrl: "https://wa.me/15142415538",
    },
    {
      label: "Cameroun",
      display: "+237 694 70 14 00",
      tel: "+237694701400",
      whatsappUrl: "https://wa.me/237694701400",
    },
  ] as ContactPhone[],
  warehouses: [
    {
      label: "Entrepot Canada",
      address: "117 BRUNO NANTEL SAINT JEROME",
      mapUrl: "https://maps.google.com/?q=117+BRUNO+NANTEL+SAINT+JEROME",
      mapEmbedUrl: "https://www.google.com/maps?q=117+BRUNO+NANTEL+SAINT+JEROME&output=embed",
    },
    {
      label: "Entrepot Cameroun",
      address: "ENTREE DU PETIT MARCHE MISSOKE A COTE DE L EGLISE CATHOLIQUE",
      mapUrl: "https://maps.google.com/?q=ENTREE+DU+PETIT+MARCHE+MISSOKE+A+COTE+DE+L+EGLISE+CATHOLIQUE",
      mapEmbedUrl:
        "https://www.google.com/maps?q=ENTREE+DU+PETIT+MARCHE+MISSOKE+A+COTE+DE+L+EGLISE+CATHOLIQUE&output=embed",
    },
  ] as WarehouseAddress[],
  // Remplace les URLs ci-dessous avec les profils reels du client.
  socials: [
    {
      name: "Instagram",
      href: "https://instagram.com/",
      icon: "/social/instagram.svg",
    },
    {
      name: "Facebook",
      href: "https://facebook.com/",
      icon: "/social/facebook.svg",
    },
    {
      name: "WhatsApp",
      href: "https://wa.me/15142415538",
      icon: "/social/whatsapp.svg",
    },
  ] as SocialLink[],
} as const;
