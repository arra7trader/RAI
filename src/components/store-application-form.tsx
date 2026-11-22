"use client";

import { useState } from "react";

const initial = { businessName: "", ownerName: "", ownerEmail: "", category: "FNB", phoneWa: "", address: "", mapsUrl: "", googleReviewUrl: "", planTier: "LARIS", staffName: "", staffEmail: "", dataConsent: true };

export function StoreApplicationForm() {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function update(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Pengajuan gagal dikirim.");
      setSuccess(result.message || "Pengajuan diterima."); setForm(initial);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Pengajuan gagal dikirim."); }
    finally { setBusy(false); }
  }

  if (success) return <section className="admin-success-card"><span className="admin-success-mark">✓</span><span className="admin-eyebrow">Pengajuan diterima</span><h2>Terima kasih.</h2><p>{success}</p><button className="button secondary" type="button" onClick={() => setSuccess("")}>Kirim pengajuan lain</button></section>;

  return <form className="admin-card onboarding-form" onSubmit={submit}>
    <section className="admin-form-section"><div><span className="admin-eyebrow">Profil usaha</span><h2>Tentang toko Anda</h2></div><div className="admin-form-grid">
      <div className="admin-field"><label htmlFor="businessName">Nama usaha *</label><input id="businessName" name="businessName" value={form.businessName} onChange={update} required minLength={2} maxLength={100} /></div>
      <div className="admin-field"><label htmlFor="category">Kategori *</label><select id="category" name="category" value={form.category} onChange={update}><option value="FNB">Kuliner</option><option value="RETAIL">Retail</option><option value="SERVICE">Jasa</option><option value="CLINIC">Klinik</option><option value="OTHER">Lainnya</option></select></div>
      <div className="admin-field admin-field-wide"><label htmlFor="address">Alamat lengkap toko *</label><textarea id="address" name="address" value={form.address} onChange={update} required rows={2} maxLength={300} /></div>
      <div className="admin-field"><label htmlFor="mapsUrl">Tautan Google Maps</label><input id="mapsUrl" name="mapsUrl" type="url" value={form.mapsUrl} onChange={update} placeholder="https://maps.app.goo.gl/..." /></div>
      <div className="admin-field"><label htmlFor="googleReviewUrl">Tautan ulasan Google</label><input id="googleReviewUrl" name="googleReviewUrl" type="url" value={form.googleReviewUrl} onChange={update} placeholder="https://g.page/r/..." /></div>
      <div className="admin-field"><label htmlFor="planTier">Paket yang diminati *</label><select id="planTier" name="planTier" value={form.planTier} onChange={update}><option value="LARIS">RAI Laris</option><option value="KASIR">RAI Kasir</option><option value="JURAGAN">RAI Juragan</option></select><span className="admin-field-help">Pilihan ini belum mengaktifkan langganan atau biaya.</span></div>
    </div></section>
    <section className="admin-form-section"><div><span className="admin-eyebrow">Kontak</span><h2>Pemilik usaha</h2></div><div className="admin-form-grid">
      <div className="admin-field"><label htmlFor="ownerName">Nama pemilik *</label><input id="ownerName" name="ownerName" value={form.ownerName} onChange={update} required minLength={2} maxLength={100} /></div>
      <div className="admin-field"><label htmlFor="ownerEmail">Email pemilik *</label><input id="ownerEmail" name="ownerEmail" type="email" value={form.ownerEmail} onChange={update} required maxLength={254} /></div>
      <div className="admin-field admin-field-wide"><label htmlFor="phoneWa">Nomor WhatsApp *</label><input id="phoneWa" name="phoneWa" type="tel" value={form.phoneWa} onChange={update} required minLength={8} maxLength={20} placeholder="628..." /></div>
    </div></section>
    <section className="admin-form-section"><div><span className="admin-eyebrow">Opsional</span><h2>Akun kasir</h2></div><div className="admin-form-grid">
      <div className="admin-field"><label htmlFor="staffName">Nama kasir</label><input id="staffName" name="staffName" value={form.staffName} onChange={update} maxLength={100} /></div>
      <div className="admin-field"><label htmlFor="staffEmail">Email kasir</label><input id="staffEmail" name="staffEmail" type="email" value={form.staffEmail} onChange={update} maxLength={254} /></div>
    </div></section>
    <label className="application-consent"><input name="dataConsent" type="checkbox" checked={form.dataConsent} onChange={(event) => setForm({ ...form, dataConsent: event.target.checked })} required /><span>Saya setuju data kontak dan usaha ini digunakan Tim RAI untuk meninjau dan menyiapkan pengajuan aktivasi toko.</span></label>
    {error && <p className="form-error">{error}</p>}
    <div className="admin-form-actions"><button className="button" type="submit" disabled={busy}>{busy ? "Mengirim…" : "Kirim untuk ditinjau"}</button><span className="admin-field-help">Data digunakan untuk meninjau dan menyiapkan toko Anda.</span></div>
  </form>;
}
