import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clusterDefsPath = path.join(__dirname, '../src/data/seo/cluster-definitions.json');
const clusterDefs = JSON.parse(fs.readFileSync(clusterDefsPath, 'utf-8'));

const pagesDir = path.join(__dirname, '../src/pages');

for (const [id, cluster] of Object.entries(clusterDefs)) {
  let relativeFilePath = '';
  
  if (cluster.url === '/pricing') {
    relativeFilePath = 'pricing.astro';
  } else if (cluster.url === '/iptv-free-trial') {
    relativeFilePath = 'iptv-free-trial.astro';
  } else if (cluster.url === '/uk') {
    relativeFilePath = 'uk/index.astro';
  } else if (cluster.url === '/uk/pricing') {
    relativeFilePath = 'uk/pricing.astro';
  } else if (cluster.url === '/uk/iptv-free-trial') {
    relativeFilePath = 'uk/iptv-free-trial.astro';
  } else if (cluster.url.startsWith('/uk/')) {
    relativeFilePath = cluster.url.replace('/uk/', 'uk/') + '.astro';
  } else {
    relativeFilePath = cluster.url.replace(/^\//, '') + '.astro';
  }

  const fullPath = path.join(pagesDir, relativeFilePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });

  const pageContent = `---
import ClusterPageTemplate from '${path.relative(path.dirname(fullPath), path.join(pagesDir, '../components/ClusterPageTemplate.astro')).replace(/\\/g, '/')}';
---

<ClusterPageTemplate clusterId="${id}" />
`;

  fs.writeFileSync(fullPath, pageContent, 'utf-8');
  console.log(`Generated canonical page: ${relativeFilePath} -> ${cluster.title}`);
}

// Also generate UK Home Hub (/uk/index.astro)
const ukHomePath = path.join(pagesDir, 'uk/index.astro');
const ukHomeContent = `---
import ClusterPageTemplate from '../../components/ClusterPageTemplate.astro';
---

<ClusterPageTemplate clusterId="core-commercial-uk" />
`;
fs.writeFileSync(ukHomePath, ukHomeContent, 'utf-8');
console.log('Generated UK Home Hub at /uk/index.astro');

console.log('All canonical cluster pages generated successfully!');
