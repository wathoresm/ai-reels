import type { NextApiRequest, NextApiResponse } from "next";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectTaggingCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const bucket = process.env.AWS_BUCKET_NAME!;
  const listCommand = new ListObjectsV2Command({ Bucket: bucket });

  try {
    const listResponse = await s3.send(listCommand);
    const contents = listResponse.Contents ?? [];

    const enrichedObjects = await Promise.all(
      contents.map(async (obj) => {
        const key = obj.Key!;
        let tags = [];
        let metadata = {};
        let presignedUrl = "";

        try {
          const tagCommand = new GetObjectTaggingCommand({ Bucket: bucket, Key: key });
          const tagResponse = await s3.send(tagCommand);
          tags = tagResponse.TagSet;
        } catch (err) {
          console.warn(`Could not fetch tags for ${key}`);
        }

        try {
          const headCommand = new HeadObjectCommand({ Bucket: bucket, Key: key });
          const headResponse = await s3.send(headCommand);
          metadata = headResponse.Metadata || {};
        } catch (err) {
          console.warn(`Could not fetch metadata for ${key}`);
        }

        try {
          const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
          presignedUrl = await getSignedUrl(s3, getObjectCommand, { expiresIn: 7 * 24 * 60 * 60 }); // 7 days in seconds
        } catch (err) {
          console.warn(`Could not generate presigned URL for ${key}`);
        }

        return {
          key,
          lastModified: obj.LastModified,
          size: obj.Size,
          tags,
          metadata,
          presignedUrl,
        };
      })
    );

    res.status(200).json({ contents: enrichedObjects });
  } catch (err) {
    console.error("Error fetching S3 data:", err);
    res.status(500).json({ error: "Could not fetch S3 object list", detail: err });
  }
}
