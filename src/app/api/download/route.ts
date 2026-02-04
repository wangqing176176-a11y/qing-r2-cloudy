import { getRequestContext } from "@cloudflare/next-on-pages";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const decodeKeyFromPathParam = (raw: string) => {
  const withoutLeadingSlash = raw.startsWith("/") ? raw.slice(1) : raw;
  const parts = withoutLeadingSlash.split("/").filter((p) => p.length > 0);
  const decodedParts = parts.map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  return decodedParts.join("/");
};

const encodeRFC5987ValueChars = (value: string) =>
  encodeURIComponent(value)
    .replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, "%2A");

const buildContentDisposition = (filename: string) => {
  const safeFallback = filename.replace(/[/\\"]/g, "_");
  const encoded = encodeRFC5987ValueChars(filename);
  return `attachment; filename="${safeFallback}"; filename*=UTF-8''${encoded}`;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyParam = searchParams.get("key");
  const pathParam = searchParams.get("path");
  const filenameParam = searchParams.get("filename");

  const raw = (keyParam ?? pathParam ?? "").trim();
  if (!raw) {
    return new Response("Missing required query param: key or path", { status: 400 });
  }

  const ctx = getRequestContext();
  const env = ctx?.env;
  if (
    !env ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_ACCOUNT_ID ||
    !env.R2_BUCKET_NAME
  ) {
    return new Response(
      "R2 config missing. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.",
      { status: 500 },
    );
  }

  const key = decodeKeyFromPathParam(raw);

  const filename =
    (filenameParam && filenameParam.trim().length > 0 ? filenameParam.trim() : null) ??
    key.split("/").filter(Boolean).pop() ??
    "download";

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: buildContentDisposition(filename),
    }),
    { expiresIn: 60 * 10 },
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: signedUrl,
      "Cache-Control": "no-store",
    },
  });
}
