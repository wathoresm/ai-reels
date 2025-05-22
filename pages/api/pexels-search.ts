import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import fssync from 'fs'; // for createWriteStream
import path from 'path';
import https from 'https';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY!;
const DOWNLOAD_DIR = path.join(process.cwd(), 'public', 'downloads');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid `query` parameter.' });
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5`,
      {
        headers: { Authorization: PEXELS_API_KEY },
      }
    );

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return res.status(404).json({ error: 'No images found.' });
    }

    // Ensure download directory exists
    await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

    // Delete existing files in download folder
    const existingFiles = await fs.readdir(DOWNLOAD_DIR);
    await Promise.all(
      existingFiles.map((file) => fs.unlink(path.join(DOWNLOAD_DIR, file)))
    );

    const downloadedPaths: string[] = [];

    const downloadPromises = data.photos.map((photo: any, index: number) => {
      const imageUrl = photo.src.large;
      const filename = `${query.replace(/\s+/g, '_')}_${index}.jpg`;
      const filePath = path.join(DOWNLOAD_DIR, filename);
      const publicPath = `/downloads/${filename}`;
      downloadedPaths.push(publicPath);

      return new Promise<void>((resolve, reject) => {
        const file = fssync.createWriteStream(filePath);
        https.get(imageUrl, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(filePath).catch(() => {});
          reject(err);
        });
      });
    });

    await Promise.all(downloadPromises);

    res.status(200).json({
      message: 'Images downloaded successfully.',
      images: downloadedPaths,
    });
  } catch (error) {
    console.error('Error fetching from Pexels:', error);
    res.status(500).json({ error: 'Failed to fetch images.' });
  }
}
