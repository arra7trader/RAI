import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validOptionalUrl = z.string().trim().max(2000).transform((value, context) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("Unsupported protocol");
    return url.toString();
  } catch {
    context.addIssue({ code: "custom", message: "Gunakan URL HTTPS yang valid." });
    return z.NEVER;
  }
});

export const qrBatchSchema = z.object({
  quantity: z.number().int().min(1).max(100),
  labelPrefix: z.string().trim().max(40).default("QR Baru"),
});

export const tenantOnboardingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(64).regex(slugPattern, "Slug gunakan huruf kecil, angka, dan tanda hubung."),
  category: z.enum(["FNB", "RETAIL", "SERVICE", "CLINIC", "OTHER"]),
  phoneWa: z.string().trim().regex(/^\+?[0-9\s()-]{8,20}$/, "Masukkan nomor telepon yang valid."),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  ownerName: z.string().trim().min(2).max(100),
  staffEmail: z.union([z.string().trim().max(254).email(), z.literal("")]).transform((value) => value.toLowerCase()),
  staffName: z.string().trim().max(100).default(""),
  address: z.string().trim().max(300).default(""),
  googleReviewUrl: validOptionalUrl,
  mapsUrl: validOptionalUrl,
  latitude: z.number().finite().min(-90).max(90).nullable().default(null),
  longitude: z.number().finite().min(-180).max(180).nullable().default(null),
  planTier: z.enum(["LARIS", "KASIR", "JURAGAN"]),
  qrCodeId: z.string().uuid(),
  workStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("09:00"),
}).refine((values) => !values.staffEmail || values.staffName.length >= 2, {
  path: ["staffName"],
  message: "Nama staff wajib diisi jika email kasir digunakan.",
});
