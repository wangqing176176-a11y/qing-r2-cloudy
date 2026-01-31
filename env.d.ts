interface CloudflareEnv {
  [key: string]: unknown;
  BUCKET: R2Bucket;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}

// 扩展 Next.js 的 Edge Runtime 类型
declare global {
  interface CloudflareEnv {
    [key: string]: unknown;
    BUCKET: R2Bucket;
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
  }
}
