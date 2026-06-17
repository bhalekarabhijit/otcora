export type PrescriptionStatus = "otc" | "prescription" | "unknown";

export type Severity = "low" | "medium" | "high";

export interface SourceAttribution {
  sourceUrl: string;
  sitemapType: "drug" | "otc" | "generic" | "disease" | "category" | "manual";
  sourceName: string;
  lastSeenAt?: string;
  scrapedAt?: string;
  parserVersion?: string;
  confidence: number;
}

export interface Symptom {
  id: string;
  label: string;
  aliases: string[];
  redFlagTerms?: string[];
}

export interface Medicine {
  id: string;
  name: string;
  composition?: string;
  genericName?: string;
  manufacturer?: string;
  form?: string;
  strength?: string;
  packaging?: string;
  mrp?: string;
  price?: string;
  imageUrl?: string;
  prescriptionStatus: PrescriptionStatus;
  indications: string[];
  symptomIds: string[];
  warnings: string[];
  source: SourceAttribution;
}

export interface UserContext {
  ageGroup?: "child" | "adult" | "older-adult";
  pregnant?: boolean;
  allergies?: string[];
  currentMedicineNames?: string[];
}

export interface RecommendationRequest {
  symptomIds: string[];
  context?: UserContext;
}

export interface RecommendationItem {
  medicine: Medicine;
  matchScore: number;
  reasons: string[];
  cautions: string[];
}

export interface SeekCareItem {
  title: string;
  description: string;
  severity: Severity;
}

export interface RecommendationResponse {
  otc: RecommendationItem[];
  prescription: RecommendationItem[];
  avoid: RecommendationItem[];
  seekCare: SeekCareItem[];
  disclaimer: string;
}
