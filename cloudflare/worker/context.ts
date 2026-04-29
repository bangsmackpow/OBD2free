export class Context {
  constructor(public env: Env) {}

  // Database queries
  async query(sql: string, params?: unknown[]): Promise<D1Result> {
    return this.env.DB.prepare(sql)
      .bind(...(params || []))
      .all();
  }

  async exec(sql: string, params?: unknown[]): Promise<D1Result> {
    return this.env.DB.prepare(sql)
      .bind(...(params || []))
      .run();
  }

  // R2 operations
  async getR2Object(key: string): Promise<R2Object | null> {
    try {
      return await this.env.LOGS_BUCKET.get(key);
    } catch {
      return null;
    }
  }

  async putR2Object(
    key: string,
    body: ReadableStream<Uint8Array> | Blob,
  ): Promise<void> {
    await this.env.LOGS_BUCKET.put(key, body, {
      httpMetadata: {
        contentType: "text/csv",
        cacheControlMaxAge: 86400, // 1 day
      },
      customMetadata: {
        uploadDate: new Date().toISOString(),
      },
    });
  }

  async deleteR2Object(key: string): Promise<void> {
    await this.env.LOGS_BUCKET.delete(key);
  }

  // KV cache operations
  async getCache(key: string): Promise<string | null> {
    return this.env.CACHE.get(key);
  }

  async setCache(
    key: string,
    value: string,
    ttl: number = 3600,
  ): Promise<void> {
    await this.env.CACHE.put(key, value, { expirationTtl: ttl });
  }

  async deleteCache(key: string): Promise<void> {
    await this.env.CACHE.delete(key);
  }

  async generatePresignedUrl(
    sessionId: string,
    filename: string,
  ): Promise<string> {
    const key = `sessions/${sessionId}/${filename}`;
    const bucket = this.env.LOGS_BUCKET;
    const endpoint = bucket.endpoint;
    return `${endpoint}/${key}`;
  }
}

// Types
interface Env {
  LOGS_BUCKET: R2Bucket;
  DB: D1Database;
  CACHE: KVNamespace;
}

interface D1Result {
  results: unknown[];
  success: boolean;
  meta?: unknown;
}

interface R2Object {
  body: ReadableStream<Uint8Array> | null;
  size: number | null;
  httpMetadata: {
    contentType?: string;
    cacheControlMaxAge?: number;
  } | null;
  customMetadata: Record<string, string>;
}
