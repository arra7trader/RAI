import { NextRequest } from "next/server";
import { resolveQr } from "@/lib/qr-resolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ qrCodeId: string }> },
) {
  const { qrCodeId } = await context.params;
  return resolveQr(request, qrCodeId);
}
