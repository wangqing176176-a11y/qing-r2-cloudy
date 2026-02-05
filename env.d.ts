interface CloudflareEnv {
  [key: string]: unknown;
  BUCKET: R2Bucket;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_TOKEN_SECRET?: string;
  PUBLIC_R2_BASE_URL?: string;
}

// Extend Next.js Edge Runtime types
declare global {
  interface CloudflareEnv {
    [key: string]: unknown;
    BUCKET: R2Bucket;
    ADMIN_USERNAME?: string;
    ADMIN_PASSWORD?: string;
    ADMIN_TOKEN_SECRET?: string;
    PUBLIC_R2_BASE_URL?: string;
  }
}
