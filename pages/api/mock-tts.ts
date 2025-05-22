// pages/api/mock-tts.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { script } = req.body;

  if (!script) {
    return res.status(400).json({ message: 'Missing script content' });
  }

  // Simulated TTS processing delay
  setTimeout(() => {
    res.status(200).json({
      message: 'Mock TTS generation successful',
      audioUrl: 'https://example.com/mock-audio.mp3', // Replace with a real MP3 if desired
    });
  }, 1000);
}
