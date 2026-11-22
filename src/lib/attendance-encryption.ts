import "server-only";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { getAuthSecret } from "@/lib/auth-secret";

const key = () => createHash("sha256").update(getAuthSecret()).update("rai-attendance-selfies-v1").digest();

export function encryptAttendanceSelfie(dataUrl: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(dataUrl, "utf8"), cipher.final()]);
  return `enc:v1:${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${encrypted.toString("base64url")}`;
}
