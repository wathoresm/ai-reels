import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import https from 'https';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const GOOGLE_CX = process.env.GOOGLE_CX!;

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

const downloadImage = async (url: string, filename: string) => {
  const filePath = path.join(process.cwd(), 'public', 'downloads', filename);

  return new Promise<void>((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Failed to get '${url}'`));

      const data: Uint8Array[] = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', async () => {
        try {
          await writeFile(filePath, Buffer.concat(data));
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid query parameter' });
  }

  const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    query
  )}&searchType=image&key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&num=5`;

  try {
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!data.items) {
      return res.status(404).json({ error: 'No images found' });
    }

    const imageUrls = data.items.map((item: any) => item.link);

    // Create directory if it doesn't exist
    const downloadDir = path.join(process.cwd(), 'public', 'downloads');
    if (!fs.existsSync(downloadDir)) {
      await mkdir(downloadDir, { recursive: true });
    }

    // Download images
    const downloads = imageUrls.map((url, index) =>
      downloadImage(url, `${query.replace(/\s+/g, '_')}_${index}.jpg`)
    );
    await Promise.all(downloads);

    res.status(200).json({ message: 'Images downloaded', files: imageUrls });
  } catch (error) {
    console.error('Image Search Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
