export interface IngredientRule {
  patterns: string[];
  symptomIds: string[];
  indications: string[];
  warnings: string[];
  otcEligible?: boolean;
}

export const ingredientRules: IngredientRule[] = [
  {
    patterns: ["oral rehydration salts", "rehydration salts"],
    symptomIds: ["dehydration", "diarrhea", "loose-motion", "vomiting"],
    indications: ["Dehydration prevention", "Fluid and electrolyte replacement"],
    warnings: ["Seek care urgently for confusion, very little urine, severe weakness, blood in stool, or dehydration in infants."],
    otcEligible: true
  },
  {
    patterns: ["paracetamol", "acetaminophen"],
    symptomIds: ["fever", "headache", "migraine", "body-pain", "joint-pain", "back-pain", "arthritis-pain", "toothache", "menstrual-cramps", "sore-throat", "flu"],
    indications: ["Fever", "Headache", "Mild body pain"],
    warnings: ["Avoid duplicate paracetamol combinations.", "Ask a doctor if you have liver disease."],
    otcEligible: true
  },
  {
    patterns: ["aceclofenac", "diclofenac", "ibuprofen", "naproxen", "etoricoxib", "nimesulide", "piroxicam", "ketorolac"],
    symptomIds: ["body-pain", "joint-pain", "back-pain", "toothache", "menstrual-cramps", "arthritis-pain"],
    indications: ["Pain and inflammation", "Joint or muscle pain"],
    warnings: ["NSAIDs can irritate the stomach and may not be suitable in kidney disease, ulcers, pregnancy, or blood thinner use."]
  },
  {
    patterns: ["cetirizine", "levocetirizine", "fexofenadine", "chlorpheniramine", "pheniramine", "loratadine", "desloratadine", "bilastine", "hydroxyzine"],
    symptomIds: ["allergy", "cold", "itching", "skin-rash", "sneezing"],
    indications: ["Allergy symptoms", "Sneezing or runny nose", "Itching"],
    warnings: ["Some antihistamines can cause sleepiness. Avoid alcohol if drowsy."],
    otcEligible: true
  },
  {
    patterns: ["ambroxol", "guaifenesin", "bromhexine", "acetylcysteine"],
    symptomIds: ["cough", "chest-congestion"],
    indications: ["Wet cough", "Chest congestion"],
    warnings: ["Seek care if cough includes breathlessness, blood, chest pain, or lasts more than 2 weeks."],
    otcEligible: true
  },
  {
    patterns: ["dextromethorphan", "noscapine", "pholcodine"],
    symptomIds: ["dry-cough", "cough"],
    indications: ["Dry cough"],
    warnings: ["Do not use for persistent cough with breathing difficulty unless advised by a clinician."],
    otcEligible: true
  },
  {
    patterns: ["phenylephrine", "pseudoephedrine", "xylometazoline", "oxymetazoline"],
    symptomIds: ["blocked-nose", "cold", "sinus-congestion"],
    indications: ["Blocked nose", "Sinus congestion"],
    warnings: ["Decongestants may not be suitable in uncontrolled blood pressure or certain heart conditions."],
    otcEligible: true
  },
  {
    patterns: ["pantoprazole", "omeprazole", "esomeprazole", "rabeprazole", "lansoprazole", "ranitidine", "famotidine"],
    symptomIds: ["acidity", "heartburn", "indigestion"],
    indications: ["Acidity", "Heartburn", "Acid reflux"],
    warnings: ["Repeated or severe acidity should be reviewed by a doctor."],
    otcEligible: true
  },
  {
    patterns: ["magaldrate", "simethicone", "dimethicone", "sodium bicarbonate", "aluminium hydroxide", "magnesium hydroxide"],
    symptomIds: ["acidity", "heartburn", "gas", "indigestion"],
    indications: ["Gas", "Acidity", "Indigestion"],
    warnings: ["Ask a doctor if symptoms are frequent, severe, or associated with weight loss or vomiting."],
    otcEligible: true
  },
  {
    patterns: ["domperidone", "ondansetron", "metoclopramide", "meclizine", "doxylamine"],
    symptomIds: ["nausea", "vomiting", "vertigo", "motion-sickness"],
    indications: ["Nausea", "Vomiting", "Motion sickness or vertigo"],
    warnings: ["Persistent vomiting, dehydration, pregnancy, or severe abdominal pain needs medical advice."]
  },
  {
    patterns: ["loperamide", "racecadotril", "saccharomyces", "lactobacillus", "bacillus clausii", "probiotic"],
    symptomIds: ["diarrhea", "loose-motion", "dehydration"],
    indications: ["Loose motions", "Gut flora support"],
    warnings: ["Avoid self-treatment if there is blood in stool, high fever, severe dehydration, or diarrhea in infants."],
    otcEligible: true
  },
  {
    patterns: ["ispaghula", "lactulose", "polyethylene glycol", "bisacodyl", "sodium picosulfate", "liquid paraffin"],
    symptomIds: ["constipation"],
    indications: ["Constipation"],
    warnings: ["Severe abdominal pain, vomiting, or sudden bowel habit changes need medical review."],
    otcEligible: true
  },
  {
    patterns: ["salbutamol", "levosalbutamol", "formoterol", "salmeterol", "budesonide", "ipratropium", "montelukast", "acebrophylline", "theophylline"],
    symptomIds: ["wheezing", "asthma", "breathlessness", "cough"],
    indications: ["Wheezing", "Asthma or airway symptoms"],
    warnings: ["Breathlessness, blue lips, chest tightness, or severe wheezing can be urgent."]
  },
  {
    patterns: ["azithromycin", "amoxycillin", "amoxicillin", "clavulanic", "ampicillin", "cloxacillin", "cefixime", "cefuroxime", "cefadroxil", "cefpodoxime", "ciprofloxacin", "levofloxacin", "ofloxacin", "doxycycline", "clindamycin", "metronidazole", "tinidazole", "amikacin", "neomycin"],
    symptomIds: ["bacterial-infection", "fever", "sore-throat", "skin-infection", "uti"],
    indications: ["Bacterial infection"],
    warnings: ["Antibiotics require clinician guidance. Do not self-medicate or stop early without advice."]
  },
  {
    patterns: ["acyclovir", "valacyclovir", "famciclovir"],
    symptomIds: ["viral-infection", "cold-sores", "skin-rash"],
    indications: ["Viral infection symptoms"],
    warnings: ["Antivirals should be used under medical advice, especially around eyes, pregnancy, or weak immunity."]
  },
  {
    patterns: ["clotrimazole", "fluconazole", "itraconazole", "terbinafine", "ketoconazole", "miconazole", "amorolfine", "luliconazole", "sertaconazole"],
    symptomIds: ["fungal-infection"],
    indications: ["Fungal skin or nail infection"],
    warnings: ["Widespread, recurrent, nail, scalp, or genital symptoms need medical review."],
    otcEligible: true
  },
  {
    patterns: ["adapalene", "benzoyl peroxide", "clindamycin topical", "azelaic acid", "tretinoin", "isotretinoin"],
    symptomIds: ["acne", "skin-rash"],
    indications: ["Acne"],
    warnings: ["Retinoids and some acne medicines are not suitable in pregnancy unless prescribed."]
  },
  {
    patterns: ["hydrocortisone", "mometasone", "betamethasone", "clobetasol", "beclomethasone", "beclometasone", "fluticasone"],
    symptomIds: ["skin-rash", "itching", "allergy", "eczema"],
    indications: ["Inflamed or allergic skin symptoms"],
    warnings: ["Steroids should not be used on infections, face, or long term unless advised."]
  },
  {
    patterns: ["amlodipine", "telmisartan", "losartan", "olmesartan", "azilsartan", "atenolol", "metoprolol", "bisoprolol", "carvedilol", "cilnidipine", "nifedipine"],
    symptomIds: ["high-blood-pressure", "chest-pain", "heart-health"],
    indications: ["High blood pressure or heart condition"],
    warnings: ["Blood pressure and heart medicines should not be started, stopped, or changed without a doctor."]
  },
  {
    patterns: ["atorvastatin", "rosuvastatin", "simvastatin", "fenofibrate", "ezetimibe"],
    symptomIds: ["high-cholesterol", "heart-health"],
    indications: ["Cholesterol management"],
    warnings: ["Cholesterol medicines require periodic clinical follow-up."]
  },
  {
    patterns: ["aspirin", "clopidogrel", "ticagrelor", "warfarin", "rivaroxaban", "apixaban"],
    symptomIds: ["heart-health", "blood-clot-prevention", "chest-pain"],
    indications: ["Blood clot prevention or heart protection"],
    warnings: ["Blood thinners can cause bleeding and require medical supervision."]
  },
  {
    patterns: ["glimepiride", "metformin", "sitagliptin", "vildagliptin", "linagliptin", "dapagliflozin", "insulin"],
    symptomIds: ["diabetes", "high-blood-sugar"],
    indications: ["Diabetes or high blood sugar"],
    warnings: ["Diabetes medicines need glucose monitoring and doctor guidance."]
  },
  {
    patterns: ["thyroxine", "levothyroxine", "liothyronine", "carbimazole", "methimazole"],
    symptomIds: ["thyroid"],
    indications: ["Thyroid disorder"],
    warnings: ["Thyroid medicines need blood-test based dose adjustment."]
  },
  {
    patterns: ["alprazolam", "clonazepam", "diazepam", "lorazepam", "etizolam", "zolpidem"],
    symptomIds: ["anxiety", "insomnia", "panic"],
    indications: ["Anxiety or sleep symptoms"],
    warnings: ["These medicines can cause dependence and must be used only with medical supervision."]
  },
  {
    patterns: ["amitriptyline", "escitalopram", "sertraline", "fluoxetine", "duloxetine", "venlafaxine", "mirtazapine", "aripiprazole", "amisulpride", "olanzapine", "risperidone"],
    symptomIds: ["depression", "anxiety", "mental-health"],
    indications: ["Mental health symptoms"],
    warnings: ["Mental health medicines should be started and monitored by a clinician."]
  },
  {
    patterns: ["gabapentin", "pregabalin", "carbamazepine", "levetiracetam", "valproate", "topiramate", "phenytoin"],
    symptomIds: ["nerve-pain", "seizure", "migraine"],
    indications: ["Nerve pain", "Seizure disorder", "Migraine prevention"],
    warnings: ["Do not start or stop seizure or nerve medicines without medical advice."]
  },
  {
    patterns: ["drotaverine", "dicyclomine", "hyoscine", "mebeverine", "camylofin"],
    symptomIds: ["abdominal-cramps", "stomach-pain", "menstrual-cramps"],
    indications: ["Abdominal cramps", "Spasm-related pain"],
    warnings: ["Severe, one-sided, or persistent abdominal pain needs medical evaluation."]
  },
  {
    patterns: ["tamsulosin", "silodosin", "finasteride", "dutasteride"],
    symptomIds: ["urinary-symptoms", "prostate-symptoms"],
    indications: ["Urinary or prostate symptoms"],
    warnings: ["Urinary retention, fever with urinary symptoms, or blood in urine needs urgent care."]
  },
  {
    patterns: ["potassium citrate", "disodium hydrogen citrate", "sodium citrate"],
    symptomIds: ["burning-urination", "uti", "urinary-symptoms"],
    indications: ["Burning urination or urinary alkalinization"],
    warnings: ["Fever, back pain, pregnancy, or blood in urine needs medical review."],
    otcEligible: true
  },
  {
    patterns: ["iron", "ferrous", "folic acid", "methylcobalamin", "cyanocobalamin", "hydroxocobalamin", "vitamin b12"],
    symptomIds: ["anemia", "fatigue", "vitamin-deficiency"],
    indications: ["Anemia or vitamin deficiency support"],
    warnings: ["Persistent fatigue, breathlessness, or suspected anemia needs testing and diagnosis."],
    otcEligible: true
  },
  {
    patterns: ["calcium", "vitamin d3", "cholecalciferol", "calcitriol"],
    symptomIds: ["vitamin-deficiency", "bone-health", "body-pain"],
    indications: ["Bone health", "Vitamin D or calcium support"],
    warnings: ["Avoid high-dose supplements without testing or clinical advice."],
    otcEligible: true
  },
  {
    patterns: ["carboxymethylcellulose", "hyaluronate"],
    symptomIds: ["eye-redness", "eye-allergy"],
    indications: ["Lubrication for itchy, watery, or irritated eyes"],
    warnings: ["Remove contact lenses before use unless the product label says otherwise.", "Eye pain, vision changes, light sensitivity, injury, or contact-lens redness needs prompt eye care."],
    otcEligible: true
  },
  {
    patterns: ["olopatadine", "ketotifen", "bepotastine", "epinastine"],
    symptomIds: ["eye-allergy"],
    indications: ["Allergic eye symptoms"],
    warnings: ["Use anti-allergy eye drops only after a clinician or pharmacist confirms the cause and product suitability."]
  }
];

export function rulesForComposition(composition: string): IngredientRule[] {
  const normalized = composition.toLowerCase();
  return ingredientRules.filter((rule) => rule.patterns.some((pattern) => normalized.includes(pattern)));
}
