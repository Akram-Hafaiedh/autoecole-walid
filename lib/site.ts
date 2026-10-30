// Single place to edit the school's public details.
// Every value marked TODO is a placeholder: replace it with the real one before going live.

export const site = {
  name: "Auto-École Walid",
  tagline: "Code et conduite, avec un suivi personnalisé.",
  description:
    "Auto-école : préparation au code de la route et leçons de conduite avec un moniteur dédié.",
  currency: "DT", // TODO confirm the currency shown on prices
  phone: {
    display: "+216 00 000 000", // TODO real number
    tel: "+21600000000", // TODO same number, no spaces
  },
  whatsapp: "21600000000", // TODO digits only, with country code
  email: "contact@example.com", // TODO
  address: ["Adresse à compléter", "Ville à compléter"], // TODO
  hours: [
    { days: "Lundi – Vendredi", time: "08:00 – 18:00" }, // TODO
    { days: "Samedi", time: "08:00 – 13:00" }, // TODO
  ],
} as const;

export type Offer = {
  id: string;
  name: string;
  summary: string;
  includes: string[];
  /** Price in site.currency. null shows "Sur demande" until the real price is known. */
  price: number | null;
};

export const offers: Offer[] = [
  {
    id: "code",
    name: "Code de la route",
    summary: "Cours théoriques et séries d’entraînement pour préparer l’examen du code.",
    includes: ["Cours de code", "Séries d’entraînement", "Suivi de votre progression"],
    price: null, // TODO
  },
  {
    id: "conduite",
    name: "Conduite",
    summary: "Leçons pratiques avec un moniteur, sur un véhicule de l’école.",
    includes: [
      "Leçons individuelles",
      "Véhicule de l’école",
      "Planning adapté à vos horaires",
    ],
    price: null, // TODO
  },
  {
    id: "complet",
    name: "Forfait complet",
    summary: "Code et conduite réunis, de l’inscription jusqu’à l’examen.",
    includes: [
      "Code de la route",
      "Leçons de conduite",
      "Accompagnement le jour de l’examen",
    ],
    price: null, // TODO
  },
];

export function formatPrice(price: number | null): string {
  return price === null ? "Sur demande" : `${price} ${site.currency}`;
}
