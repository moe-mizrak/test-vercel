// pages/api/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

// — initialize Upstash Redis with your KV_URL and KV_REST_API_TOKEN
const redis = new Redis({
  url: process.env.KV_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const repoUrl = req.query.repo_url as string | undefined;

  if (!repoUrl) {
    res.status(400).send('Missing repo_url');
    return;
  }

  const acceptHeader = req.headers['accept'] || '';

  // ——————————————————————————
  // 1) Redirect path: browser navigations
  // ——————————————————————————
  if (acceptHeader.includes('text/html')) {
    res.writeHead(302, { Location: repoUrl });
    res.end();
    return;
  }

  // ——————————————————————————
  // 2) Image path: serve SVG + KV write
  // ——————————————————————————
  // extract repo name
  let repoName = 'Invalid repo URL';
  try {
    const parts = new URL(repoUrl).pathname.split('/');
    repoName = parts.pop() || '';
  } catch {}

  // generate SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="60">
      <rect width="100%" height="100%" fill="#0f172a"/>
      <text x="50%" y="50%" fill="#facc15" dominant-baseline="middle" text-anchor="middle" font-size="16" font-family="monospace">
        ${repoName}
      </text>
    </svg>
  `.trim();

  // — check Redis: only set if not already present
  const exists = await redis.get(repoUrl);
  if (!exists) {
    // store the URL itself as the value; feel free to swap in timestamp, counter, etc.
    await redis.set(repoUrl, repoUrl);
  }

  // — send SVG
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
