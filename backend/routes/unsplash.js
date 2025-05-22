// backend/routes/unsplash.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();


const router = express.Router();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const IMAGES_DIR = path.join(process.cwd(), 'public', 'downloaded-images');

router.get('/fetch-images', async (req, res) => {
  const query = req.query.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid query param' });
  }

  try {
    // const unsplashRes = await fetch(
    //   `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&client_id=${UNSPLASH_ACCESS_KEY}`
    // );
    // const { results } = await unsplashRes.json();

    // // Ensure folder exists
    // await fs.mkdir(IMAGES_DIR, { recursive: true });

    // // Clear previous contents
    // const existingFiles = await fs.readdir(IMAGES_DIR);
    // await Promise.all(existingFiles.map(file => fs.unlink(path.join(IMAGES_DIR, file))));

    // const downloadedFiles = [];

    // for (const [index, image] of results.entries()) {
    //   const imageUrl = image.urls.regular;
    //   const imageRes = await fetch(imageUrl);
    //   const buffer = await imageRes.arrayBuffer();
    //   const filePath = path.join(IMAGES_DIR, `${query}-${index}.jpg`);
    //   await fs.writeFile(filePath, Buffer.from(buffer));
    //   downloadedFiles.push(`/downloaded-images/${query}-${index}.jpg`);
    // }

    // return res.status(200).json({ success: true, files: downloadedFiles });

    return res.status(200).json({ success: true, files: ["/downloaded-images/pele-0.jpg","/downloaded-images/pele-1.jpg","/downloaded-images/pele-2.jpg","/downloaded-images/pele-3.jpg","/downloaded-images/pele-4.jpg","/downloaded-images/pele-5.jpg","/downloaded-images/pele-6.jpg","/downloaded-images/pele-7.jpg","/downloaded-images/pele-8.jpg","/downloaded-images/pele-9.jpg"] });

    
  } catch (error) {
    console.error('Image fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch or store images' });
  }
});

export default router;
