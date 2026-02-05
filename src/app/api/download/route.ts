import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPublicR2BaseUrl, issueAccessToken } from "@/lib/cf";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const buildDirectRedirectUrl = (origin: string, key: string, filename?: string) => {
  const params = new URLSearchParams();
  params.set("key", key);
  params.set("download", "1");
  if (filename) params.set("filename", filename);
  return `${origin}/api/direct?${params.toString()}`;
};

const encodeKeyForUrlPath = (key: string) =>
  key
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = (searchParams.get("key") ?? searchParams.get("path") ?? "").trim();
    const download = searchParams.get("download") === "1";
    const filename = (searchParams.get("filename") ?? "").trim();
    const direct = searchParams.get("direct") === "1";

    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    const publicBaseUrl = getPublicR2BaseUrl();
    if (direct && publicBaseUrl) {
      const origin = new URL(req.url).origin;
      if (download) {
        // Return a same-origin redirector so the browser can use <a download> reliably,
        // while the bytes still come directly from R2.
        const url = buildDirectRedirectUrl(origin, key, filename || undefined);
        return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
      }

      // Preview: return a direct public URL (fast + stable + total size available).
      const url = `${publicBaseUrl}/${encodeKeyForUrlPath(key)}`;
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
