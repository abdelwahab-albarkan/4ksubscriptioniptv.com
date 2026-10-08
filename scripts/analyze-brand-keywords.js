import fs from 'fs';
import path from 'path';

// Let's read keyword-map.json and cluster-definitions.json to see top search volumes and brandable keywords
const clusterFile = './src/data/seo/cluster-definitions.json';
const clusters = JSON.parse(fs.readFileSync(clusterFile, 'utf-8'));

console.log('--- TOP 30 CLUSTERS BY TOTAL SEARCH VOLUME ---');
const sortedClusters = Object.entries(clusters)
  .map(([slug, data]) => ({
    slug,
    title: data.h1 || data.primaryKeyword,
    primaryKeyword: data.primaryKeyword,
    volume: data.totalVolume || 0,
    category: data.category
  }))
  .sort((a, b) => b.volume - a.volume);

sortedClusters.slice(0, 30).forEach((c, i) => {
  console.log(`${i + 1}. [${c.volume.toLocaleString()} searches/mo] "${c.primaryKeyword}" (Slug: /iptv/${c.slug})`);
});

console.log('\n--- TOP HIGH-INTENT IPTV / STREAMING SEARCH QUERIES ---');
const topQueries = [];
for (const [slug, data] of Object.entries(clusters)) {
  if (data.keywords && Array.isArray(data.keywords)) {
    for (const kw of data.keywords) {
      if (kw.volume && kw.volume >= 5000) {
        topQueries.push({ keyword: kw.keyword, volume: kw.volume, cluster: slug });
      }
    }
  }
}

topQueries.sort((a, b) => b.volume - a.volume);
const uniqueKw = new Map();
for (const q of topQueries) {
  if (!uniqueKw.has(q.keyword.toLowerCase())) {
    uniqueKw.set(q.keyword.toLowerCase(), q);
  }
}

Array.from(uniqueKw.values()).slice(0, 35).forEach((q, i) => {
  console.log(`${i + 1}. [${q.volume.toLocaleString()}/mo] "${q.keyword}"`);
});
