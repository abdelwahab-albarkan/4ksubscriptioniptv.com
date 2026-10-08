import siteConfig from '../data/site-config.json';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteConfig.domain}/sitemap.xml
`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
