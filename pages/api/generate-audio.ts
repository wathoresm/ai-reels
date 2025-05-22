import { NextApiRequest, NextApiResponse } from 'next';
import { PollyClient, SynthesizeSpeechCommand, OutputFormat, VoiceId  } from '@aws-sdk/client-polly';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from "stream";

const polly = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { script, celebrity } = req.body;

  if (!script) {
    return res.status(400).json({ error: 'Script text is required' });
  }

  const audioName = celebrity.split(' ').join('_') + '_' + uuidv4() + '.mp3';

  const params = {
    Text: script,
    OutputFormat: OutputFormat.MP3,
    VoiceId: VoiceId.Joanna,
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
    await Promise.all(
      files.map(file => fs.unlink(path.join(downloadDir, file)))
    );

    const outputPath = path.join(downloadDir, audioName);
    
    // Convert to async iterable if needed
    const stream = Readable.from(data.AudioStream as any);
    const audioChunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      audioChunks.push(chunk as Uint8Array);
    }

    await fs.writeFile(outputPath, Buffer.concat(audioChunks));

    const publicUrl = `/audio/${audioName}`;
    return res.status(200).json({ success: true, url: publicUrl, name: audioName });
    //return res.status(200).json({ success: true, url: '/audio/ronaldo_2998ccbf-4bf5-4002-b124-9657f91ac5e4.mp3', name: 'ronaldo_2998ccbf-4bf5-4002-b124-9657f91ac5e4.mp3' });
  } catch (error) {
    console.error('Polly TTS Error:', error);
    return res.status(500).json({ error: 'Failed to generate audio' });
  }
}
