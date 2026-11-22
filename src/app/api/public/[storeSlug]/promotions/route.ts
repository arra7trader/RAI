import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const now = new Date();
  const campaigns = await getDb().promotionCampaign.findMany({
    where: { tenant: { slug: storeSlug, isActive: true }, isActive: true, validUntil: { gt: now } },
    orderBy: { validUntil: "asc" }, take: 20,
    select: { id: true, title: true, discountType: true, discountValue: true, minimumPurchase: true, quota: true, claimedCount: true, validUntil: true, freeProduct: { select: { name: true, isAvailable: true } } },
  });
  return NextResponse.json({ campaigns: campaigns.filter((campaign) => campaign.claimedCount < campaign.quota && (campaign.discountType !== "FREE_ITEM" || campaign.freeProduct?.isAvailable)) }, { headers: { "cache-control": "no-store" } });
}
