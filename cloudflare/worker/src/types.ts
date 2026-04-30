export type Env = {
  DB: D1Database;
  LOGS_BUCKET: R2Bucket;
  DOCS_BUCKET: R2Bucket;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
};

export type User = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: "user" | "admin";
  premium_level: "free" | "premium" | "lifetime";
  premium_expiry: number | null;
  created_at: string;
  updated_at: string;
};
