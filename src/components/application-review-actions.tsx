"use client";

import { useState } from "react";

type QrChoice = { id: string; code: string; label: string };
type CredentialResult = {
  tenant: { name: string; slug: string };
  owner: { email: string; password: string };
  staff: { email: string; password: string } | null;
  loginUrl: string;
};

export function ApplicationReviewActions({
  applicationId,
  suggestedSlug,
  qrCodes,
}: { applicationId: string; suggestedSlug: string; qrCodes: QrChoice[] }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [slug, setSlug] = useState(suggestedSlug);
  const [qrCodeId, setQrCodeId] = useState(qrCodes[0]?.id ?? "");
  const [credentials, setCredentials] = useState<CredentialResult | null>(null);

  async function decide(decision: "APPROVE" | "REJECT") {
    setBusy(true);
    setMessage("");
    const payload = decision === "APPROVE"
      ? { decision, slug, qrCodeId }
      : { decision, note: "Pengajuan ditolak setelah peninjauan." };
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Keputusan gagal disimpan.");
      if (decision === "APPROVE") setCredentials(result as CredentialResult);
      else setMessage(result.message || "Pengajuan ditolak.");
      if (decision === "REJECT") window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Keputusan gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  if (credentials) return (
    <div className="admin-success-card application-credentials">
      <span className="admin-eyebrow">Toko aktif</span>
      <h2>{credentials.tenant.name}</h2>
      <p>Berikan kredensial sementara ini kepada pemilik melalui saluran privat. Kata sandi hanya ditampilkan pada layar ini.</p>
      <div className="temporary-credentials">
        <div><strong>Pemilik · {credentials.owner.email}</strong><code>{credentials.owner.password}</code></div>
        {credentials.staff && <div><strong>Kasir · {credentials.staff.email}</strong><code>{credentials.staff.password}</code></div>}
      </div>
      <p><a className="admin-table-link" href={credentials.loginUrl}>Buka halaman login {credentials.loginUrl}</a></p>
      <p><a className="admin-table-link" href={`/${credentials.tenant.slug}`}>Buka portal toko /{credentials.tenant.slug} ↗</a></p>
    </div>
  );

  return (
    <div className="application-review-actions">
      <div className="admin-field">
        <label htmlFor={`slug-${applicationId}`}>Slug portal</label>
        <input id={`slug-${applicationId}`} value={slug} onChange={(event) => setSlug(event.target.value)} maxLength={64} />
      </div>
      <div className="admin-field">
        <label htmlFor={`qr-${applicationId}`}>Kode QR</label>
        <select id={`qr-${applicationId}`} value={qrCodeId} onChange={(event) => setQrCodeId(event.target.value)} disabled={!qrCodes.length}>
          {qrCodes.map((qr) => <option key={qr.id} value={qr.id}>{qr.code} — {qr.label || "QR siap pakai"}</option>)}
        </select>
      </div>
      <div className="admin-form-actions">
        <button className="button" type="button" disabled={busy || !qrCodeId || slug.length < 2} onClick={() => void decide("APPROVE")}>
          {busy ? "Memproses…" : "Setujui & aktifkan"}
        </button>
        <button className="admin-logout" type="button" disabled={busy} onClick={() => void decide("REJECT")}>Tolak pengajuan</button>
      </div>
      {message && <p className="form-error">{message}</p>}
      {!qrCodes.length && <p className="admin-field-help">Belum ada QR kosong. Buat batch baru di Generator QR untuk mengaktifkan pengajuan.</p>}
    </div>
  );
}
