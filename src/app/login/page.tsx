import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RoleLoginForm } from "@/components/role-login-form";
import { BrandLogo } from "@/components/brand-logo";
import { AUTH_SESSION_COOKIE, getAuthenticatedUserFromToken } from "@/lib/admin-auth";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const user = await getAuthenticatedUserFromToken(cookieStore.get(AUTH_SESSION_COOKIE)?.value);
  if (user?.role === "OWNER") redirect("/dashboard");
  if (user?.role === "STAFF") redirect("/app");

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="brand" href="/"><BrandLogo /></Link>
        <span className="admin-eyebrow">Owner & staff</span>
        <h1>Masuk ke toko.</h1>
        <p>Gunakan akun yang dibuat oleh Tim RAI.</p>
        <RoleLoginForm />
        <Link className="admin-back-link" href="/">Kembali ke beranda</Link>
      </section>
    </main>
  );
}
