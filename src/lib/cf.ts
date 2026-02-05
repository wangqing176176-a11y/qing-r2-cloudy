import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

type EnvLike = Record<string, unknown>;

const getEnv = (): EnvLike => {
  try {
    const ctx = getRequestContext<{ env: EnvLike }>();
    if (ctx?.env) return ctx.env;
  } catch {
    // ignore
  }
  // Local dev fallback.
  const p = (globalThis as unknown as { process?: { env?: Record<string, unknown> } }).process;
  return p?.env ?? {};
};

export type R2HttpMetadataLike = {
  contentType?: string;
};

export type R2GetResultLike = {
  body: BodyInit | null;
  size?: number | bigint;
  etag?: string;
  httpEtag?: string;
  httpMetadata?: R2HttpMetadataLike;
  customMetadata?: unknown;
};

export type R2MultipartPartResultLike = {
  etag?: string;
};

export type R2MultipartUploadLike = {
  uploadPart: (partNumber: number, body: unknown) => Promise<R2MultipartPartResultLike>;
  complete: (parts: Array<{ etag: string; partNumber: number }>) => Promise<unknown>;
  abort: () => Promise<unknown>;
};

export type R2BucketLike = {
  list: (options: { prefix?: string; delimiter?: string; cursor?: string; limit?: number }) => Promise<unknown>;
  get: (key: string, options?: { range?: { offset: number; length: number } }) => Promise<R2GetResultLike | null>;
  head: (key: string) => Promise<{ size?: number | bigint; etag?: string } | null>;
  put: (key: string, value: unknown, options?: Record<string, unknown>) => Promise<{ etag?: string } | undefined>;
  delete: (keyOrKeys: string | string[]) => Promise<unknown>;
  createMultipartUpload?: (key: string, options?: Record<string, unknown>) => Promise<{ uploadId: string }>;
  resumeMultipartUpload?: (key: string, uploadId: string) => R2MultipartUploadLike;
};

export const getBucket = (): R2BucketLike => {
  const env = getEnv() as { BUCKET?: unknown };
  const bucket = env.BUCKET as unknown;
  if (!bucket) throw new Error("Missing R2 binding: BUCKET");
  return bucket as R2BucketLike;
};

export const getAdminPassword = (): string | null => {
  const env = getEnv();
  const pw = (env["ADMIN_PASSWORD"] as string | undefined | null) ?? null;
  return pw && String(pw).length ? String(pw) : null;
};

export const getAdminUsername = (): string | null => {
  const env = getEnv();
  const u = (env["ADMIN_USERNAME"] as string | undefined | null) ?? null;
  return u && String(u).length ? String(u) : null;
};

export const getPublicR2BaseUrl = (): string | null => {
  const env = getEnv();
  const raw = (env["PUBLIC_R2_BASE_URL"] as string | undefined | null) ?? null;
  const v = raw ? String(raw).trim() : "";
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    u.hash = "";
    u.search = "";
    const basePath = u.pathname.replace(/\/+$/, "");
    return `${u.origin}${basePath}`;
  } catch {
    return null;
  }
};

const getTokenSecret = (): string | null => {
  const env = getEnv();
  const explicit = (env["ADMIN_TOKEN_SECRET"] as string | undefined | null) ?? null;
  if (explicit && String(explicit).length) return String(explicit);
  return getAdminPassword();

};

export const hasTokenSecret = () => Boolean(getTokenSecret());


const b64urlEncode = (bytes: Uint8Array) => {
  let base64: string;
  if (typeof Buffer !== "undefined") base64 = Buffer.from(bytes).toString("base64");
  else {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    base64 = btoa(s);
  }
  return base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const timingSafeEq = (a: string, b: string) => {
  if (a.length != b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
};

const signHmac = async (secret: string, message: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return b64urlEncode(new Uint8Array(sig));
};

export const issueAccessToken = async (payload: string, expiresInSeconds = 600) => {
  const secret = getTokenSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + Math.max(30, Math.min(24 * 3600, expiresInSeconds));
  const sig = await signHmac(secret, `${payload}\n${exp}`);
  return `${exp}.${sig}`;
};

export const verifyAccessToken = async (payload: string, token: string) => {
  const secret = getTokenSecret();
  if (!secret) return false;
  const [expStr, sig] = token.split(".", 2);
  const exp = expStr ? Number.parseInt(expStr, 10) : NaN;
  if (!Number.isFinite(exp)) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await signHmac(secret, `${payload}\n${exp}`);
  return timingSafeEq(expected, sig);
};

const isAdminHeaderAuth = (req: Request) => {
  const requiredPw = getAdminPassword();
  if (!requiredPw) return true;

  const gotPw = req.headers.get("x-admin-password") ?? "";
  if (gotPw !== requiredPw) return false;

  const requiredUser = getAdminUsername();
  if (!requiredUser) return true;

  const gotUser = req.headers.get("x-admin-username") ?? "";
  return gotUser === requiredUser;
};

export const assertAdmin = (req: Request) => {
  const requiredPw = getAdminPassword();
  if (!requiredPw) return;
  if (!isAdminHeaderAuth(req)) {
    const err = new Error("Unauthorized") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
};

export const assertAdminOrToken = async (req: Request, searchParams: URLSearchParams, payload: string) => {
  const requiredPw = getAdminPassword();
  if (!requiredPw) return;
  if (isAdminHeaderAuth(req)) return;

  const token = searchParams.get("token") ?? "";
  if (token && (await verifyAccessToken(payload, token))) return;

  const err = new Error("Unauthorized") as Error & { status?: number };
  err.status = 401;
  throw err;
};
