import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPublicR2BaseUrl, issueAccessToken } from "@/lib/cf";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const sanitizeHeaderValue = (value: string) => value.replaceAll("\n", " ").replaceAll("\r", " ").trim();

const encodeRFC5987ValueChars = (value: string) =>
  encodeURIComponent(value)
    .replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, "%2A");

const toAsciiFallbackFilename = (value: string) => {
  const cleaned = sanitizeHeaderValue(value).replace(/[/\\"]/g, "_");
  const ascii = cleaned.replace(/[^\x20-\x7E]/g, "_");
  return ascii.slice(0, 180) || "download";
};

const buildContentDisposition = (disposition: "attachment" | "inline", filename: string) => {
  const safeFallback = toAsciiFallbackFilename(filename);
  const encoded = encodeRFC5987ValueChars(sanitizeHeaderValue(filename));
  return `${disposition}; filename="${safeFallback}"; filename*=UTF-8''${encoded}`;
};

const encodeKeyForUrlPath = (key: string) =>
  key
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

const buildPublicR2ObjectUrl = (baseUrl: string, key: string, filename: string | null, download: boolean) => {
  // baseUrl is normalized without query/hash and without trailing slash
  const path = encodeKeyForUrlPath(key);
  const u = new URL(`${baseUrl}/${path}`);

  // Attempt to force download + filename via S3-compatible response override.
  if (download) {
    const suggested = filename || key.split("/").pop() || "download";
    u.searchParams.set("response-content-disposition", buildContentDisposition("attachment", suggested));
    u.searchParams.set("response-content-type", "application/octet-stream");
  }

  return u.toString();
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = (searchParams.get("key") ?? searchParams.get("path") ?? "").trim();
    const download = searchParams.get("download") === "1";
    const filename = (searchParams.get("filename") ?? "").trim();
    const direct = searchParams.get("direct") === "1";

    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    const publicBaseUrl = getPublicR2BaseUrl();
    if (direct && download && publicBaseUrl) {
      const url = buildPublicR2ObjectUrl(publicBaseUrl, key, filename || null, true);
      return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
    }

    const origin = new URL(req.url).origin;
    const payload = `object
${key}
${download ? "1" : "0"}`;
    const token = await issueAccessToken(payload, 24 * 3600);

    const url = `${origin}/api/object?key=${encodeURIComponent(key)}${download ? "&download=1" : ""}${
      filename ? `&filename=${encodeURIComponent(filename)}` : ""
    }${token ? `&token=${encodeURIComponent(token)}` : ""}`;

    return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status });
  }
}
