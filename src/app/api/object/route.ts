import type { NextRequest } from "next/server";
import { hasTokenSecret, verifyAccessToken, getBucket } from "@/lib/cf";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const DOWNLOAD_BUFFER_MAX_BYTES = 32 * 1024 * 1024; // 32MiB

const sanitizeHeaderValue = (value: string) => value.replaceAll("\n", " ").replaceAll("\r", " ").trim();

const MAX_SAFE_INTEGER_DEC = "9007199254740991";

const isPositiveDecimalString = (s: string) => /^\d+$/.test(s) && s !== "0";

const lteMaxSafeIntegerDecimal = (s: string) => {
  // assumes s is positive decimal without leading sign
  if (s.length < MAX_SAFE_INTEGER_DEC.length) return true;
  if (s.length > MAX_SAFE_INTEGER_DEC.length) return false;
  return s <= MAX_SAFE_INTEGER_DEC;
};

const toLengthHeaderValue = (value: unknown): string | null => {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return String(Math.trunc(value));
  }
  if (typeof value === "bigint") {
    const s = value.toString(10);
    if (!isPositiveDecimalString(s)) return null;
    return s;
  }
  return null;
};

const toSafeNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value === "bigint") {
    const s = value.toString(10);
    if (s.startsWith("-")) return null;
    if (!/^\d+$/.test(s)) return null;
    if (!lteMaxSafeIntegerDecimal(s)) return null;
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const encodeRFC5987ValueChars = (value: string) =>
  encodeURIComponent(value)
    .replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, "%2A");

const toAsciiFallbackFilename = (value: string) => {
  const cleaned = sanitizeHeaderValue(value).replace(/[/\\"]/g, "_");
  return cleaned.slice(0, 180) || "download";
};

const buildContentDisposition = (disposition: "attachment" | "inline", filename: string) => {
  const safeFallback = toAsciiFallbackFilename(filename);
  const encoded = encodeRFC5987ValueChars(sanitizeHeaderValue(filename));
  return `${disposition}; filename="${safeFallback}"; filename*=UTF-8''${encoded}`;
};

const json = (status: number, obj: unknown) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

const parseRange = (rangeHeader: string | null, totalSize: number | null) => {
  if (!rangeHeader) return null;
  const m = rangeHeader.match(/^bytes=(\d*)-(\d*)$/i);
  if (!m) return null;
  const a = m[1];
  const b = m[2];

  // suffix: -N
  if (!a && b) {
    if (totalSize == null) return null;
    const n = Number.parseInt(b, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    const end = totalSize - 1;
    const start = Math.max(0, totalSize - n);
    return { start, end };
  }

  const start = a ? Number.parseInt(a, 10) : NaN;
  if (!Number.isFinite(start) || start < 0) return null;

  if (!b) {
    if (totalSize == null) return null;
    return { start, end: totalSize - 1 };
  }

  const end = Number.parseInt(b, 10);
  if (!Number.isFinite(end) || end < start) return null;
  return { start, end };
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = (searchParams.get("key") ?? searchParams.get("path") ?? "").trim();
    const download = searchParams.get("download") === "1";
    const filename = searchParams.get("filename");

    if (!key) return json(400, { error: "Missing key" });

    const suggestedName = sanitizeHeaderValue(filename || key.split("/").pop() || "download");

    const payload = `object\n${key}\n${download ? "1" : "0"}`;
    if (hasTokenSecret()) {
      const token = searchParams.get("token") ?? "";
      if (!token || !(await verifyAccessToken(payload, token))) {
        return json(401, { error: "Unauthorized" });
      }
    }

    const bucket = getBucket();

    // Head for size/etag (helps browser show total size and enables Range parsing).
    let head: Awaited<ReturnType<typeof bucket.head>> = null;
    const rangeHeader = req.headers.get("range");
    if (rangeHeader || download) head = await bucket.head(key);

    const totalSizeForRange: number | null = toSafeNumber(head?.size);
    const totalSizeHeader: string | null = toLengthHeaderValue(head?.size);
    const range = parseRange(rangeHeader, totalSizeForRange);

    const headers = new Headers();
    headers.set("Cache-Control", "no-store, no-transform");
    headers.set("Accept-Ranges", "bytes");

    if (download) {
      headers.set("Content-Disposition", buildContentDisposition("attachment", suggestedName));
    }

    if (rangeHeader && !range) {
      // Invalid or unsatisfiable range. Prefer a spec-compliant 416 over silently ignoring it.
      if (totalSizeHeader) headers.set("Content-Range", `bytes */${totalSizeHeader}`);
      return new Response("Range Not Satisfiable", { status: 416, headers });
    }

    if (range) {
      const length = range.end - range.start + 1;
      const obj = await bucket.get(key, { range: { offset: range.start, length } });
      if (!obj) return new Response("Not found", { status: 404 });

      const contentType = obj.httpMetadata?.contentType;
      if (contentType) headers.set("Content-Type", contentType);

      if (!download && (filename || contentType === "application/pdf")) {
        headers.set("Content-Disposition", buildContentDisposition("inline", suggestedName));
      }

      if (totalSizeHeader) headers.set("Content-Range", `bytes ${range.start}-${range.end}/${totalSizeHeader}`);
      headers.set("Content-Length", String(length));

      const etag = obj.httpEtag ?? obj.etag;
      if (etag) headers.set("ETag", etag);

      return new Response(obj.body, { status: 206, headers });
    }

    const obj = await bucket.get(key);
    if (!obj) return new Response("Not found", { status: 404 });

    const contentType = obj.httpMetadata?.contentType;
    if (contentType) headers.set("Content-Type", contentType);

    if (!download && (filename || contentType === "application/pdf")) {
      headers.set("Content-Disposition", buildContentDisposition("inline", suggestedName));
    }

    const sizeHeader = toLengthHeaderValue(obj.size ?? head?.size) ?? totalSizeHeader;
    const sizeForBuffer = toSafeNumber(obj.size ?? head?.size);
    if (sizeHeader) headers.set("Content-Length", sizeHeader);

    const etag = obj.httpEtag ?? obj.etag ?? head?.etag;
    if (etag) headers.set("ETag", etag);

    // Cloudflare may strip Content-Length for streamed 200 responses. For small downloads, buffer to ensure
    // a fixed-length 200 so Chrome can show total size and avoid silently saving truncated files.
    if (download && !rangeHeader && typeof sizeForBuffer === "number" && sizeForBuffer > 0 && sizeForBuffer <= DOWNLOAD_BUFFER_MAX_BYTES) {
      const body = obj.body;
      if (!body) return new Response("Not found", { status: 404 });
      const buf = await new Response(body).arrayBuffer();
      if (buf.byteLength !== sizeForBuffer) {
        return new Response("Upstream truncated", { status: 502, headers });
      }
      headers.set("Content-Length", String(buf.byteLength));
      return new Response(buf, { status: 200, headers });
    }

    return new Response(obj.body, { status: 200, headers });
  } catch (error: unknown) {
    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : String(error);
    return json(status, { error: message });
  }
}
