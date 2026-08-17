const { performance } = require("perf_hooks");

const baseUrl = process.env.COMPARISON_PERF_BASE_URL || "http://127.0.0.1:5000/api";
const projectId = process.env.COMPARISON_PERF_PROJECT_ID || "69f2c49753da2d63cd9de17a";
const projectIds = process.env.COMPARISON_PERF_PROJECT_IDS ||
  [
    "69f2c49753da2d63cd9de17a",
    "686d5ca80a980894b786e510",
    "686d5ca80a980894b786e515",
    "686d5caa0a980894b786e571",
    "686d5caa0a980894b786e57a",
  ].join(",");

async function timed(label, url) {
  const startedAt = performance.now();
  const response = await fetch(url);
  const text = await response.text();
  const durationMs = Math.round(performance.now() - startedAt);
  const bytes = Buffer.byteLength(text);

  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    parsed = null;
  }
  const payload = parsed?.data || parsed || {};

  return {
    label,
    status: response.status,
    durationMs,
    bytes,
    comparisonRows: payload?.comparisonTable?.length ?? null,
    peerSeries: payload?.peerComparisonHistory?.length ?? null,
    historyPoints: payload?.peerComparisonHistory?.[0]?.series?.length ?? null,
  };
}

async function main() {
  const comparisonUrl = `${baseUrl}/projects/${encodeURIComponent(projectId)}/ico-comparison?peerLimit=4&includePeers=true`;
  const historyUrl = `${baseUrl}/projects/${encodeURIComponent(projectId)}/ico-comparison/history?range=30D&peerLimit=0&includeIndustry=true&projectIds=${encodeURIComponent(projectIds)}`;
  const urls = [
    ["comparison cold/repeat-1", comparisonUrl],
    ["history cold/repeat-1", historyUrl],
    ["comparison repeat-2", comparisonUrl],
    ["history repeat-2", historyUrl],
  ];
  const results = [];

  for (const [label, url] of urls) {
    results.push(await timed(label, url));
  }

  console.table(results);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
