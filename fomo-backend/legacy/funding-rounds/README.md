# Retired funding-round runtime

This directory contains the former `/rounds` controller, Dropstab/Intel sync,
service, DTOs, and legacy token-classification helper. Production routes and
sync are now served by `src/fomo-v2/domains/funding`.

The old `fundingrounds` collection is empty, so no data migration is required.
All former consumers (fund analytics, investor sync, project reads and crypto
linking) now use FOMO v2 read models or active project/investor relations. This
directory is not imported by the production build.
