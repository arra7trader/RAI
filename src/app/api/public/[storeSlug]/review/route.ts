import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const tenant = await getDb().tenant.findUnique({ where: { slug: storeSlug }, select: { id: true, isActive: true, googleReviewUrl: true } });
  if (!tenant?.isActive || !tenant.googleReviewUrl) return NextResponse.redirect(new URL(`/${storeSlug}`, request.nextUrl.origin));
  try {
    await getDb().reviewClick.create({ data: { tenantId: tenant.id } });
  } catch {
    // Keep the customer's review link available when analytics storage is unavailable.
  }
  return NextResponse.redirect(tenant.googleReviewUrl, { headers: { "cache-control": "no-store" } });
}
