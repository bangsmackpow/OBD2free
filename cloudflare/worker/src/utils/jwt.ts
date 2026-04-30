function base64UrlEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

export async function createJWT(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 86400,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };

  const encoder = new TextEncoder();
  const headerEnc = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const bodyEnc = base64UrlEncode(encoder.encode(JSON.stringify(body)));
  const data = `${headerEnc}.${bodyEnc}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  return `${data}.${base64UrlEncode(sig)}`;
}

export async function verifyJWT(
  token: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [, bodyEnc, sigEnc] = parts;
    const headerEnc = parts[0];

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(sigEnc),
      encoder.encode(`${headerEnc}.${bodyEnc}`),
    );

    if (!valid) return null;

    const body = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(bodyEnc)),
    );

    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;

    return body;
  } catch {
    return null;
  }
}
