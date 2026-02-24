/**
 * LinkDKU 匹配算法评估入口
 * 不修改原有代码，仅读取 data/ 数据（不足时自动生成 fake 数据），运行匹配并输出指标与 JSON。
 */

const path = require('path');
const fs = require('fs');
const storage = require('../src/storage');
const { runMatching } = require('../src/matching');
const {
  similarityDistribution,
  matchQuality,
  diversityMetrics,
  coverageMetrics,
  algorithmVsRandom,
  DEFAULT_WEIGHTS
} = require('./metrics');
const { runMatchingWithWeights } = require('./experiment');
const { generateReport } = require('./report');

const OUT_DIR = path.join(__dirname, 'output');

function ensureOutputDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function ensureData() {
  let surveyRows = storage.getAllSurvey();
  if (surveyRows.length < 2) {
    console.log('Survey data insufficient (< 2), seeding fake accounts...');
    require('../scripts/seed-fake-accounts.js');
    surveyRows = storage.getAllSurvey();
  }
  if (surveyRows.length < 2) {
    throw new Error('Still insufficient survey data after seed. Need at least 2 responses.');
  }
  return surveyRows;
}

function runEvaluation(surveyRows) {
  const algorithmMatches = runMatching(surveyRows);

  const simDist = similarityDistribution(surveyRows);
  const quality = matchQuality(algorithmMatches);
  const diversity = diversityMetrics(surveyRows, algorithmMatches);
  const coverage = coverageMetrics(surveyRows, algorithmMatches);
  const vsRandom = algorithmVsRandom(algorithmMatches, surveyRows);

  return {
    similarityDistribution: simDist,
    matchQuality: quality,
    diversity: diversity,
    coverage: coverage,
    algorithmVsRandom: vsRandom,
    algorithmMatches,
    surveyRowCount: surveyRows.length
  };
}

function runWeightExperiments(surveyRows) {
  const configs = [
    { name: 'default', weights: DEFAULT_WEIGHTS },
    { name: 'interests_heavy', weights: { interests: 0.5, socialStyle: 0.25, openness: 0.15, background: 0.1 } },
    { name: 'social_heavy', weights: { interests: 0.25, socialStyle: 0.5, openness: 0.15, background: 0.1 } },
    { name: 'balanced', weights: { interests: 0.25, socialStyle: 0.25, openness: 0.25, background: 0.25 } }
  ];

  return configs.map(({ name, weights }) => {
    const matches = runMatchingWithWeights(surveyRows, weights);
    const quality = matchQuality(matches);
    const diversity = diversityMetrics(surveyRows, matches);
    const coverage = coverageMetrics(surveyRows, matches);
    return {
      name,
      weights,
      averageScore: quality.averageScore,
      matchCount: matches.length,
      diversity,
      coverage: coverage.coveragePercent
    };
  });
}

function exportSimilarityDistribution(result) {
  const sim = result.similarityDistribution;
  const data = {
    stats: sim.stats,
    histogram: sim.histogram,
    pairCount: sim.pairCount
  };
  fs.writeFileSync(
    path.join(OUT_DIR, 'similarity_distribution.json'),
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

function exportNetworkGraph(surveyRows, algorithmMatches) {
  const nodes = surveyRows.map((u) => ({
    id: u.netid,
    major: u.major,
    year: u.year,
    languages: u.languages || []
  }));
  const edges = algorithmMatches.map((m) => ({
    source: m.netidA,
    target: m.netidB,
    weight: m.score
  }));
  fs.writeFileSync(
    path.join(OUT_DIR, 'network_graph.json'),
    JSON.stringify({ nodes, edges }, null, 2),
    'utf8'
  );
}

function exportMatchQualityComparison(result, weightResults) {
  const algo = result.algorithmVsRandom;
  const comparison = {
    algorithm: {
      averageSimilarity: algo.algorithmAverageSimilarity,
      improvementOverRandomPercent: algo.improvementPercent
    },
    random: {
      averageSimilarity: algo.randomAverageSimilarity,
      iterations: algo.randomIterations
    },
    weightExperiments: weightResults.map((r) => ({
      name: r.name,
      weights: r.weights,
      averageScore: r.averageScore,
      matchCount: r.matchCount,
      coveragePercent: r.coverage
    }))
  };
  fs.writeFileSync(
    path.join(OUT_DIR, 'match_quality_comparison.json'),
    JSON.stringify(comparison, null, 2),
    'utf8'
  );
}

function main() {
  ensureOutputDir();
  const surveyRows = ensureData();
  console.log(`Evaluating with ${surveyRows.length} survey responses.`);

  const result = runEvaluation(surveyRows);
  const weightResults = runWeightExperiments(surveyRows);

  exportSimilarityDistribution(result);
  exportNetworkGraph(surveyRows, result.algorithmMatches);
  exportMatchQualityComparison(result, weightResults);

  const reportPath = path.join(OUT_DIR, 'report.txt');
  fs.writeFileSync(reportPath, generateReport(result, weightResults), 'utf8');
  console.log(`Report written to ${reportPath}`);

  console.log('Output files:', fs.readdirSync(OUT_DIR).join(', '));
}

main();
