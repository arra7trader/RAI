import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { tenantOnboardingSchema } from "@/lib/admin-schemas";
import { getAdminUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

function extractCoordinates(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const queryCoordinates = url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";
    const queryMatch = queryCoordinates.match(/(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/);
    const pathMatch = decodeURIComponent(url.pathname + url.hash).match(/@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/);
    const dataMatch = (url.pathname + url.hash).match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
    const match = dataMatch ?? pathMatch ?? queryMatch;
    if (!match) return null;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

function generatePassword() {
  return randomBytes(18).toString("base64url");
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = tenantOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Periksa kembali data toko." },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const coordinates = data.mapsUrl ? extractCoordinates(data.mapsUrl) : null;
    const latitude = data.latitude ?? coordinates?.latitude ?? null;
    const longitude = data.longitude ?? coordinates?.longitude ?? null;
    if ((latitude === null) !== (longitude === null)) {
      return NextResponse.json({ error: "Latitude dan longitude harus diisi bersama." }, { status: 400 });
    }
    if (data.mapsUrl && !coordinates && (latitude === null || longitude === null)) {
      return NextResponse.json(
        { error: "Koordinat tidak ditemukan dari tautan peta. Isi latitude dan longitude." },
        { status: 400 },
      );
    }

    const db = getDb();
    const qr = await db.qrCode.findUnique({ where: { id: data.qrCodeId } });
    if (!qr || qr.status !== "UNASSIGNED" || qr.tenantId) {
      return NextResponse.json({ error: "QR tidak lagi tersedia. Muat ulang lalu pilih QR lain." }, { status: 409 });
    }

    const ownerPassword = generatePassword();
    const staffPassword = data.staffEmail ? generatePassword() : null;
    const [ownerPasswordHash, staffPasswordHash] = await Promise.all([
      hash(ownerPassword, 12),
      staffPassword ? hash(staffPassword, 12) : Promise.resolve(null),
    ]);

    const tenant = await db.$transaction(async (transaction) => {
      const reservedQr = await transaction.qrCode.updateMany({
        where: { id: qr.id, status: "UNASSIGNED", tenantId: null },
        data: { status: "RESERVED" },
      });

      if (reservedQr.count !== 1) {
        throw new Error("QR_ALREADY_ASSIGNED");
      }

      const created = await transaction.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          category: data.category,
          phoneWa: data.phoneWa.replace(/\D/g, ""),
          address: data.address,
          latitude,
          longitude,
          googleReviewUrl: data.googleReviewUrl,
          planTier: data.planTier,
          planStatus: "TRIAL",
          activeQrMode: "DEFAULT_HUB",
          dailyStaffPinHash: await hash(randomBytes(4).toString("hex").slice(0, 4), 12),
          workStartTime: data.workStartTime,
          managedByRai: true,
          users: {
            create: [
              { name: data.ownerName, email: data.email, passwordHash: ownerPasswordHash, role: "OWNER" },
              ...(data.staffEmail && staffPasswordHash
                ? [{ name: data.staffName, email: data.staffEmail, passwordHash: staffPasswordHash, role: "STAFF" }]
                : []),
            ],
          },
          loyaltyProgram: { create: { isActive: false } },
        },
        select: { id: true, name: true, slug: true },
      });

      await transaction.qrCode.update({
        where: { id: qr.id },
        data: { status: "ACTIVE", label: data.name, tenantId: created.id },
      });

      return created;
    });

    return NextResponse.json(
      {
        tenant,
        qr: { code: qr.code, label: data.name },
        owner: { name: data.ownerName, email: data.email, temporaryPassword: ownerPassword },
        ownerLoginUrl: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/login`,
        staff: data.staffEmail
          ? { name: data.staffName, email: data.staffEmail, temporaryPassword: staffPassword }
          : null,
      },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Slug atau alamat email sudah dipakai." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "QR_ALREADY_ASSIGNED") {
      return NextResponse.json({ error: "QR tidak lagi tersedia. Muat ulang lalu pilih QR lain." }, { status: 409 });
    }
    return NextResponse.json({ error: "Onboarding toko gagal. Data belum disimpan." }, { status: 503 });
  }
}
