const WEIGHTS = {
  interests: 0.35,
  socialStyle: 0.35,
  openness: 0.15,
  background: 0.15
};

const MAJORS = ['Natural Sciences', 'Social Sciences', 'Arts and Humanities'];
const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
const LANGUAGES = ['English', 'Chinese', 'Spanish', 'German', 'Japanese', 'Korean'];
const LOOKING_FOR = ['Activity partner', 'Close friendship', 'Academic partner', 'Networking / career', 'Casual socializing'];
const INTERESTS = ['Performing arts', 'Research / academic discussion', 'Sports / fitness', 'Volunteering', 'Entrepreneurship', 'Social events', 'Gaming / online communities'];
const QUALITIES = ['Reliability', 'Humor', 'Emotional support', 'Intellectual discussion', 'Shared hobbies', 'Adventurousness'];
const STYLE_KEYS = ['planningStyle', 'socialEnergy', 'communicationStyle', 'conversationPreference', 'decisionMaking', 'conflictHandling', 'emotionalSharing'];

function oneHot(value, choices) {
  return choices.map((x) => (x === value ? 1 : 0));
}

function multiHot(values, choices) {
  const set = new Set(Array.isArray(values) ? values : []);
  return choices.map((x) => (set.has(x) ? 1 : 0));
}

function normalizeLikert(v) {
  const n = Number(v || 1);
  return Math.max(1, Math.min(5, n));
}

function normalize01(v) {
  return (normalizeLikert(v) - 1) / 4;
}

function cosine(a, b) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  if (!aa || !bb) return 0;
  return dot / (Math.sqrt(aa) * Math.sqrt(bb));
}

function encodeUser(u) {
  const socialStyle = STYLE_KEYS.map((k) => normalize01(u[k]));
  const openness = [normalize01(u.dkuOpenness), normalize01(u.interactionStyle), normalize01(u.opennessToNewActivities)];

  return {
    netid: u.netid,
    languageSet: new Set(u.languages || []),
    groups: {
      interests: [
        ...multiHot(u.activityInterests, INTERESTS),
        ...multiHot(u.lookingFor, LOOKING_FOR),
        ...multiHot(u.qualities, QUALITIES)
      ],
      socialStyle,
      openness,
      background: [
        ...oneHot(u.major, MAJORS),
        ...oneHot(u.year, YEARS),
        ...multiHot(u.languages, LANGUAGES)
      ]
    },
    original: u
  };
}

function similarity(a, b) {
  const gA = a.groups;
  const gB = b.groups;
  let score = 0;
  let weightSum = 0;

  Object.entries(WEIGHTS).forEach(([k, w]) => {
    score += w * cosine(gA[k], gB[k]);
    weightSum += w;
  });

  return weightSum ? score / weightSum : 0;
}

function hasSharedLanguage(a, b) {
  for (const lang of a.languageSet) {
    if (b.languageSet.has(lang)) return true;
  }
  return false;
}

function buildPreferences(users, topK = 10) {
  const prefs = new Map();
  const scores = new Map();

  users.forEach((u) => {
    const sharedLanguageCandidates = [];
    const fallbackCandidates = [];
    users.forEach((v) => {
      if (u.netid === v.netid) return;
      const s = similarity(u, v);
      scores.set(`${u.netid}:${v.netid}`, s);

      if (hasSharedLanguage(u, v)) {
        sharedLanguageCandidates.push({ netid: v.netid, score: s });
      } else {
        fallbackCandidates.push({ netid: v.netid, score: s });
      }
    });

    // Prefer shared-language partners, but allow fallback so matching still works in small pools.
    const pool = sharedLanguageCandidates.length ? sharedLanguageCandidates : fallbackCandidates;
    pool.sort((a, b) => b.score - a.score);
    prefs.set(u.netid, pool.slice(0, topK).map((c) => c.netid));
  });

  return { prefs, scores };
}

function galeShapleyPairing(users, prefs, scores) {
  const free = [...users.map((u) => u.netid)];
  const proposals = new Map();
  const heldBy = new Map();

  free.forEach((id) => proposals.set(id, 0));

  while (free.length) {
    const proposer = free.shift();
    const list = prefs.get(proposer) || [];
    const pointer = proposals.get(proposer) || 0;

    if (pointer >= list.length) continue;

    const target = list[pointer];
    proposals.set(proposer, pointer + 1);

    if (!heldBy.has(target)) {
      heldBy.set(target, proposer);
      continue;
    }

    const current = heldBy.get(target);
    const currentScore = scores.get(`${target}:${current}`) || 0;
    const challengerScore = scores.get(`${target}:${proposer}`) || 0;

    if (challengerScore > currentScore) {
      heldBy.set(target, proposer);
      free.push(current);
    } else {
      free.push(proposer);
    }
  }

  const seen = new Set();
  const pairs = [];

  for (const [target, proposer] of heldBy.entries()) {
    const a = [target, proposer].sort().join('::');
    if (seen.has(a)) continue;
    seen.add(a);

    const score = ((scores.get(`${target}:${proposer}`) || 0) + (scores.get(`${proposer}:${target}`) || 0)) / 2;
    pairs.push({ a: target, b: proposer, score });
  }

  pairs.sort((x, y) => y.score - x.score);
  return pairs;
}

function createExplanation(ua, ub) {
  const reasons = [];
  const sharedInterests = (ua.activityInterests || []).filter((x) => (ub.activityInterests || []).includes(x));
  if (sharedInterests.length) reasons.push(`Shared interests: ${sharedInterests.slice(0, 2).join(', ')}`);

  const styleClose = STYLE_KEYS.filter((k) => Math.abs(normalizeLikert(ua[k]) - normalizeLikert(ub[k])) <= 1);
  if (styleClose.length >= 3) reasons.push('Compatible social style across multiple dimensions.');

  if (normalizeLikert(ua.dkuOpenness) >= 4 && normalizeLikert(ub.dkuOpenness) >= 4) {
    reasons.push('Both are highly open to cultural diversity in the DKU community.');
  }

  return reasons.length ? reasons : ['Overall profile compatibility is strong.'];
}

function runMatching(rawUsers) {
  const users = rawUsers.map(encodeUser);
  const { prefs, scores } = buildPreferences(users);
  const pairs = galeShapleyPairing(users, prefs, scores);

  const byId = new Map(rawUsers.map((u) => [u.netid, u]));

  return pairs.map((p) => {
    const ua = byId.get(p.a);
    const ub = byId.get(p.b);
    return {
      netidA: p.a,
      netidB: p.b,
      score: Number(p.score.toFixed(4)),
      explanation: createExplanation(ua, ub)
    };
  });
}

module.exports = {
  runMatching
};
