import { getRequestContext } from "@cloudflare/next-on-pages";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const ctx = getRequestContext();
  const env = ctx?.env;

  if (!env || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_ACCOUNT_ID) {
    return NextResponse.json(
      { error: "R2 credentials not configured in environment variables" },
      { status: 500 }
    );
  }

  try {
    const { filename, contentType } = await request.json() as { filename: string; contentType: string };

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const S3 = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    // 生成预签名 URL，有效期 1 小时
    const signedUrl = await getSignedUrl(
      S3,
      new PutObjectCommand({
        Bucket: "qing-cloud", // 你的存储桶名称
        Key: filename,
        ContentType: contentType,
      }),
      { expiresIn: 3600 }
    );

    return NextResponse.json({ url: signedUrl });
  } catch (e: unknown) {
    console.error("Error generating signed URL:", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}