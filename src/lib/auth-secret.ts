import "server-only";

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (secret && secret.length >= 32 && !secret.startsWith("replace-with-")) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("local-development-only-secret-do-not-deploy");
  }

  throw new Error("Set AUTH_SECRET to a private random value of at least 32 characters.");
}
