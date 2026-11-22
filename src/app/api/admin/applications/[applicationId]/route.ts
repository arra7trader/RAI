import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { applicationDecisionSchema } from "@/lib/application-schemas";
import { getAdminUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { coordinatesFromGoogleMaps } from "@/lib/maps-coordinates";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });

  const { applicationId } = await params;
  const parsed = applicationDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Keputusan tidak valid." }, { status: 400 });
  const decision = parsed.data;

  const db = getDb();
  try {
    if (decision.decision === "REJECT") {
      const result = await db.storeApplication.updateMany({
        where: { id: applicationId, status: "PENDING" },
        data: { status: "REJECTED", reviewNote: decision.note, reviewedAt: new Date() },
      });
      if (result.count !== 1) return NextResponse.json({ error: "Pengajuan tidak ditemukan atau sudah ditinjau." }, { status: 409 });
      return NextResponse.json({ ok: true, message: "Pengajuan ditolak." });
    }

    if (decision.decision !== "APPROVE") return NextResponse.json({ error: "Keputusan tidak valid." }, { status: 400 });
    const application = await db.storeApplication.findUnique({ where: { id: applicationId } });
    if (!application || application.status !== "PENDING") return NextResponse.json({ error: "Pengajuan tidak ditemukan atau sudah ditinjau." }, { status: 409 });
    const qr = await db.qrCode.findUnique({ where: { id: decision.qrCodeId } });
    if (!qr || qr.status !== "UNASSIGNED" || qr.tenantId) return NextResponse.json({ error: "QR tidak lagi tersedia. Muat ulang daftar." }, { status: 409 });

    const ownerPassword = randomBytes(18).toString("base64url");
    const staffPassword = application.staffEmail ? randomBytes(18).toString("base64url") : null;
    const [ownerHash, staffHash, staffPinHash] = await Promise.all([
      hash(ownerPassword, 12),
      staffPassword ? hash(staffPassword, 12) : Promise.resolve(null),
      hash(randomBytes(4).toString("hex").slice(0, 4), 12),
    ]);
    const coordinates = coordinatesFromGoogleMaps(application.mapsUrl);

    const created = await db.$transaction(async (tx) => {
      const pending = await tx.storeApplication.updateMany({
        where: { id: application.id, status: "PENDING" },
        data: { status: "APPROVED", slug: decision.slug, reviewedAt: new Date(), reviewNote: "Disetujui oleh Super Admin." },
      });
      if (pending.count !== 1) throw new Error("APPLICATION_ALREADY_REVIEWED");
      const reserved = await tx.qrCode.updateMany({ where: { id: qr.id, status: "UNASSIGNED", tenantId: null }, data: { status: "RESERVED" } });
      if (reserved.count !== 1) throw new Error("QR_ALREADY_ASSIGNED");
      const tenant = await tx.tenant.create({
        data: {
          name: application.businessName,
          slug: decision.slug,
          category: application.category,
          phoneWa: application.phoneWa,
          address: application.address,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          googleReviewUrl: application.googleReviewUrl,
          planTier: application.planTier,
          planStatus: "TRIAL",
          isActive: true,
          dailyStaffPinHash: staffPinHash,
          users: { create: [
            { name: application.ownerName, email: application.ownerEmail, passwordHash: ownerHash, role: "OWNER" },
            ...(application.staffEmail && application.staffName && staffHash ? [{ name: application.staffName, email: application.staffEmail, passwordHash: staffHash, role: "STAFF" }] : []),
          ] },
          loyaltyProgram: { create: { isActive: false } },
        },
        select: { id: true, name: true, slug: true },
      });
      await tx.qrCode.update({ where: { id: qr.id }, data: { tenantId: tenant.id, status: "ACTIVE", label: tenant.name } });
      await tx.storeApplication.update({ where: { id: application.id }, data: { tenantId: tenant.id } });
      return tenant;
    });

    return NextResponse.json({
      ok: true,
      tenant: created,
      owner: { email: application.ownerEmail, password: ownerPassword },
      staff: application.staffEmail && staffPassword ? { email: application.staffEmail, password: staffPassword } : null,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/login`,
    }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "QR_ALREADY_ASSIGNED") return NextResponse.json({ error: "QR tidak lagi tersedia. Muat ulang daftar." }, { status: 409 });
    if (error instanceof Error && error.message === "APPLICATION_ALREADY_REVIEWED") return NextResponse.json({ error: "Pengajuan sudah ditinjau." }, { status: 409 });
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "Email, slug, atau data unik sudah digunakan. Periksa toko yang sudah terdaftar." }, { status: 409 });
    return NextResponse.json({ error: "Proses aktivasi gagal; perubahan transaksi dibatalkan." }, { status: 503 });
  }
}
