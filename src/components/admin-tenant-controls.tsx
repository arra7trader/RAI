"use client";

import { useState } from "react";

const qrModes = [
  { value: "DEFAULT_HUB", label: "Portal utama toko" },
  { value: "MENU_ORDER", label: "Langsung ke katalog" },
  { value: "REVIEW_FOCUS", label: "Portal dan tautan ulasan" },
  { value: "CLOSED_STORE", label: "Info toko tutup sementara" },
];

export function AdminQrModeSettings({ tenantId, initialMode }: { tenantId: string; initialMode: string }) {
  const [mode, setMode] = useState(initialMode);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/qr-mode`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tujuan QR gagal diperbarui.");
      setStatus("Tujuan QR berhasil diperbarui. QR fisik tidak perlu dicetak ulang.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Tujuan QR gagal diperbarui."); }
    finally { setBusy(false); }
  }

  return <form className="admin-card onboarding-form" onSubmit={(event) => void save(event)}>
    <span className="admin-eyebrow">QR dinamis</span><h2>Tujuan scan</h2>
    <div className="admin-field"><label htmlFor="qr-mode">Tampilan pelanggan</label><select id="qr-mode" value={mode} onChange={(event) => setMode(event.target.value)}>{qrModes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></div>
    <p className="admin-field-help">Owner dan staff yang sudah login tetap diarahkan ke panel sesuai peran.</p>
    {status && <p className={status.startsWith("Tujuan QR berhasil") ? "branch-group-success" : "form-error"} role="status">{status}</p>}
    <button className="button" type="submit" disabled={busy || mode === initialMode}>{busy ? "Menyimpan…" : "Simpan tujuan QR"}</button>
  </form>;
}

export function AdminLoyaltySettings({ tenantId, initial }: { tenantId: string; initial: { isActive: boolean; targetStamps: number; rewardTitle: string; termsText: string; rewardDiscount: number } | null }) {
  const [isActive, setIsActive] = useState(Boolean(initial?.isActive && initial.rewardDiscount > 0));
  const [targetStamps, setTargetStamps] = useState(String(initial?.targetStamps ?? 5));
  const [rewardTitle, setRewardTitle] = useState(initial?.rewardTitle ?? "");
  const [termsText, setTermsText] = useState(initial?.termsText ?? "");
  const [rewardDiscount, setRewardDiscount] = useState(String(initial?.rewardDiscount ?? 0));
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/loyalty`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive, targetStamps: Number(targetStamps), rewardTitle, termsText, rewardDiscount: Number(rewardDiscount) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Program loyalti gagal disimpan.");
      setStatus(isActive ? "Program stempel dan hadiah berhasil diaktifkan." : "Program loyalti berhasil dinonaktifkan.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Program loyalti gagal disimpan."); }
    finally { setBusy(false); }
  }

  return <form className="admin-card onboarding-form" onSubmit={(event) => void save(event)}>
    <span className="admin-eyebrow">Loyalti & voucher hadiah</span><h2>Program stempel toko</h2>
    <label className="branch-store-option"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /><span><strong>Aktifkan program</strong><small>Pelanggan dapat membuat kartu dan kasir bisa memberi stempel.</small></span></label>
    <div className="admin-form-grid">
      <div className="admin-field"><label htmlFor="loyalty-target">Stempel untuk menukar hadiah</label><input id="loyalty-target" type="number" min="2" max="20" value={targetStamps} onChange={(event) => setTargetStamps(event.target.value)} required /></div>
      <div className="admin-field"><label htmlFor="loyalty-discount">Nilai potongan hadiah (Rp)</label><input id="loyalty-discount" type="number" min="0" max="100000000" step="1" value={rewardDiscount} onChange={(event) => setRewardDiscount(event.target.value)} required /></div>
      <div className="admin-field admin-field-wide"><label htmlFor="loyalty-title">Nama hadiah</label><input id="loyalty-title" value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} minLength={2} maxLength={120} required /></div>
      <div className="admin-field admin-field-wide"><label htmlFor="loyalty-terms">Syarat hadiah</label><textarea id="loyalty-terms" rows={3} value={termsText} onChange={(event) => setTermsText(event.target.value)} maxLength={600} /></div>
    </div>
    {isActive && Number(rewardDiscount) < 1 && <p className="admin-warning">Isi nominal potongan minimal Rp1 sebelum mengaktifkan hadiah. Voucher Rp0 tidak dapat ditebus.</p>}
    {status && <p className={status.includes("berhasil") ? "branch-group-success" : "form-error"} role="status">{status}</p>}
    <button className="button" type="submit" disabled={busy || (isActive && Number(rewardDiscount) < 1)}>{busy ? "Menyimpan…" : "Simpan program"}</button>
  </form>;
}
