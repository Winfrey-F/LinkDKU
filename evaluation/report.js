/**
 * Evaluation report text generation
 */

function generateReport(result, weightResults) {
  const lines = [];
  const sim = result.similarityDistribution;
  const quality = result.matchQuality;
  const div = result.diversity;
  const cov = result.coverage;
  const vsR = result.algorithmVsRandom;

  lines.push('========================================');
  lines.push('  LINKDKU Matching Algorithm Evaluation Report');
  lines.push('========================================');
  lines.push('');

  lines.push('1. Data scale');
  lines.push(`  Survey responses: ${result.surveyRowCount}`);
  lines.push(`  Algorithm match pairs: ${result.algorithmMatches.length}`);
  lines.push('');

  lines.push('2. Similarity distribution (all user pairs)');
  lines.push(`  Pair count: ${sim.pairCount}`);
  lines.push(`  Mean: ${sim.stats.mean}`);
  lines.push(`  Median: ${sim.stats.median}`);
  lines.push(`  Std dev: ${sim.stats.std}`);
  lines.push(`  Min: ${sim.stats.min}`);
  lines.push(`  Max: ${sim.stats.max}`);
  lines.push('  Note: Higher spread (std) indicates better algorithm discriminative power.');
  lines.push('');

  lines.push('3. Match quality');
  lines.push(`  Average similarity of matched pairs: ${quality.averageScore.toFixed(4)}`);
  lines.push(`  Score mean: ${quality.stats.mean}`);
  lines.push(`  Score median: ${quality.stats.median}`);
  lines.push(`  Score std dev: ${quality.stats.std}`);
  lines.push('');

  lines.push('4. Diversity metrics (DKU)');
  lines.push(`  Cross-major match ratio: ${(div.crossMajorRatio * 100).toFixed(2)}% (${div.crossMajorCount}/${div.totalPairs})`);
  lines.push(`  Cross-year match ratio: ${(div.crossYearRatio * 100).toFixed(2)}% (${div.crossYearCount}/${div.totalPairs})`);
  lines.push(`  Common-language match ratio: ${(div.commonLanguageRatio * 100).toFixed(2)}% (${div.commonLanguageCount}/${div.totalPairs})`);
  lines.push(`  Cross-culture match ratio: ${(div.crossCultureRatio * 100).toFixed(2)}% (${div.crossCultureCount}/${div.totalPairs})`);
  lines.push('');

  lines.push('5. Coverage');
  lines.push(`  Total users: ${cov.totalUsers}`);
  lines.push(`  Matched users: ${cov.matchedUsers}`);
  lines.push(`  Unmatched users: ${cov.unmatchedUsers}`);
  lines.push(`  Coverage: ${cov.coveragePercent}%`);
  lines.push('');

  lines.push('6. Algorithm vs random matching');
  lines.push(`  Algorithm average similarity: ${vsR.algorithmAverageSimilarity}`);
  lines.push(`  Random average similarity: ${vsR.randomAverageSimilarity} (${vsR.randomIterations} iterations)`);
  lines.push(`  Relative improvement: ${vsR.improvementPercent}%`);
  lines.push('  Note: Positive value means the algorithm outperforms random pairing.');
  lines.push('');

  lines.push('7. Weight configuration experiments');
  weightResults.forEach((r) => {
    lines.push(`  [${r.name}]`);
    lines.push(`    Weights: ${JSON.stringify(r.weights)}`);
    lines.push(`    Avg score: ${r.averageScore.toFixed(4)}, Match count: ${r.matchCount}, Coverage: ${r.coverage}%`);
  });
  lines.push('');

  lines.push('8. Interpretation and recommendations');
  if (sim.stats.std < 0.1) {
    lines.push('  - Similarity distribution is narrow; consider adding more discriminative features or weights.');
  }
  if (div.commonLanguageRatio < 0.5) {
    lines.push('  - Common-language match ratio is low; consider relaxing language constraints to encourage cross-language pairing.');
  }
  if (cov.coveragePercent < 90 && cov.totalUsers > 2) {
    lines.push('  - Some users remain unmatched; check preference list length or Gale–Shapley implementation.');
  }
  if (vsR.improvementPercent > 0) {
    lines.push('  - The algorithm improves over random matching; the matching strategy is effective.');
  }
  lines.push('  - Use weight experiments to choose a configuration that best balances quality and diversity.');
  lines.push('');

  lines.push('========================================');
  lines.push(`  Report generated: ${new Date().toISOString()}`);
  lines.push('========================================');

  return lines.join('\n');
}

module.exports = { generateReport };
