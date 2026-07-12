export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://otcora.com";

export const symptomsForSeo = [
  {
    id: "fever",
    title: "Fever",
    description: "Understand common OTC fever-support options, why paracetamol is often discussed, and when fever needs medical care.",
    keywords: ["fever medicine", "OTC fever medicine", "paracetamol for fever"],
    redFlags: ["Fever lasting more than 3 days", "Confusion or stiff neck", "Very high temperature", "Dehydration or breathing difficulty"]
  },
  {
    id: "cough",
    title: "Cough",
    description: "Learn how dry cough, wet cough, congestion, and red-flag cough symptoms change OTC self-care decisions.",
    keywords: ["cough medicine", "OTC cough syrup", "dry cough medicine"],
    redFlags: ["Blood in cough", "Breathlessness", "Chest pain", "Cough lasting more than 2 weeks"]
  },
  {
    id: "dehydration",
    title: "Dehydration",
    description: "Learn when oral rehydration salts may help and which dehydration symptoms should be treated urgently.",
    keywords: ["dehydration ORS", "oral rehydration salts", "OTC dehydration support"],
    redFlags: ["Confusion", "No or very little urine", "Sunken eyes", "Severe weakness or blood in stool"]
  }
] as const;

export type SeoSymptom = (typeof symptomsForSeo)[number];
