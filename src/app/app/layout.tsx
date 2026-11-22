import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { requireTenantWorker } from "@/lib/admin-auth";
import { BrandLogo } from "@/components/brand-logo";

export default async function StaffLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const staff = await requireTenantWorker();

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="container admin-topbar-inner">
          <Link className="brand" href={staff.role === "OWNER" ? "/dashboard" : "/app"}><BrandLogo /><span className="admin-word">{staff.role === "OWNER" ? "OWNER" : "KASIR"}</span></Link>
          <div className="admin-account"><span>{staff.name}</span><AdminLogoutButton redirectTo="/login" /></div>
        </div>
      </header>
      <div className="container admin-layout staff-shell">
        <nav className="admin-nav" aria-label="Navigasi kasir"><Link href="/app">Ringkasan</Link><Link href="/app/pos">POS & kas</Link><Link href="/app/queue">Antrean</Link><Link href="/app/stamps">Stempel</Link><Link href="/app/attendance">Absensi</Link></nav>
        <main className="admin-main owner-layout-main">{children}</main>
      </div>
    </div>
  );
}
