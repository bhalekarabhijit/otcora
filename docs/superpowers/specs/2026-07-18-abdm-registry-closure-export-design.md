# ABDM Registry Closure Export Design

## Context

The production ABDM supplier route does not behave like the sandbox PDF example. A request to `/suppliers/{supplierIdentifier}` returns a neighborhood containing the requested supplier followed by nearby suppliers. The response-level `drugsCount` describes that whole neighborhood. A page is valid only when every page in the snapshot reports the same count and the combined row count equals it.

The first exporter used `limit=1000`, mislabeled neighborhoods as individual supplier catalogs, and mixed page-size assumptions into unversioned checkpoints. Its raw responses remain useful as a partial union, but its completion flags are not authoritative.

## Goal

Build a resumable v2 catalog exporter that reaches supplier-identifier closure, deduplicates brands, preserves source payloads, and never claims completeness when a snapshot is unstable or an anchor remains unprocessed.

## Architecture

1. Start with supplier identifiers found in the verified alphabet inventory and legacy response union.
2. Fetch each identifier as an anchor with `limit=500`, saving pages under `data/raw/abdm-registry/v2/raw/anchors/{id}`.
3. Require a stable `drugsCount` across pages and an exact row-count match before completing an anchor checkpoint.
4. Add every newly observed `supplierIdentifier` to the queue.
5. Continue in rounds until a full round discovers no new identifiers and every queued anchor has a complete checkpoint.
6. Merge the verified seed, legacy union, and v2 pages by `brandIdentifier`, preferring richer rows.

## Storage

- Legacy data remains under `data/raw/abdm-registry` unchanged.
- V2 data lives under `data/raw/abdm-registry/v2`.
- Credentials are accepted through hidden stdin or `ABDM_DR_ACCESS_TOKEN` and are never written to disk or logs.
- Every response page and checkpoint is written atomically through a `.partial` file and rename.

## Completion Rules

The final manifest is complete only when:

- every queued anchor has a complete checkpoint;
- no anchor snapshot changed `drugsCount` between pages;
- the last closure round discovered zero new supplier identifiers;
- all stored brand records have a non-empty `brandIdentifier`;
- deduplication produces at least the known alphabet coverage for `A` (13,406) and `C` (12,463).

If any rule fails, the union remains usable as partial source data but is labeled incomplete.

## Follow-Up Enrichment

After brand closure, fetch every unique generic and substance identifier through the documented detail endpoints. These entity exports use independent checkpoints so they can resume without recrawling brands.

## Testing

- Retryable `ABDM-1001` responses never become empty success.
- Supplier leakage inside an anchor window is accepted and contributes discovered identifiers.
- Changing `drugsCount` across pages fails the anchor.
- A second closure round is created when the first round discovers a new supplier.
- Existing complete v2 checkpoints are not fetched again.
- The manifest cannot be complete with failed anchors or insufficient `A/C` coverage.
