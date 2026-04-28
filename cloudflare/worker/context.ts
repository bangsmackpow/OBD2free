export class Context {
  constructor(public env: Env) {}

  // Database queries
  async query(sql: string, params?: any[]): Promise<D1Result> {
    return this.env.DB.prepare(sql).bind(...(params || [])).all();
  }

  async exec(sql: string, params?: any[]): Promise<D1Result> {
    return this.env.DB.prepare(sql).bind(...(params || [])).run();
  }

  // R2 operations
  async getR2Object(key: string): Promise<R2Object | null> {
    try {
      return await this.env.LOGS_BUCKET.get(key);
    } catch {
      return null;
    }
  }

  async putR2Object(key: string, body: ReadableStream<Uint8Array> | Blob, size?: number): Promise<void> {
    await this.env.LOGS_BUCKET.put(key, body, {
      httpMetadata: {
        contentType: 'text/csv',
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

  async setCache(key: string, value: string, ttl: number = 3600): Promise<void> {
    await this.env.CACHE.put(key, value, {expirationTtl: ttl});
  }

  async deleteCache(key: string): Promise<void> {
    await this.env.CACHE.delete(key);
  }

  // Generate presigned URL for direct R2 upload
  async generatePresignedUrl(sessionId: string, filename: string, contentType: string = 'text/csv', expiry: number = 3600): Promise<string> {
    const key = `sessions/${sessionId}/${filename}`;

    // Get bucket endpoint
    const bucket = this.env.LOGS_BUCKET;
    const endpoint = bucket.endpoint; // e.g., https://bucket.account.r2.cloudflarestorage.com

    // Generate presigned URL using Cloudflare API (requires R2 secret access)
    // This is simplified - in production use @cloudflare/kv-asset-handler or proper signing
    const expires = Math.floor(Date.now() / 1000) + expiry;

    // Note: Cloudflare R2 doesn't have native presigned URLs like S3.
    // Instead we route through worker or use R2 public bucket.
    // For MVP we'll keep bucket private and upload via worker route /api/upload/:sessionId
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
  results: any[];
  success: boolean;
  meta?: any;
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
