const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const usersPath = path.join(dataDir, 'users.json');
const surveyPath = path.join(dataDir, 'survey_responses.json');

const MAJORS = ['Natural Sciences', 'Social Sciences', 'Arts and Humanities'];
const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
const LANGUAGES = ['English', 'Chinese', 'Spanish', 'German', 'Japanese', 'Korean'];
const LOOKING_FOR = ['Activity partner', 'Close friendship', 'Academic partner', 'Networking / career', 'Casual socializing'];
const INTERESTS = ['Performing arts', 'Research / academic discussion', 'Sports / fitness', 'Volunteering', 'Entrepreneurship', 'Social events', 'Gaming / online communities'];
const QUALITIES = ['Reliability', 'Humor', 'Emotional support', 'Intellectual discussion', 'Shared hobbies', 'Adventurousness'];


function pickN(pool, n, seed) {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 31 + 17) >>> 0;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const start = seed % Math.max(1, arr.length - n);
  return arr.slice(start, start + n);
}

const LIKERT_PROFILES = [
  [1, 1, 2, 1, 2, 1, 2, 1, 2, 1], 
  [5, 5, 4, 5, 4, 5, 4, 5, 4, 5], 
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], 
  [2, 4, 4, 2, 5, 3, 4, 2, 3, 4],
  [4, 2, 3, 4, 2, 4, 2, 4, 5, 2],
  [1, 5, 5, 1, 5, 1, 5, 1, 5, 4],
  [5, 1, 2, 5, 1, 5, 1, 5, 2, 3],
  [2, 2, 5, 4, 3, 2, 5, 3, 1, 5],
  [4, 4, 1, 2, 5, 4, 1, 5, 4, 1],
  [3, 5, 2, 4, 1, 4, 3, 2, 5, 4],
  [5, 3, 4, 1, 4, 5, 2, 3, 1, 2],
  [1, 4, 3, 5, 2, 3, 5, 4, 2, 5],
  [4, 1, 5, 3, 5, 1, 4, 1, 3, 3],
  [2, 5, 1, 4, 4, 5, 2, 5, 1, 4],
  [3, 1, 4, 2, 3, 5, 1, 4, 5, 2],
];

const OPENNESS_KEYS = ['dkuOpenness', 'interactionStyle', 'opennessToNewActivities'];
const STYLE_KEYS = ['planningStyle', 'socialEnergy', 'communicationStyle', 'conversationPreference', 'decisionMaking', 'conflictHandling', 'emotionalSharing'];
const ALL_LIKERT_KEYS = [...OPENNESS_KEYS, ...STYLE_KEYS];

function makeDiverseUser(i) {
  const netid = `du${String(i + 1).padStart(3, '0')}`;
  const seed = i * 7919 + 31;

  const major = MAJORS[(i + Math.floor(i / 7)) % MAJORS.length];
  const year = YEARS[(i * 11 + Math.floor(i / 5)) % YEARS.length];

  const nLang = 1 + (i % 4);
  const nLooking = 1 + (i % 3);
  const nInterests = 1 + (i % 3);
  const languages = pickN(LANGUAGES, nLang, seed);
  const lookingFor = pickN(LOOKING_FOR, nLooking, seed + 1);
  const activityInterests = pickN(INTERESTS, nInterests, seed + 2);
  const qualities = pickN(QUALITIES, 2, seed + 3);

  const profile = LIKERT_PROFILES[i % LIKERT_PROFILES.length];
  const likertPart = {};
  ALL_LIKERT_KEYS.forEach((k, j) => { likertPart[k] = profile[j]; });

  const now = new Date().toISOString();
  return {
    user: { netid, email: `${netid}@duke.edu`, createdAt: now, updatedAt: now },
    survey: {
      netid,
      major,
      year,
      languages,
      lookingFor,
      activityInterests,
      ...likertPart,
      qualities,
      createdAt: now,
      updatedAt: now
    }
  };
}

function run() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  //edit this number to change the number of users
  const records = Array.from({ length: 200 }, (_, i) => makeDiverseUser(i));
  const users = records.map((r) => r.user);
  const surveys = records.map((r) => r.survey);

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  fs.writeFileSync(surveyPath, JSON.stringify(surveys, null, 2));

  console.log('Generated diverse users -> data/users.json');
  console.log('Generated survey responses -> data/survey_responses.json');
}

run();
