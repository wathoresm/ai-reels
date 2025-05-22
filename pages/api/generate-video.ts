import type { NextApiRequest, NextApiResponse } from 'next';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function uploadToS3(filePath: string, key: string, celebrity: string) {
  const fileStream = fs.createReadStream(filePath);

  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    Body: fileStream,
    ContentType: 'video/mp4',
    Metadata: {
      creator: 'ai-reels-generator',
      type: 'sports-highlight',
      source: 'nextjs-api',
      project: 'sports-history-reels',
      name: `${celebrity} sports highlight`
    },
    Tagging: 'purpose=ai-generated&category=sports',
  };

  await s3.send(new PutObjectCommand(uploadParams));
  return `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

const getAudioDuration = (audioPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 1);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { audio, celebrity, script } = req.body;
    console.log(req.body);
    const videoName = celebrity.split(' ').join('_') + '_' + uuidv4() + '.mp4';
    const imagesDir = path.join(process.cwd(), 'public', 'downloaded-images');
    const audioPath = path.join(process.cwd(), 'public', 'audio', audio);
    const outputDir = path.join(process.cwd(), 'public', 'videos');
    const outputPath = path.join(outputDir, videoName);

    // const srtPath = path.join(process.cwd(), 'public', 'subtitles', `${path.parse(videoName).name}.srt`);

    // await fsPromises.mkdir(path.dirname(srtPath), { recursive: true });

    // const generateSrt = (script: string, duration: number, maxWordsPerBlock = 12) => {
    //   const words = script.split(' ');
    //   const totalBlocks = Math.ceil(words.length / maxWordsPerBlock);
    //   const blockDuration = Math.max(duration / totalBlocks, 1.5);
    //   const blocks: string[] = [];

    //   for (let i = 0; i < totalBlocks; i++) {
    //     const startTime = i * blockDuration;
    //     const endTime = (i + 1) * blockDuration;

    //     const start = new Date(startTime * 1000).toISOString().substr(11, 12).replace('.', ',');
    //     const end = new Date(endTime * 1000).toISOString().substr(11, 12).replace('.', ',');

    //     const text = words.slice(i * maxWordsPerBlock, (i + 1) * maxWordsPerBlock).join(' ');

    //     blocks.push(`${i + 1}\n${start} --> ${end}\n${text}\n`);
    //   }

    //   return blocks.join('\n');
    // };

    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const imageFiles = fs.readdirSync(imagesDir).filter(file =>
      /\.(jpg|jpeg|png)$/i.test(file)
    );

    imageFiles.forEach(file => {
      const filePath = path.join(imagesDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing image file: ${file}`);
      }
    });

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

    // Ensure output directory exists
    await fsPromises.mkdir(outputDir, { recursive: true });

    // ✅ Delete all files in the videos directory
    // const existingFiles = await fsPromises.readdir(outputDir);
    // await Promise.all(
    //   existingFiles.map(file => fsPromises.unlink(path.join(outputDir, file)))
    // );


    // const srtContent = generateSrt(script, duration);
    // await fsPromises.writeFile(srtPath, srtContent);
    // const assPath = 'D:\ai-reels\public\subtitles\ronaldo_2e6c81eb-4bb2-4697-90e1-d5bd38bdff38.ass';



    // FFmpeg processing
    ffmpeg()
      .input(inputFile)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .input(audioPath)
      .outputOptions([
        // Resize safely and pad to 720p
        '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        //'-vf', `scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,subtitles='${srtPath.replace(/\\/g, '\\\\')}'`,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-r', '30',
        '-pix_fmt', 'yuv420p',
        '-shortest',
      ])
      // .videoFilters([
      //   'scale=1280:720:force_original_aspect_ratio=decrease',
      //   'pad=1280:720:(ow-iw)/2:(oh-ih)/2',
      //   `ass='${assPath.replace(/\\/g, '/')}'`
      // ])
      // .outputOptions([
      //   '-c:v', 'libx264',
      //   '-c:a', 'aac',
      //   '-b:a', '128k',
      //   '-r', '30',
      //   '-pix_fmt', 'yuv420p',
      //   '-shortest',
      // ])
      .on('start', command => console.log('FFmpeg command:', command))
      .on('end', async () => {
        console.log('✅ Video created, now uploading to S3...');
        try {
          //const s3Key = `videos/${Date.now()}_output.mp4`;
          
          const s3Key = `videos/${videoName}`;
          const videoUrl = await uploadToS3(outputPath, s3Key, celebrity);
          console.log('✅ Uploaded to S3:', videoUrl);

          res.status(200).json({ message: 'Video created and uploaded!', url: videoUrl, localPath: outputPath });
          //res.status(200).json({ message: 'Video created and uploaded!', url: s3Key, localPath: outputPath });
        } catch (uploadError: any) {
          console.error('❌ Upload failed:', uploadError);
          res.status(500).json({ error: 'Upload to S3 failed', details: uploadError.message });
        }
      })
      .on('error', err => {
        console.error('FFmpeg failed:', err.message);
        res.status(500).json({ error: 'Video generation failed', details: err.message });
      })
      //.on('stderr', line => console.log('FFmpeg stderr:', line))
      .save(outputPath);
  } catch (err: any) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}
