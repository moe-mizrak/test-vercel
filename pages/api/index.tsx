import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="60">
      <rect width="100%" height="100%" fill="#0f172a"/>
      <text x="50%" y="50%" fill="#facc15" dominant-baseline="middle" text-anchor="middle" font-size="16" font-family="monospace">
        🧩 Thanks for joining the cross-promotion!
      </text>
    </svg>
  `.trim(); // Trim leading/trailing spaces

  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src *; font-src *;");
  res.end(svg);
}
