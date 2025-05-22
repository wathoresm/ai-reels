/*import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from "next";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { key } = req.query;

  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "Missing or invalid key parameter" });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 }); // expires in 60 seconds
    res.status(200).json({ url });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate signed URL", detail: err });
  }
}*/
