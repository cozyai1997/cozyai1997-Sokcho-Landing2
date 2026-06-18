import type { VercelRequest, VercelResponse } from "./_supabase.js";

const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "a1234!";

function getHeader(request: VercelRequest, name: string) {
  const headers = request.headers ?? {};
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function hasValidAdminAuth(request: VercelRequest) {
  const authorization = getHeader(request, "authorization");
  const expected = `Basic ${Buffer.from(`${adminUsername}:${adminPassword}`, "utf-8").toString("base64")}`;
  return authorization === expected;
}

export function requireAdminAuth(request: VercelRequest, response: VercelResponse) {
  if (hasValidAdminAuth(request)) {
    return true;
  }

  response.setHeader("WWW-Authenticate", "Basic realm=\"Sokcho Admin\"");
  response.status(401).json({ message: "관리자 로그인이 필요합니다." });
  return false;
}
