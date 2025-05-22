import express from 'express';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload to S3
async function uploadToS3(filePath, key, celebrity) {
  const fileStream = fs.createReadStream(filePath);

  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: 'video/mp4',
    Metadata: {
      creator: 'ai-reels-generator',
      type: 'sports-highlight',
      source: 'nodejs-api',
      project: 'sports-history-reels',
      name: `${celebrity} sports highlight`,
    },
    Tagging: 'purpose=ai-generated&category=sports',
  };

  await s3.send(new PutObjectCommand(uploadParams));
  return `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Get audio duration
const getAudioDuration = (audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 1);
    });
  });
};

// POST /api/generate-video
router.post('/generate-video', async (req, res) => {
  try {
    const { audio, celebrity, script } = req.body;
    const videoName = `${celebrity.split(' ').join('_')}_${uuidv4()}.mp4`;

    const baseDir = process.cwd();
    const imagesDir = path.join(baseDir, 'public', 'downloaded-images');
    const audioPath = path.join(baseDir, 'public', 'audio', audio);
    const outputDir = path.join(baseDir, 'public', 'videos');
    const outputPath = path.join(outputDir, videoName);

    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const imageFiles = fs.readdirSync(imagesDir).filter(file =>
      /\.(jpg|jpeg|png)$/i.test(file)
    );

    if (imageFiles.length === 0) {
      return res.status(400).json({ error: 'No image files found' });
    }

    const duration = await getAudioDuration(audioPath);
    const imageDuration = duration / imageFiles.length;

    const inputFile = path.join(imagesDir, 'input.txt');
    const inputLines = imageFiles.map(file => {
      const absPath = path.resolve(imagesDir, file).replace(/\\/g, '/').replace(/'/g, "'\\''");
      return `file '${absPath}'\nduration ${imageDuration.toFixed(2)}`;
    });

    const lastImagePath = path.resolve(imagesDir, imageFiles[imageFiles.length - 1]).replace(/\\/g, '/').replace(/'/g, "'\\''");
    inputLines.push(`file '${lastImagePath}'`);

    fs.writeFileSync(inputFile, inputLines.join('\n'), 'utf-8');

    await fsPromises.mkdir(outputDir, { recursive: true });
    const existingFiles = await fsPromises.readdir(outputDir);
    await Promise.all(existingFiles.map(file => fsPromises.unlink(path.join(outputDir, file))));

    ffmpeg()
      .input(inputFile)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .input(audioPath)
      .outputOptions([
        '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-r', '30',
        '-pix_fmt', 'yuv420p',
        '-shortest',
      ])
      .on('start', command => console.log('FFmpeg command:', command))
      .on('end', async () => {
        console.log('✅ Video created, now uploading to S3...');
        try {
          const s3Key = `videos/${videoName}`;
          const videoUrl = await uploadToS3(outputPath, s3Key, celebrity);
          console.log('✅ Uploaded to S3:', videoUrl);
          res.status(200).json({ message: 'Video created and uploaded!', url: videoUrl, localPath: outputPath });
        } catch (uploadError) {
          console.error('❌ Upload failed:', uploadError);
          res.status(500).json({ error: 'Upload to S3 failed', details: uploadError.message });
        }
      })
      .on('error', err => {
        console.error('FFmpeg failed:', err.message);
        res.status(500).json({ error: 'Video generation failed', details: err.message });
      })
      .save(outputPath);
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;
