import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getAuthSecret } from "@/lib/auth-secret";

export const VISITOR_COOKIE_NAME = "rai_visitor";
export const VISIT_COOLDOWN_MS = 3 * 60 * 60 * 1000;

function getSigningSecret() {
  return getAuthSecret();
}

function sign(visitorId: string) {
  return createHmac("sha256", getSigningSecret()).update(visitorId).digest("base64url");
}

export function createVisitorCookieValue() {
  const visitorId = randomUUID();
  return `${visitorId}.${sign(visitorId)}`;
}

export function getVisitorId(cookieValue: string | undefined) {
  if (!cookieValue) return null;

  const separator = cookieValue.lastIndexOf(".");
  if (separator < 0) return null;

  const visitorId = cookieValue.slice(0, separator);
  const signature = cookieValue.slice(separator + 1);
  if (!/^[0-9a-f-]{36}$/i.test(visitorId) || !signature) return null;

  const expected = Buffer.from(sign(visitorId));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  return visitorId;
}
