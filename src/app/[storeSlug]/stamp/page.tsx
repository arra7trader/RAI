import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { BrandLogo } from "@/components/brand-logo";
import { StampCardClient } from "@/components/stamp-card-client";

export const dynamic = "force-dynamic";

export default async function StoreStampPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ card?: string }>;
}) {
  const [{ storeSlug }, query] = await Promise.all([params, searchParams]);
  const store = await getDb().tenant.findUnique({
    where: { slug: storeSlug },
    select: {
      name: true,
      slug: true,
      isActive: true,
      loyaltyProgram: { select: { isActive: true, targetStamps: true, rewardTitle: true, termsText: true } },
    },
  });
  if (!store || !store.isActive) notFound();

  const program = store.loyaltyProgram?.isActive ? store.loyaltyProgram : null;
  const stampSlots = Array.from({ length: Math.min(program?.targetStamps ?? 5, 20) });

  return (
    <main className="store-page">
      <header className="nav"><div className="container nav-inner">
        <Link className="brand" href="/"><BrandLogo /></Link>
        <span className="store-nav-name">{store.name}</span>
        <Link className="store-nav-link" href={`/${store.slug}`}>Kembali</Link>
      </div></header>
      <div className="container store-content">
        <section className="menu-heading"><span className="store-kicker">Program loyalti</span><h1>Kartu stempel {store.name}</h1><p>Daftar tanpa aplikasi dan tunjukkan kartu digital ke kasir.</p></section>
        <StampCardClient storeSlug={store.slug} program={program ? { targetStamps: program.targetStamps, rewardTitle: program.rewardTitle, termsText: program.termsText } : null} cardToken={query.card ?? ""} />
        <footer className="store-footer">Didukung oleh <Link href="/">UMKM Creative by RAI</Link></footer>
      </div>
    </main>
  );
}
