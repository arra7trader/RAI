"use client";

import { useState } from "react";

type StoreOption = { id: string; name: string; slug: string; planTier: string; isActive: boolean; groupId: string | null };

export function AdminBranchGroups({ tenants }: { tenants: StoreOption[] }) {
  const juraganStores = tenants.filter((tenant) => tenant.planTier === "JURAGAN" && tenant.isActive);
  const [primaryId, setPrimaryId] = useState("");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleBranch(id: string, checked: boolean) {
    setBranchIds((current) => checked ? [...current, id] : current.filter((item) => item !== id));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/tenant-groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ primaryTenantId: primaryId, branchTenantIds: branchIds }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Grup cabang gagal disimpan.");
      setStatus(`${result.tenantCount} toko kini masuk satu ringkasan multi-cabang.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Grup cabang gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="branch-group-layout">
    <form className="admin-card onboarding-form" onSubmit={(event) => void save(event)}>
      <section className="admin-form-section">
        <div><span className="admin-eyebrow">Akun ringkasan owner</span><h2>Pilih toko utama</h2></div>
        <p className="admin-field-help">Akun owner toko utama dapat melihat ringkasan untuk toko-toko yang Anda gabungkan. Toko utama harus memakai paket RAI Juragan.</p>
        <div className="admin-field"><label htmlFor="primaryTenant">Toko utama *</label><select id="primaryTenant" value={primaryId} onChange={(event) => { const nextId = event.target.value; const nextStore = tenants.find((tenant) => tenant.id === nextId); setPrimaryId(nextId); setBranchIds(nextStore?.groupId ? tenants.filter((tenant) => tenant.groupId === nextStore.groupId && tenant.id !== nextId).map((tenant) => tenant.id) : []); }} required><option value="">Pilih toko utama</option>{juraganStores.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} · /{tenant.slug}</option>)}</select></div>
      </section>
      <section className="admin-form-section">
        <div><span className="admin-eyebrow">Toko cabang</span><h2>Pilih toko dalam grup</h2></div>
        <div className="branch-store-list">{juraganStores.filter((tenant) => tenant.id !== primaryId).map((tenant) => <label className="branch-store-option" key={tenant.id}><input type="checkbox" checked={branchIds.includes(tenant.id)} onChange={(event) => toggleBranch(tenant.id, event.target.checked)} /><span><strong>{tenant.name}</strong><small>/{tenant.slug}{tenant.groupId ? " · sudah tergabung" : ""}</small></span></label>)}</div>
        {!juraganStores.length && <p className="admin-field-help">Belum ada toko aktif dengan paket RAI Juragan.</p>}
        {juraganStores.length > 0 && !primaryId && <p className="admin-field-help">Pilih toko utama untuk menampilkan daftar cabang.</p>}
        {primaryId && branchIds.length === 0 && <p className="admin-field-help">Pilih paling sedikit satu cabang.</p>}
      </section>
      {status && <p className={status.includes("kini masuk") ? "branch-group-success" : "form-error"} role="status">{status}</p>}
      <div className="admin-form-actions"><button className="button" type="submit" disabled={busy || !primaryId || !branchIds.length}>{busy ? "Menyimpan…" : "Simpan grup cabang"}</button></div>
    </form>
    <aside className="admin-card branch-group-note"><span className="admin-eyebrow">Batas akses data</span><h2>Akses mengikuti grup.</h2><p>Ringkasan owner utama menggabungkan toko yang ditautkan di sini. Akun owner lain tidak otomatis mendapat akses ke grup.</p></aside>
  </div>;
}
