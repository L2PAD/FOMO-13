# Archived backend code

This directory contains implementations removed from the production NestJS
composition root. It is intentionally outside `src` and is not compiled by the
main TypeScript configuration.

Rules:

- Production code must never import from `legacy`.
- Archived runners are not supported operational tools.
- A runnable migration or audit belongs under `tools`, with its own composition
  root and safety guard.
- Restoring an archived unit requires a new review, current contracts, and a
  production data-usage check.

See `manifest.json` for the archive inventory and replacement status.
