import { verifyJWT } from "../utils";
import type { Env } from "../types";

export interface AuthPayload {
  sub: string;
  email: string;
  role: string;
  premium_level: string;
}

export async function authenticate(
  request: Request,
  env: Env,
): Promise<AuthPayload | null> {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return null;

  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as string,
    premium_level: payload.premium_level as string,
  };
}

export function requireAdmin(payload: AuthPayload | null): boolean {
  return payload?.role === "admin";
}

export function requirePremium(payload: AuthPayload | null): boolean {
  if (!payload) return false;
  if (payload.role === "admin") return true;
  if (payload.premium_level === "lifetime") return true;
  if (payload.premium_level === "premium") return true;
  return false;
}
