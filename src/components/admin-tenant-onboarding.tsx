"use client";

import { useState } from "react";

type UnassignedQr = { id: string; code: string; label: string };
type CreatedCredentials = {
  tenant: { name: string; slug: string };
  qr: { code: string; label: string };
  owner: { name: string; email: string; temporaryPassword: string };
  staff: { name: string; email: string; temporaryPassword: string } | null;
};

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

export function AdminTenantOnboarding({ qrCodes }: { qrCodes: UnassignedQr[] }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [mapsUrl, setMapsUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<CreatedCredentials | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(null);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const latitudeText = String(form.get("latitude") ?? "").trim();
    const longitudeText = String(form.get("longitude") ?? "").trim();
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      slug: String(form.get("slug") ?? "").trim(),
      category: form.get("category"),
      phoneWa: form.get("phoneWa"),
      email: form.get("email"),
      ownerName: form.get("ownerName"),
      staffEmail: form.get("staffEmail"),
      staffName: form.get("staffName"),
      address: form.get("address"),
      googleReviewUrl: form.get("googleReviewUrl"),
      mapsUrl,
      latitude: latitudeText ? Number(latitudeText) : null,
      longitude: longitudeText ? Number(longitudeText) : null,
      planTier: form.get("planTier"),
      qrCodeId: form.get("qrCodeId"),
      workStartTime: form.get("workStartTime"),
    };

    try {
      const response = await fetch("/api/admin/tenants/concierge-onboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Onboarding gagal. Periksa data toko.");
        return;
      }
      setSuccess(result as CreatedCredentials);
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <section className="admin-success-card" role="status">
        <span className="admin-success-mark">✓</span>
        <span className="admin-eyebrow">Toko berhasil dibuat</span>
        <h2>{success.tenant.name} siap dikelola.</h2>
        <p>QR {success.qr.code} aktif dan terhubung ke <code>/{success.tenant.slug}</code>.</p>
        <div className="temporary-credentials">
          <div><strong>Akun owner</strong><span>{success.owner.name} · {success.owner.email}</span><code>{success.owner.temporaryPassword}</code></div>
          {success.staff && <div><strong>Akun kasir</strong><span>{success.staff.name} · {success.staff.email}</span><code>{success.staff.temporaryPassword}</code></div>}
        </div>
        <p className="admin-warning">Simpan kata sandi sementara sekarang dan bagikan lewat saluran aman. Nilai ini tidak akan tampil lagi setelah halaman ditutup.</p>
        <button className="button" onClick={() => window.location.assign("/admin/tenants")} type="button">Lihat daftar toko</button>
      </section>
    );
  }

  return (
    <form className="admin-card onboarding-form" onSubmit={submit}>
      <section className="admin-form-section">
        <div><span className="admin-eyebrow">Profil toko</span><h2>Informasi usaha</h2></div>
        <div className="admin-form-grid">
          <div className="admin-field"><label htmlFor="name">Nama toko *</label><input id="name" name="name" value={name} onChange={(event) => { setName(event.target.value); if (!slugEdited) setSlug(slugify(event.target.value)); }} required minLength={2} maxLength={100} /></div>
          <div className="admin-field"><label htmlFor="slug">Alamat toko *</label><div className="slug-input"><span>rai.id/</span><input id="slug" name="slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} required minLength={2} maxLength={64} /></div><span className="admin-field-help">Gunakan huruf kecil, angka, dan tanda hubung.</span></div>
          <div className="admin-field"><label htmlFor="category">Kategori usaha *</label><select id="category" name="category" defaultValue="FNB"><option value="FNB">Makanan & minuman</option><option value="RETAIL">Retail</option><option value="SERVICE">Jasa</option><option value="CLINIC">Klinik</option><option value="OTHER">Lainnya</option></select></div>
          <div className="admin-field"><label htmlFor="phoneWa">WhatsApp owner *</label><input id="phoneWa" name="phoneWa" type="tel" autoComplete="tel" placeholder="62812…" required minLength={8} maxLength={20} /></div>
          <div className="admin-field admin-field-wide"><label htmlFor="address">Alamat lengkap</label><textarea id="address" name="address" rows={2} maxLength={300} /></div>
          <div className="admin-field admin-field-wide"><label htmlFor="mapsUrl">Tautan lokasi Google Maps</label><input id="mapsUrl" value={mapsUrl} onChange={(event) => setMapsUrl(event.target.value)} placeholder="https://maps.google.com/..." type="url" /></div>
          <div className="admin-field"><label htmlFor="latitude">Latitude</label><input id="latitude" name="latitude" type="number" step="any" min={-90} max={90} placeholder="-6.200000" /></div>
          <div className="admin-field"><label htmlFor="longitude">Longitude</label><input id="longitude" name="longitude" type="number" step="any" min={-180} max={180} placeholder="106.816666" /></div>
          <div className="admin-field admin-field-wide"><label htmlFor="googleReviewUrl">Link ulasan Google</label><input id="googleReviewUrl" name="googleReviewUrl" type="url" placeholder="https://g.page/r/.../review" /></div>
        </div>
      </section>

      <section className="admin-form-section">
        <div><span className="admin-eyebrow">Akun akses</span><h2>Pemilik dan kasir</h2></div>
        <div className="admin-form-grid">
          <div className="admin-field"><label htmlFor="ownerName">Nama owner *</label><input id="ownerName" name="ownerName" autoComplete="name" required minLength={2} maxLength={100} /></div>
          <div className="admin-field"><label htmlFor="email">Email owner *</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
          <div className="admin-field"><label htmlFor="staffName">Nama kasir</label><input id="staffName" name="staffName" autoComplete="name" maxLength={100} /></div>
          <div className="admin-field"><label htmlFor="staffEmail">Email kasir (opsional)</label><input id="staffEmail" name="staffEmail" type="email" autoComplete="off" maxLength={254} /></div>
        </div>
      </section>

      <section className="admin-form-section">
        <div><span className="admin-eyebrow">Aktivasi layanan</span><h2>Paket dan kode QR</h2></div>
        <div className="admin-form-grid">
          <div className="admin-field"><label htmlFor="planTier">Paket layanan *</label><select id="planTier" name="planTier" defaultValue="LARIS"><option value="LARIS">RAI Laris</option><option value="KASIR">RAI Kasir</option><option value="JURAGAN">RAI Juragan</option></select></div>
          <div className="admin-field"><label htmlFor="workStartTime">Jam mulai kerja *</label><input id="workStartTime" name="workStartTime" type="time" defaultValue="09:00" required /></div>
          <div className="admin-field admin-field-wide"><label htmlFor="qrCodeId">QR fisik belum terpakai *</label>
            <select id="qrCodeId" name="qrCodeId" required defaultValue="">
              <option value="" disabled>{qrCodes.length ? "Pilih kode QR" : "Belum ada QR tersedia — buat batch QR dulu"}</option>
              {qrCodes.map((qr) => <option key={qr.id} value={qr.id}>{qr.code} · {qr.label || "Tanpa label"}</option>)}
            </select>
            {!qrCodes.length && <span className="admin-field-help">Buat kode QR di halaman Generator QR sebelum mendaftarkan toko.</span>}
          </div>
        </div>
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="admin-form-actions"><button className="button" type="submit" disabled={isSubmitting || !qrCodes.length}>{isSubmitting ? "Menyiapkan toko…" : "Buat toko & akun"}</button><span className="admin-field-help">Kata sandi sementara dibuat otomatis dan tampil satu kali.</span></div>
    </form>
  );
}
