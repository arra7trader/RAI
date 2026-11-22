import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { PublicQueue } from "@/components/public-queue";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublicQueuePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const store = await getDb().tenant.findUnique({ where: { slug: storeSlug }, select: { id: true, name: true, slug: true, isActive: true } });
  if (!store?.isActive) notFound();
  return <main className="store-page"><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><BrandLogo /></Link><span className="store-nav-name">{store.name}</span><Link className="store-nav-link" href={`/${store.slug}`}>Kembali</Link></div></header><div className="container store-content"><section className="menu-heading"><span className="store-kicker">Antrean digital</span><h1>Antre tanpa menunggu di tempat.</h1><p>Ambil nomor antrean, lalu pantau panggilan di halaman ini.</p></section><PublicQueue storeSlug={store.slug} /></div></main>;
}
