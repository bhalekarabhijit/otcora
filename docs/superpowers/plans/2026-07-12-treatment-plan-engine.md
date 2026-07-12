# Treatment Plan Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an evidence-constrained symptom-cluster treatment-plan engine with OTC, pharmacist-check, and prescription-context lanes.

**Architecture:** Exact combination policies gate fixed-dose products before ranking. The recommendation engine groups eligible products into three lanes, and a separate treatment-plan builder converts groups into choose-one purpose steps without dosing or diagnosis.

**Tech Stack:** TypeScript, Vitest, Next.js 15, React, Tailwind CSS.

## Global Constraints

- Adults aged 18 to 64 only; pregnancy and breastfeeding remain excluded.
- No AI-generated medical recommendations or dosing.
- Every combination ingredient must be justified by the selected symptom cluster.
- Raw CSV data and source attribution remain private and untracked.
- Prescription products are context only.

---

### Task 1: Combination Policy and Core Types

**Files:**
- Create: `packages/core/src/combination-policies.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/recommendations.test.ts`

**Interfaces:**
- Produces: `matchCombinationPolicy(composition, symptomIds, lane)` and treatment-plan response types.
- Consumes: normalized composition ingredient names and selected symptom IDs.

- [ ] Add failing tests proving unsupported combinations are excluded, caffeine-paracetamol is headache-only, and cold FDCs require all symptom clusters.
- [ ] Run `npm test -- packages/core/src/recommendations.test.ts` and confirm the new assertions fail.
- [ ] Implement exact normalized ingredient-set policies and exported response types.
- [ ] Run the focused test and confirm the policy tests pass.

### Task 2: Three Recommendation Lanes

**Files:**
- Modify: `packages/core/src/medicine-catalog.ts`
- Modify: `packages/core/src/ingredient-rules.ts`
- Modify: `packages/core/src/recommendations.ts`
- Test: `packages/core/src/recommendations.test.ts`

**Interfaces:**
- Produces: `otcGroups`, `pharmacistGroups`, and `prescriptionGroups` with vetted combinations only.
- Consumes: `matchCombinationPolicy` and existing catalog medicines.

- [ ] Add failing tests for fever-only ibuprofen prescription context, dengue caution, pharmacist-check cold combinations, and no antibiotic/antiviral leakage.
- [ ] Run the focused test and confirm failures represent missing behavior.
- [ ] Move oral phenylephrine FDCs from OTC to unknown status, allow them only through pharmacist policies, and add fever-scoped ibuprofen prescription context.
- [ ] Replace the broad combination relevance filter with exact combination-policy gating.
- [ ] Run focused tests and confirm all pass.

### Task 3: Treatment Plan Builder

**Files:**
- Create: `packages/core/src/treatment-plans.ts`
- Modify: `packages/core/src/recommendations.ts`
- Test: `packages/core/src/recommendations.test.ts`

**Interfaces:**
- Produces: `buildTreatmentPlans(symptomIds, lanes)` returning purpose steps and follow-up symptom suggestions.
- Consumes: grouped recommendation lanes.

- [ ] Add failing tests for fever-only follow-ups, fever plus nasal choose-one steps, fever plus ORS, wet-cough separation, and no duplicate paracetamol.
- [ ] Run focused tests and confirm they fail.
- [ ] Implement purpose rules and plan-step de-duplication.
- [ ] Run focused tests and confirm they pass.

### Task 4: Public API and Web Results

**Files:**
- Modify: `apps/web/lib/public-medicine.ts`
- Modify: `apps/web/lib/public-medicine.test.ts`
- Modify: `apps/web/components/symptom-console.tsx`
- Modify: `apps/web/app/api/recommendations/route.test.ts`

**Interfaces:**
- Produces: sanitized public treatment plans, pharmacist groups, and clickable follow-up symptom chips.
- Consumes: expanded `RecommendationResponse`.

- [ ] Add failing public-response and route tests for new fields and prescription product redaction.
- [ ] Run the relevant web tests and confirm they fail.
- [ ] Sanitize new lanes and render plan steps with choose-one/replaces-overlap copy.
- [ ] Connect follow-up chips to the existing selected-symptom state and clear stale results.
- [ ] Run the relevant web tests and confirm they pass.

### Task 5: Coverage and Release Verification

**Files:**
- Modify: `packages/core/src/recommendations.test.ts`
- Modify: `data/generated/seed_medicines.json` only if catalog classification changes require regeneration.

**Interfaces:**
- Consumes: the completed recommendation API and web UI.
- Produces: verified release commit.

- [ ] Run a generated matrix over all searchable symptoms and inspect empty, care-only, OTC, pharmacist, and prescription outcomes.
- [ ] Run `npm test`, `npm run typecheck`, and `npm run build`.
- [ ] Start the dev server temporarily, smoke-test fever-only and multi-symptom API responses, then stop it.
- [ ] Run source-name, secret, raw-data tracking, and `git diff --check` audits.
- [ ] Commit and push only after local HEAD is clean and all verification passes.
