// pages/api/redirect.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const repoUrl = req.query.repo_url as string | undefined;

  if (!repoUrl) {
    res.status(400).send('Missing repo_url');
    return;
  }

  // Redirect to the repository URL
  res.writeHead(302, { Location: repoUrl });
  res.end();
}
