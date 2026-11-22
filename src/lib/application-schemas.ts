import { z } from "zod";

const optionalHttpsUrl = z.string().trim().max(2000).default("").transform((value, context) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("Unsupported protocol");
    return url.toString();
  } catch {
    context.addIssue({ code: "custom", message: "Tautan harus menggunakan HTTPS." });
    return z.NEVER;
  }
});

export const storeApplicationSchema = z.object({
  businessName: z.string().trim().min(2).max(100),
  ownerName: z.string().trim().min(2).max(100),
  ownerEmail: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  category: z.enum(["FNB", "RETAIL", "SERVICE", "CLINIC", "OTHER"]),
  phoneWa: z.string().trim().regex(/^\+?[0-9\s()-]{8,20}$/),
  address: z.string().trim().max(300).default(""),
  mapsUrl: optionalHttpsUrl,
  googleReviewUrl: optionalHttpsUrl,
  planTier: z.enum(["LARIS", "KASIR", "JURAGAN"]).default("LARIS"),
  staffName: z.string().trim().max(100).default(""),
  staffEmail: z.union([z.string().trim().email().max(254), z.literal("")]).default("").transform((value) => value.toLowerCase()),
  dataConsent: z.literal(true),
}).refine((data) => !data.staffEmail || data.staffName.length >= 2, {
  path: ["staffName"],
  message: "Isi nama staff jika email kasir dicantumkan.",
});

export const applicationDecisionSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("APPROVE"),
    qrCodeId: z.string().uuid(),
    slug: z.string().trim().min(2).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
  z.object({ decision: z.literal("REJECT"), note: z.string().trim().max(500).default("") }),
]);
