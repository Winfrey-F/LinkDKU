const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const usersPath = path.join(dataDir, 'users.json');
const surveyPath = path.join(dataDir, 'survey_responses.json');
const matchPath = path.join(dataDir, 'matches.json');
const statePath = path.join(dataDir, 'job_state.json');
const outboxPath = path.join(dataDir, 'email_outbox.json');

function ensureDataFile(filePath, defaultValue) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function readJson(filePath, defaultValue) {
  ensureDataFile(filePath, defaultValue);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return defaultValue;
  }
}

function writeJson(filePath, value) {
  ensureDataFile(filePath, value);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function upsertUser(user) {
  const users = readJson(usersPath, []);
  const idx = users.findIndex((u) => u.netid === user.netid);
  const merged = {
    ...users[idx],
    ...user,
    updatedAt: new Date().toISOString()
  };

  if (idx >= 0) users[idx] = merged;
  else users.push({ ...merged, createdAt: new Date().toISOString() });

  writeJson(usersPath, users);
  return merged;
}

function getUserByNetid(netid) {
  const users = readJson(usersPath, []);
  return users.find((u) => u.netid === netid) || null;
}

function saveSurvey(response) {
  const rows = readJson(surveyPath, []);
  const idx = rows.findIndex((r) => r.netid === response.netid);
  const record = {
    ...response,
    updatedAt: new Date().toISOString()
  };

  if (idx >= 0) rows[idx] = record;
  else rows.push({ ...record, createdAt: new Date().toISOString() });

  writeJson(surveyPath, rows);
  return record;
}

function getAllSurvey() {
  return readJson(surveyPath, []);
}

function getAllUsers() {
  return readJson(usersPath, []);
}

function saveMatches(payload) {
  const allMatches = readJson(matchPath, []);
  allMatches.push(payload);
  writeJson(matchPath, allMatches);
  return payload;
}

function getAllMatches() {
  return readJson(matchPath, []);
}

function getLatestMatches() {
  const allMatches = readJson(matchPath, []);
  return allMatches[allMatches.length - 1] || null;
}

function getState() {
  return readJson(statePath, {});
}

function setState(nextState) {
  writeJson(statePath, nextState);
}

function appendOutbox(entry) {
  const outbox = readJson(outboxPath, []);
  outbox.push(entry);
  writeJson(outboxPath, outbox);
}

function getEmailOutbox() {
  return readJson(outboxPath, []);
}

module.exports = {
  upsertUser,
  getUserByNetid,
  saveSurvey,
  getAllSurvey,
  getAllUsers,
  saveMatches,
  getAllMatches,
  getLatestMatches,
  getState,
  setState,
  appendOutbox,
  getEmailOutbox
};
