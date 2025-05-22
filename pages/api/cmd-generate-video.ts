import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const imageDir = path.join(process.cwd(), 'public', 'downloads');
  const audioPath = path.join(process.cwd(), 'public', 'audio', 'generated3.mp3');
  const outputVideo = path.join(process.cwd(), 'public', 'videos', 'output.mp4');

  if (!fs.existsSync(audioPath)) {
    return res.status(400).json({ error: 'Audio file not found' });
  }

  const imageFiles = fs.readdirSync(imageDir).filter(file => file.endsWith('.jpg') || file.endsWith('.png'));

  if (imageFiles.length === 0) {
    return res.status(400).json({ error: 'No images found to create video' });
  }

  // Create a temporary text file list for FFmpeg
  const inputList = path.join(imageDir, 'input.txt');
  const imageDuration = 5; // seconds per image

  fs.writeFileSync(
    inputList,
    imageFiles.map(img => `file '${path.join(imageDir, img)}'\nduration ${imageDuration}`).join('\n')
  );

  // Ensure the last image stays for the audio duration
  fs.appendFileSync(inputList, `file '${path.join(imageDir, imageFiles[imageFiles.length - 1])}'\n`);

  const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${inputList}" -i "${audioPath}" -c:v libx264 -c:a aac -shortest "${outputVideo}"`;

  exec(ffmpegCmd, (err, stdout, stderr) => {
    if (err) {
      console.error('FFmpeg error:', stderr);
      return res.status(500).json({ error: 'Failed to create video' });
    }

    res.status(200).json({ message: 'Video created', path: '/videos/output.mp4' });
  });
}
