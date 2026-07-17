# ABDM Registry Closure Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export a resumable, deduplicated ABDM brand catalog by iterating supplier-neighborhood anchors until no new supplier identifiers are discovered.

**Architecture:** A pure anchor fetcher validates stable paginated snapshots. A closure runner persists versioned pages/checkpoints, expands the anchor queue, and writes an evidence-based manifest. A CLI handles paths and hidden token input.

**Tech Stack:** TypeScript, Node.js fetch/fs APIs, Vitest, tsx, the existing `@otcora/data` workspace.

## Global Constraints

- Keep all new raw data under `data/raw/abdm-registry/v2`.
- Never persist or log the bearer token.
- Preserve all legacy files unchanged.
- Use page size 500 and concurrency 4 for the live crawl.
- Never mark an unstable or failed anchor complete.

---

### Task 1: Stable Anchor Snapshots

**Files:**
- Create: `packages/data/src/abdm-anchor-export.ts`
- Create: `packages/data/src/abdm-anchor-export.test.ts`

**Interfaces:**
- Consumes: `fetchJsonWithRetry`, `AbdmPage`, and `ExportCheckpoint` from `packages/data/src/abdm-export.ts`.
- Produces: `fetchAnchorSnapshot(anchorId, options)` returning pages, discovered supplier IDs, and a complete checkpoint only for a stable snapshot.

- [ ] **Step 1: Write failing tests**

```ts
it("discovers neighboring suppliers in a stable anchor snapshot", async () => {
  const result = await fetchAnchorSnapshot("supplier-1", fakeTwoPageOptions);
  expect(result.discoveredSupplierIds).toEqual(["supplier-1", "supplier-2"]);
  expect(result.checkpoint.complete).toBe(true);
});

it("rejects a changing drugsCount", async () => {
  await expect(fetchAnchorSnapshot("supplier-1", changingCountOptions))
    .rejects.toThrow("changed drugsCount");
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- packages/data/src/abdm-anchor-export.test.ts`

Expected: FAIL because `abdm-anchor-export` does not exist.

- [ ] **Step 3: Implement the snapshot validator**

```ts
export async function fetchAnchorSnapshot(anchorId: string, options: AnchorOptions) {
  const first = await getPage(0);
  const advertisedRecords = requireCount(first);
  const pages = [first];
  for (let page = 1; page < Math.ceil(advertisedRecords / options.pageSize); page += 1) {
    const next = await getPage(page);
    if (requireCount(next) !== advertisedRecords) {
      throw new Error(`Anchor ${anchorId} changed drugsCount between pages.`);
    }
    pages.push(next);
  }
  return validateSnapshot(anchorId, advertisedRecords, pages);
}
```

- [ ] **Step 4: Verify green**

Run: `npm test -- packages/data/src/abdm-anchor-export.test.ts`

Expected: all anchor tests pass.

### Task 2: Iterative Closure Runner

**Files:**
- Create: `packages/data/src/abdm-closure-runner.ts`
- Create: `packages/data/src/abdm-closure-runner.test.ts`
- Modify: `packages/data/src/index.ts`

**Interfaces:**
- Consumes: `fetchAnchorSnapshot`, seed supplier IDs, seed brand rows, output directory, concurrency, and injected fetch/retry options.
- Produces: `runCatalogClosure(options): Promise<ClosureManifest>` plus `brands.jsonl`, ID inventories, pages, checkpoints, and `manifest.json`.

- [ ] **Step 1: Write failing closure tests**

```ts
it("runs another round for newly discovered supplier IDs", async () => {
  const manifest = await runCatalogClosure({ supplierIds: ["supplier-1"], ...options });
  expect(manifest.rounds).toBe(2);
  expect(manifest.totalAnchors).toBe(2);
  expect(manifest.closureReached).toBe(true);
});

it("does not complete when an anchor fails", async () => {
  const manifest = await runCatalogClosure(failingOptions);
  expect(manifest.complete).toBe(false);
  expect(manifest.failedAnchorIds).toEqual(["supplier-1"]);
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- packages/data/src/abdm-closure-runner.test.ts`

