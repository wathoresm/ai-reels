import express from 'express';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const polly = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/generate-audio', async (req, res) => {
  const { script, celebrity } = req.body;

  if (!script || !celebrity) {
    return res.status(400).json({ error: 'Script and celebrity name are required' });
  }

  const audioName = celebrity.split(' ').join('_') + '_' + uuidv4() + '.mp3';

  const params = {
    Text: script,
    OutputFormat: 'mp3',
    VoiceId: 'Joanna',
  };

  try {
    const command = new SynthesizeSpeechCommand(params);
    const data = await polly.send(command);

    if (!data.AudioStream) {
      return res.status(500).json({ error: 'No audio stream returned from Polly' });
    }

    const downloadDir = path.join(process.cwd(), 'public', 'audio');
    await fs.mkdir(downloadDir, { recursive: true });

    // Clean directory
    const files = await fs.readdir(downloadDir);
    await Promise.all(files.map(file => fs.unlink(path.join(downloadDir, file))));

    const outputPath = path.join(downloadDir, audioName);
    const audioChunks = [];

    for await (const chunk of data.AudioStream) {
      audioChunks.push(chunk);
    }

    await fs.writeFile(outputPath, Buffer.concat(audioChunks));

    // const audioName = 'pele_b7a28b5a-f340-4b82-9667-2bafc2ba27e4.mp3';
    const publicUrl = `/audio/${audioName}`;
    return res.status(200).json({ success: true, url: publicUrl, name: audioName });
  } catch (error) {
    console.error('Polly TTS Error:', error);
    return res.status(500).json({ error: 'Failed to generate audio' });
  }
});

export default router;
