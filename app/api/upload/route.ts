import { NextResponse } from "next/server";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET } from "@/shared/config/aws";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}`;

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate thumbnail using sharp
    const thumbnail = await sharp(buffer)
      .resize(300, 300, {
        fit: "cover",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 60 })
      .toBuffer();

    // Upload original to S3
    const originalCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: `attachments/${fileName}.${fileExtension}`,
      Body: buffer,
      ContentType: file.type,
    });

    // Upload thumbnail to S3
    const thumbnailCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: `attachments/thumbnails/${fileName}.jpg`,
      Body: thumbnail,
      ContentType: "image/jpeg",
    });

    try {
      await Promise.all([
        s3Client.send(originalCommand),
        s3Client.send(thumbnailCommand),
      ]);
    } catch (s3Error) {
      console.error("S3 Upload Error:", s3Error);
      return NextResponse.json(
        {
          error: "Failed to upload to S3",
          details: s3Error instanceof Error ? s3Error.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Generate signed URLs for both original and thumbnail
    const [originalUrl, thumbnailUrl] = await Promise.all([
      getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: `attachments/${fileName}.${fileExtension}`,
        }),
        { expiresIn: 604800 } // 1 week
      ),
      getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: `attachments/thumbnails/${fileName}.jpg`,
        }),
        { expiresIn: 604800 } // 1 week
      ),
    ]);

    return NextResponse.json({
      url: originalUrl,
      thumbnailUrl: thumbnailUrl,
      key: `attachments/${fileName}.${fileExtension}`,
      thumbnailKey: `attachments/thumbnails/${fileName}.jpg`,
    });
  } catch (error) {
    console.error("Error in upload route:", error);
    return NextResponse.json(
      {
        error: "Failed to process upload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
