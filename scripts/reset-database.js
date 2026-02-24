#!/usr/bin/env node
/**
 * Reset the database to a clean state (empty users, surveys, matches, job state, outbox).
 * Use before running tests or when you want a fresh data set.
 *
 * Usage: node scripts/reset-database.js
 *    or: npm run db:reset
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const files = {
  'users.json': [],
  'survey_responses.json': [],
  'matches.json': [],
  'job_state.json': {},
  'email_outbox.json': []
};

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

for (const [name, defaultValue] of Object.entries(files)) {
  const filePath = path.join(dataDir, name);
  fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  console.log('Reset:', name);
}

// If using SQLite, remove the DB file so it gets recreated empty
const sqlitePath = path.join(process.cwd(), 'data', 'linkdku.sqlite');
if (fs.existsSync(sqlitePath)) {
  fs.unlinkSync(sqlitePath);
  console.log('Removed: linkdku.sqlite (re-run schema to recreate)');
}

console.log('Database reset complete.');
