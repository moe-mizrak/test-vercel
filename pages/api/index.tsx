// pages/api/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const repoUrl = req.query.repo_url as string | undefined;

  if (!repoUrl) {
    res.status(400).send('Missing repo_url');
    return;
  }

  const acceptHeader = req.headers['accept'] || '';

  // 1. Register the user repo in DB if not already
  const exists = await redis.get(repoUrl);
  if (!exists) {
    await redis.set(repoUrl, repoUrl);
  }

  // 2. Handle browser navigation
  if (acceptHeader.includes('text/html')) {
    res.writeHead(302, { Location: repoUrl });
    res.end();
    return;
  }

  // 3. Pick a random repo from Redis
  const allRepos = await redis.keys('*'); // keys are the repo URLs
  const randomRepo = allRepos[Math.floor(Math.random() * allRepos.length)] || repoUrl;

  // 4. Extract repo name from random repo
  let repoName = 'Invalid repo URL';
  try {
    const parts = new URL(randomRepo).pathname.split('/');
    repoName = parts.pop() || '';
  } catch {}

  // 5. Generate redirect URL using the random repo
  const redirectUrl = `${req.headers.host?.startsWith('http') ? '' : 'https://'}${req.headers.host}/api/redirect?repo_url=${encodeURIComponent(randomRepo)}`;

  // 6. Generate SVG using redirect URL and random repo name
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="60">
      <a href="${redirectUrl}" target="_blank">
        <rect width="100%" height="100%" fill="#0f172a"/>
        <text x="50%" y="50%" fill="#facc15" dominant-baseline="middle" text-anchor="middle" font-size="16" font-family="monospace">
          ${repoName}
        </text>
      </a>
    </svg>
  `.trim();

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
