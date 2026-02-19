# Database Preparation

This folder prepares LINKDKU for migration from JSON file storage to SQLite/PostgreSQL.

## Current state

- App still reads/writes JSON in `data/` through `src/storage.js`.
- SQL schema is ready in `db/schema.sql`.

## Next migration steps

1. Add a DB adapter in `src/storage-db.js` implementing the same storage API as `src/storage.js`.
2. Add a one-time migration script to load `data/*.json` into DB tables.
3. Switch server import from `src/storage.js` to DB adapter.
4. Keep JSON as fallback only for local dev.
