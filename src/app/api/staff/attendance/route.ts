import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantWorkerFromCookie } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { encryptAttendanceSelfie } from "@/lib/attendance-encryption";

export const runtime = "nodejs";
const schema = z.object({ action: z.enum(["CHECK_IN", "CHECK_OUT"]), latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180), selfie: z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/).max(1_500_000) });
function dateKey() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function distanceInMeters(aLat: number, aLon: number, bLat: number, bLon: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(bLat - aLat); const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
}

export async function GET() {
  const user = await getTenantWorkerFromCookie();
  if (!user?.tenantId) return NextResponse.json({ error: "Sesi toko tidak valid." }, { status: 401 });
  const db = getDb();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await db.attendance.updateMany({ where: { tenantId: user.tenantId, checkInAt: { lt: cutoff } }, data: { checkInSelfieData: "", checkOutSelfieData: null } }).catch(() => undefined);
  const [tenant, attendance] = await Promise.all([
    db.tenant.findUnique({ where: { id: user.tenantId }, select: { name: true, latitude: true, longitude: true, geofenceRadius: true } }),
    db.attendance.findUnique({ where: { tenantId_userId_dayKey: { tenantId: user.tenantId, userId: user.id, dayKey: dateKey() } }, select: { id: true, checkInAt: true, checkOutAt: true, checkInDistance: true, checkOutDistance: true } }),
  ]);
  return NextResponse.json({ tenant, attendance }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await getTenantWorkerFromCookie();
  if (!user?.tenantId) return NextResponse.json({ error: "Sesi toko tidak valid." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Aktifkan lokasi dan ambil selfie sebelum mengirim absensi." }, { status: 400 });
  const db = getDb(); const tenantId = user.tenantId; const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { latitude: true, longitude: true, geofenceRadius: true } });
  if (!tenant || tenant.latitude === null || tenant.longitude === null) return NextResponse.json({ error: "Koordinat toko belum disiapkan. Hubungi owner atau Tim RAI." }, { status: 409 });
  const distance = distanceInMeters(tenant.latitude, tenant.longitude, parsed.data.latitude, parsed.data.longitude);
  if (distance > tenant.geofenceRadius) return NextResponse.json({ error: `Lokasi berada ${distance} m dari toko. Batas absensi ${tenant.geofenceRadius} m.` }, { status: 403 });
  const now = new Date(); const dayKey = dateKey();
  const expectedPrefix = "data:image/jpeg;base64,";
  if (!parsed.data.selfie.startsWith(expectedPrefix)) return NextResponse.json({ error: "Foto harus dikirim sebagai JPEG." }, { status: 400 });
  const selfieBytes = Buffer.from(parsed.data.selfie.slice(expectedPrefix.length), "base64");
  if (selfieBytes.length > 1_000_000 || selfieBytes.length < 100) return NextResponse.json({ error: "Selfie terlalu besar atau tidak valid." }, { status: 413 });
  const encryptedSelfie = encryptAttendanceSelfie(parsed.data.selfie);
  try {
    if (parsed.data.action === "CHECK_IN") {
      const attendance = await db.attendance.create({ data: { tenantId, userId: user.id, dayKey, checkInLatitude: parsed.data.latitude, checkInLongitude: parsed.data.longitude, checkInDistance: distance, checkInSelfieAt: now, checkInSelfieData: encryptedSelfie } });
      return NextResponse.json({ ok: true, attendance: { id: attendance.id, checkInAt: attendance.checkInAt, checkOutAt: attendance.checkOutAt, checkInDistance: attendance.checkInDistance } }, { status: 201 });
    }
    const attendance = await db.attendance.findUnique({ where: { tenantId_userId_dayKey: { tenantId, userId: user.id, dayKey } }, select: { id: true, checkOutAt: true } });
    if (!attendance || attendance.checkOutAt) return NextResponse.json({ error: "Check-in belum ada atau absensi sudah ditutup." }, { status: 409 });
    const updated = await db.attendance.updateMany({ where: { id: attendance.id, tenantId, userId: user.id, checkOutAt: null }, data: { checkOutAt: now, checkOutLatitude: parsed.data.latitude, checkOutLongitude: parsed.data.longitude, checkOutDistance: distance, checkOutSelfieAt: now, checkOutSelfieData: encryptedSelfie } });
    if (!updated.count) return NextResponse.json({ error: "Absensi sudah berubah. Muat ulang halaman." }, { status: 409 });
    return NextResponse.json({ ok: true, message: "Check-out tersimpan.", distance });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "Check-in hari ini sudah tersimpan." }, { status: 409 });
    return NextResponse.json({ error: "Absensi belum tersimpan." }, { status: 503 });
  }
}
