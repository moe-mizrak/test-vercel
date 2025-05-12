import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="60">
      <rect width="100%" height="100%" fill="#0f172a"/>
      <text x="50%" y="50%" fill="#facc15" dominant-baseline="middle" text-anchor="middle" font-size="16" font-family="monospace">
        🧩 Thanks for joining the cross-promotion!
      </text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(svg);
}
