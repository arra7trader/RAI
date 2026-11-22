import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { requireUser } from "@/lib/admin-auth";
import { BrandLogo } from "@/components/brand-logo";

export default async function OwnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const owner = await requireUser("OWNER");

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="container admin-topbar-inner">
          <Link className="brand" href="/dashboard"><BrandLogo /><span className="admin-word">OWNER</span></Link>
          <div className="admin-account"><span>{owner.name}</span><AdminLogoutButton redirectTo="/login" /></div>
        </div>
      </header>
      <div className="container admin-layout owner-layout">
        <nav className="admin-nav" aria-label="Navigasi owner"><Link href="/dashboard">Ringkasan</Link><Link href="/dashboard/products">Menu & produk</Link><Link href="/dashboard/reports">Laporan & pelanggan</Link><Link href="/app/pos">POS kasir</Link><Link href="/app/attendance">Absensi tim</Link></nav>
        <main className="admin-main owner-layout-main">{children}</main>
      </div>
    </div>
  );
}
