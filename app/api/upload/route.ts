import { NextResponse } from "next/server";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET } from "@/shared/config/aws";
import { v4 as uuidv4 } from "uuid";

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
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: `attachments/${fileName}`,
      Body: buffer,
      ContentType: file.type,
    });

    try {
      await s3Client.send(command);
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

    // Generate a signed URL that expires in 1 week
    const getCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: `attachments/${fileName}`,
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 604800,
    }); // 1 week in seconds

    return NextResponse.json({
      url: signedUrl,
      key: `attachments/${fileName}`, // Store the S3 key for future reference
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
