"use client";

import { useState } from "react";

type TenantProfile = {
  name: string;
  category: string;
  phoneWa: string;
  address: string;
  googleReviewUrl: string;
  latitude: number | null;
  longitude: number | null;
  geofenceRadius: number;
  workStartTime: string;
  planTier: string;
  planStatus: string;
  isActive: boolean;
};

export function AdminTenantProfile({ tenantId, initial }: { tenantId: string; initial: TenantProfile }) {
  const [profile, setProfile] = useState(initial);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/profile`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...profile, latitude: profile.latitude === null ? null : Number(profile.latitude), longitude: profile.longitude === null ? null : Number(profile.longitude), geofenceRadius: Number(profile.geofenceRadius) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Profil toko gagal disimpan.");
      setStatus("Profil, status, dan paket toko berhasil diperbarui.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Profil toko gagal disimpan."); }
    finally { setBusy(false); }
  }

  function field<K extends keyof TenantProfile>(key: K, value: TenantProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  return <form className="admin-card onboarding-form" onSubmit={(event) => void save(event)}>
    <span className="admin-eyebrow">Data operasional</span><h2>Profil, paket & aktivasi</h2>
    <div className="admin-form-grid">
      <div className="admin-field"><label htmlFor="tenant-profile-name">Nama usaha</label><input id="tenant-profile-name" value={profile.name} onChange={(event) => field("name", event.target.value)} required minLength={2} maxLength={100} /></div>
      <div className="admin-field"><label htmlFor="tenant-category">Kategori</label><select id="tenant-category" value={profile.category} onChange={(event) => field("category", event.target.value)}><option value="FNB">Makanan & minuman</option><option value="RETAIL">Retail</option><option value="SERVICE">Jasa</option><option value="CLINIC">Klinik</option><option value="OTHER">Lainnya</option></select></div>
      <div className="admin-field"><label htmlFor="tenant-phone">WhatsApp owner</label><input id="tenant-phone" type="tel" value={profile.phoneWa} onChange={(event) => field("phoneWa", event.target.value)} maxLength={20} /></div>
      <div className="admin-field admin-field-wide"><label htmlFor="tenant-address">Alamat toko</label><textarea id="tenant-address" rows={2} value={profile.address} onChange={(event) => field("address", event.target.value)} maxLength={300} /></div>
      <div className="admin-field admin-field-wide"><label htmlFor="tenant-review-link">Link ulasan Google</label><input id="tenant-review-link" type="url" value={profile.googleReviewUrl} onChange={(event) => field("googleReviewUrl", event.target.value)} maxLength={2000} placeholder="https://..." /></div>
      <div className="admin-field"><label htmlFor="tenant-latitude">Latitude toko</label><input id="tenant-latitude" type="number" min={-90} max={90} step="any" value={profile.latitude ?? ""} onChange={(event) => field("latitude", event.target.value === "" ? null : Number(event.target.value))} /></div>
      <div className="admin-field"><label htmlFor="tenant-longitude">Longitude toko</label><input id="tenant-longitude" type="number" min={-180} max={180} step="any" value={profile.longitude ?? ""} onChange={(event) => field("longitude", event.target.value === "" ? null : Number(event.target.value))} /></div>
      <div className="admin-field"><label htmlFor="tenant-radius">Radius geofence (meter)</label><input id="tenant-radius" type="number" min="20" max="1000" value={profile.geofenceRadius} onChange={(event) => field("geofenceRadius", Number(event.target.value))} required /></div>
      <div className="admin-field"><label htmlFor="tenant-start">Jam mulai kerja</label><input id="tenant-start" type="time" value={profile.workStartTime} onChange={(event) => field("workStartTime", event.target.value)} required /></div>
      <div className="admin-field"><label htmlFor="tenant-plan">Paket layanan</label><select id="tenant-plan" value={profile.planTier} onChange={(event) => field("planTier", event.target.value)}><option value="LARIS">RAI Laris</option><option value="KASIR">RAI Kasir</option><option value="JURAGAN">RAI Juragan</option></select></div>
      <div className="admin-field"><label htmlFor="tenant-plan-status">Status paket</label><select id="tenant-plan-status" value={profile.planStatus} onChange={(event) => field("planStatus", event.target.value)}><option value="TRIAL">Uji coba</option><option value="ACTIVE">Aktif</option><option value="EXPIRED">Kedaluwarsa</option></select></div>
      <label className="branch-store-option admin-field-wide"><input type="checkbox" checked={profile.isActive} onChange={(event) => field("isActive", event.target.checked)} /><span><strong>Toko dapat diakses</strong><small>Nonaktifkan untuk memutus login owner/staff dan menutup portal publik toko.</small></span></label>
    </div>
    {status && <p className={status.includes("berhasil") ? "branch-group-success" : "form-error"} role="status">{status}</p>}
    <button className="button" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan profil toko"}</button>
  </form>;
}
