# Treatment Plan Engine Design

## Goal

Replace flat symptom-to-product matching with deterministic, adult-only treatment plans that explain which composition addresses each selected symptom while preventing irrelevant or overlapping ingredients.

## Safety Boundary

- Otcora remains educational self-care support for adults aged 18 to 64 who are not pregnant or breastfeeding.
- The engine does not diagnose the cause of fever or provide dosing.
- OTC, pharmacist-check, and prescription-context results remain visually and structurally separate.
- A prescription composition is context only, never a self-start recommendation.
- Fever with urgent symptoms or a care-only symptom continues to block medicine lists.
- Ibuprofen is prescription context in India and carries dengue, dehydration, renal, gastrointestinal, anticoagulant, asthma, and pregnancy cautions.

## Architecture

`combination-policies.ts` owns exact ingredient-set rules for fixed-dose combinations. A policy specifies its result lane, the symptom clusters it requires, its purpose, and whether it replaces overlapping single-ingredient options. No combination is admitted through ingredient substring matching alone.

`treatment-plans.ts` converts ranked composition groups into user-facing plan steps. Each step contains alternatives for one purpose, such as fever discomfort or nasal congestion. Alternatives are explicitly choose-one; fixed-dose combinations explicitly replace overlapping steps rather than being added to them.

The existing recommendation engine remains responsible for eligibility, allergy filtering, ranking, grouping, and care blocking. It will produce three lanes and then pass those groups to the treatment-plan builder.

## Fever Behavior

- Fever alone: paracetamol OTC; ibuprofen in prescription context; follow-up prompts for associated symptoms.
- Fever plus nasal symptoms: paracetamol and a choose-one nasal decongestant step; an eligible oral cold combination appears only in pharmacist or prescription context.
- Fever plus wet cough/chest congestion: fever relief and a separate expectorant/mucolytic step.
- Fever plus dry cough: fever relief plus prescription cough context.
- Fever plus diarrhea, vomiting, or dehydration: fever relief plus ORS.
- Fever plus pain symptoms: paracetamol OTC with ibuprofen as prescription context.
- Antibiotics, antivirals, and unrelated NSAIDs never appear solely because fever was selected.

## Combination Eligibility

- Caffeine + paracetamol: headache or migraine only.
- Paracetamol + caffeine + phenylephrine: pharmacist-check only and requires both fever/pain and nasal congestion clusters.
- Paracetamol + phenylephrine + chlorpheniramine, with optional caffeine: prescription context and requires fever/pain, nasal congestion, and allergy/runny-nose clusters.
- Antacid combinations: remain eligible for the acidity, heartburn, gas, or indigestion cluster.
- Unlisted combinations are excluded from public recommendation lanes.

## User Experience

The result begins with a “Matched treatment plan” section containing purpose-based steps. Fever-only results show compact follow-up symptom chips. Detailed composition sections remain below for brand examples and prescription context. Pharmacist-check copy states that status or suitability must be confirmed before purchase.

## Verification

Tests must cover fever alone, fever with nasal congestion, fever with wet and dry cough, fever with dehydration, dengue-risk cautions, prescription separation, duplicate-paracetamol prevention, unsupported combination exclusion, all-symptom outcome coverage, API sanitization, and browser-level interaction.
