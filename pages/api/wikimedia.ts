import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { keyword } = req.query;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&generator=search&gsrsearch=${encodeURIComponent(
      keyword
    )}&gsrlimit=5&iiprop=url`;

    const { data } = await axios.get(searchUrl);
    const pages = data.query?.pages || {};

    const imagePaths: string[] = [];

    for (const pageId in pages) {
      const image = pages[pageId];
      const imageUrl = image.imageinfo?.[0]?.url;
      if (imageUrl) {
        const imageName = path.basename(imageUrl);
        const imagePath = path.join(process.cwd(), 'public', 'downloads', imageName);

        const writer = fs.createWriteStream(imagePath);
        const response = await axios.get(imageUrl, { responseType: 'stream' });
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        imagePaths.push(`/downloads/${imageName}`);
      }
    }

    res.status(200).json({ images: imagePaths });
  } catch (error) {
    console.error('Wikimedia API error:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
}
