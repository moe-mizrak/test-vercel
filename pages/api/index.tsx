import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const DEFAULT_REPO = 'https://github.com/moe-mizrak/laravel-openrouter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const repoUrl = (req.query.repo_url as string) || DEFAULT_REPO;
  const acceptHeader = req.headers['accept'] || '';

  if (acceptHeader.includes('text/html')) {
    const selected = (await redis.get<string>(`selected_for:${repoUrl}`)) || DEFAULT_REPO;
    res.writeHead(302, { Location: selected });
    res.end();
    return;
  }

  let selected = await redis.get<string>(`selected_for:${repoUrl}`);

  if (!selected) {
    const allRepos = await redis.keys('*');
    const validRepos = allRepos.filter((key) => key !== `selected_for:${repoUrl}` && key.startsWith('https://'));
    selected = validRepos.length > 0
      ? validRepos[Math.floor(Math.random() * validRepos.length)]
      : DEFAULT_REPO;

    await redis.set(`selected_for:${repoUrl}`, selected, { ex: 60 * 5 });
  }

  // Try to extract name from selected repo
  let repoName = 'laravel-openrouter';
  try {
    const parts = new URL(selected).pathname.split('/');
    repoName = parts.pop() || repoName;
  } catch {}

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
        <rect width="100%" height="100%" fill="#E3F2FD"/> <!-- Very mild blue background -->
        <text x="50%" y="25%" fill="#2962FF" dominant-baseline="middle" text-anchor="middle" font-size="24" font-family="monospace" font-weight="bold">
            ${repoName}
        </text>
        <text x="50%" y="60%" fill="#0288D1" dominant-baseline="middle" text-anchor="middle" font-size="10" font-family="monospace" letter-spacing="2" font-style="italic">
            RepoFusion | Unite,Share,Accelerate
        </text>
        <line x1="10" y1="85" x2="390" y2="85" stroke="#0288D1" stroke-width="3" stroke-dasharray="8,4"/>
        <circle cx="10" cy="85" r="5" fill="#0288D1"/>
        <circle cx="390" cy="85" r="5" fill="#0288D1"/>
    </svg>
        `.trim();

  // Only store user’s own repo once
  const exists = await redis.get(repoUrl);
  if (!exists) {
    await redis.set(repoUrl, repoUrl);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; img-src *; font-src *;"
  );
  res.end(svg);
}
