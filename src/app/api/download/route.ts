import { getRequestContext } from "@cloudflare/next-on-pages";
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

  let env: unknown;
  try {
    env = getRequestContext<CloudflareEnv>().env;
  } catch (err) {
    const message = err instanceof Error ? err.message : "getRequestContext() failed";
    return new Response(`Not running on Cloudflare Pages (missing runtime env). ${message}`, { status: 501 });
  }

  const bucket = (env as CloudflareEnv).BUCKET;
  if (!bucket) {
    return new Response("Missing R2 binding: BUCKET", { status: 500 });
  }

  const key = decodeKeyFromPathParam(raw);
  const obj = await bucket.get(key);
  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  const filename =
    (filenameParam && filenameParam.trim().length > 0 ? filenameParam.trim() : null) ??
    key.split("/").filter(Boolean).pop() ??
    "download";

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Content-Disposition", buildContentDisposition(filename));
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  const size = (obj as unknown as { size?: number }).size;
  if (typeof size === "number" && Number.isFinite(size) && size >= 0) {
    headers.set("Content-Length", String(size));
  }

  return new Response(obj.body, { headers });
}