Expected: FAIL because `abdm-closure-runner` does not exist.

- [ ] **Step 3: Implement versioned queue/checkpoint processing**

```ts
while (pending.size > 0) {
  rounds += 1;
  const currentRound = [...pending];
  pending.clear();
  await runPool(currentRound, async (anchorId) => {
    const snapshot = await fetchAnchorSnapshot(anchorId, anchorOptions);
    completed.add(anchorId);
    for (const discoveredId of snapshot.discoveredSupplierIds) {
      if (!completed.has(discoveredId)) pending.add(discoveredId);
    }
  });
}
```

- [ ] **Step 4: Write the final catalog and manifest**

Use `mergeBrandRows` for deterministic deduplication. Set `complete` only when closure is reached, failed anchors are empty, and `A/C` coverage meets known counts.

- [ ] **Step 5: Verify green**

Run: `npm test -- packages/data/src/abdm-closure-runner.test.ts packages/data/src/abdm-anchor-export.test.ts`

Expected: all closure and anchor tests pass.

### Task 3: Secure V2 CLI and Live Verification

**Files:**
- Create: `packages/data/src/cli/export-abdm-v2.ts`
- Modify: `packages/data/package.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: `--supplier-ids`, `--seed-brands`, `--legacy-raw`, `--output`, `--page-size`, and `--concurrency`.
- Produces: a live v2 export using `runCatalogClosure`.

- [ ] **Step 1: Add CLI wiring**

```ts
const accessToken = process.env.ABDM_DR_ACCESS_TOKEN
  ?? await readSecretLine(process.stdin, process.stdout, "ABDM access token: ");
const manifest = await runCatalogClosure({
  accessToken,
  pageSize: 500,
  concurrency: 4,
  outputDir,
  supplierIds,
  seedRows
});
```

- [ ] **Step 2: Run all data tests and type-check**

Run: `npm test -- packages/data/src/abdm-*.test.ts packages/data/src/secure-input.test.ts`

Expected: all tests pass.

Run: `npm run typecheck -w @otcora/data`

Expected: exit code 0.

- [ ] **Step 3: Launch the resumable v2 crawl**

Run: `npm run data:export-abdm-v2 -- --supplier-ids=/private/tmp/otcora-abdm-full-export/supplier-ids-current.json --seed-brands=/private/tmp/otcora-abdm-full-export/seed-brands-current.jsonl --legacy-raw=data/raw/abdm-registry/raw/suppliers --output=data/raw/abdm-registry/v2 --page-size=500 --concurrency=4`

Expected: progress logs, no token output, and atomic checkpoints under `data/raw/abdm-registry/v2`.

- [ ] **Step 4: Verify the manifest**

Run: `npm run data:verify-abdm-v2`

Expected: zero failed anchors, zero pending anchors, stable snapshots, and prefix coverage `A >= 13406`, `C >= 12463`.

### Task 4: Generic and Substance Enrichment

**Files:**
- Create: `packages/data/src/abdm-entity-runner.ts`
- Create: `packages/data/src/abdm-entity-runner.test.ts`
- Create: `packages/data/src/cli/enrich-abdm-v2.ts`
- Modify: `packages/data/package.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: final `generic-ids.json`, `substance-ids.json`, access token, and v2 output directory.
- Produces: resumable raw entity details and an enrichment manifest.

- [ ] **Step 1: Test retry, resume, and failed-entity visibility**

```ts
it("skips an entity with a complete checkpoint", async () => {
  const manifest = await runEntityExport(resumeOptions);
  expect(fetchCalls).toBe(0);
  expect(manifest.complete).toBe(true);
});
```

- [ ] **Step 2: Implement generic and substance detail workers**

Fetch `/generics/{id}` and `/substances/{id}` with the shared retry helper, atomic response files, and one checkpoint per entity.

- [ ] **Step 3: Verify enrichment**

Run: `npm test -- packages/data/src/abdm-entity-runner.test.ts`

Expected: all entity tests pass.

Run: `npm run data:enrich-abdm-v2`

Expected: enrichment manifest reports every discovered generic and substance complete, or lists exact failed IDs without claiming completion.
