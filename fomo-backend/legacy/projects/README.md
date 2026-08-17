# Legacy project read paths

This directory contains project read models and operational entrypoints retired
after the `fomo_v2` cutover. It is outside the main TypeScript build and must
not be imported by `src`.

Archived here:

- the original monolithic `ProjectsService` snapshot, including retired sync,
  market-category, market-detail enrichment and compatibility helpers;
- ICO comparison API, snapshots, backfill, history and audit code;
- the legacy exchange-overview API and its cache/quota models;
- project-intel read/admin controllers and historical import services;
- unused project-category and pending-match persistence models;
- the retired `ProjectIntel` and `ProjectUnlocks` persistence schemas, whose
  empty collections were replaced by the native `fomo_v2` domain models;
- the former legacy-project market flag command service.

The active `src/projects` boundary intentionally retains only shared `Project`
contracts plus community/user project list, detail and command workflows. The
generic community list rejects `projectType=market`, and community detail reads
exclude legacy market documents. Native market, ICO, unlock and fundraising
reads live under `src/fomo-v2`.

The dedicated `intel-sync` worker preserves its existing job names through
`FomoV2ProjectSyncAdapter`; it no longer imports these legacy services. The
shared internal-sync guard now lives under `src/common/guards` because funds,
investors, crypto activities and fomo_v2 compatibility endpoints use it.
`ProjectSourceMap` also remains in `src` because active project and investor
resolution still uses it.
