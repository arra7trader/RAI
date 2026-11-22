"use client";

import { useState } from "react";

type ProductOption = { id: string; name: string; isAvailable: boolean };
type Campaign = {
  id: string;
  title: string;
  discountType: string;
  discountValue: number;
  minimumPurchase: number;
  quota: number;
  claimedCount: number;
  validUntil: string;
  isActive: boolean;
  freeProductId: string | null;
  freeProduct?: { name: string; isAvailable: boolean } | null;
};

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

function campaignLabel(campaign: { discountType: string; discountValue: number; freeProduct?: { name: string } | null }) {
  if (campaign.discountType === "PERCENTAGE") return `Diskon ${campaign.discountValue}%`;
  if (campaign.discountType === "FREE_ITEM") return `Gratis ${campaign.freeProduct?.name ?? "produk pilihan"}`;
  return `Potongan ${rupiah.format(campaign.discountValue)}`;
}

export function AdminPromotionCampaigns({ tenantId, products, initial }: { tenantId: string; products: ProductOption[]; initial: Campaign[] }) {
  const [campaigns, setCampaigns] = useState(initial);
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState("NOMINAL");
  const [discountValue, setDiscountValue] = useState("10000");
  const [minimumPurchase, setMinimumPurchase] = useState("0");
  const [quota, setQuota] = useState("100");
  const [validUntil, setValidUntil] = useState("");
  const [freeProductId, setFreeProductId] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function createCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/promotions`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, discountType, discountValue: Number(discountValue), minimumPurchase: Number(minimumPurchase), quota: Number(quota), validUntil: new Date(validUntil).toISOString(), freeProductId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Promo gagal dibuat.");
      setStatus("Promo aktif dan tampil di portal pelanggan.");
      window.location.reload();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Promo gagal dibuat."); }
    finally { setBusy(false); }
  }

  async function setActive(campaign: Campaign, isActive: boolean) {
    setBusy(true); setStatus("");
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/promotions`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId: campaign.id, isActive }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Status promo gagal diperbarui.");
      setCampaigns((current) => current.map((item) => item.id === campaign.id ? { ...item, isActive } : item));
    } catch (error) { setStatus(error instanceof Error ? error.message : "Status promo gagal diperbarui."); }
    finally { setBusy(false); }
  }

  const requiresFreeProduct = discountType === "FREE_ITEM";
  return <section className="report-section">
    <div className="admin-section-heading"><div><span className="admin-eyebrow">Voucher promo publik</span><h2>Kampanye pelanggan</h2></div></div>
    <form className="admin-card onboarding-form" onSubmit={(event) => void createCampaign(event)}>
      <h3>Buat promo baru</h3>
      <div className="admin-form-grid">
        <div className="admin-field admin-field-wide"><label htmlFor="promo-title">Nama promo</label><input id="promo-title" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={2} maxLength={120} /></div>
        <div className="admin-field"><label htmlFor="promo-type">Jenis hadiah</label><select id="promo-type" value={discountType} onChange={(event) => { setDiscountType(event.target.value); setDiscountValue(event.target.value === "PERCENTAGE" ? "10" : event.target.value === "FREE_ITEM" ? "1" : "10000"); }}><option value="NOMINAL">Potongan nominal</option><option value="PERCENTAGE">Potongan persentase</option><option value="FREE_ITEM">Produk gratis</option></select></div>
        {!requiresFreeProduct && <div className="admin-field"><label htmlFor="promo-value">{discountType === "PERCENTAGE" ? "Diskon (%)" : "Potongan (Rp)"}</label><input id="promo-value" type="number" min="1" max={discountType === "PERCENTAGE" ? "100" : "1000000000"} value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} required /></div>}
        {requiresFreeProduct && <div className="admin-field"><label htmlFor="promo-product">Produk gratis</label><select id="promo-product" value={freeProductId} onChange={(event) => setFreeProductId(event.target.value)} required><option value="">Pilih produk tersedia</option>{products.filter((product) => product.isAvailable).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div>}
        <div className="admin-field"><label htmlFor="promo-minimum">Minimal belanja (Rp)</label><input id="promo-minimum" type="number" min="0" max="1000000000" value={minimumPurchase} onChange={(event) => setMinimumPurchase(event.target.value)} required /></div>
        <div className="admin-field"><label htmlFor="promo-quota">Kuota klaim</label><input id="promo-quota" type="number" min="1" max="100000" value={quota} onChange={(event) => setQuota(event.target.value)} required /></div>
        <div className="admin-field"><label htmlFor="promo-valid-until">Berlaku sampai</label><input id="promo-valid-until" type="datetime-local" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} required /></div>
      </div>
      {requiresFreeProduct && !products.some((product) => product.isAvailable) && <p className="admin-warning">Tambahkan produk tersedia di katalog sebelum membuat promo barang gratis.</p>}
      {status && <p className={status.includes("aktif") ? "branch-group-success" : "form-error"} role="status">{status}</p>}
      <button className="button" type="submit" disabled={busy || (requiresFreeProduct && !products.some((product) => product.isAvailable))}>{busy ? "Menyimpan…" : "Buat promo"}</button>
    </form>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Promo</th><th>Hadiah</th><th>Kuota</th><th>Berlaku sampai</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
      {campaigns.map((campaign) => <tr key={campaign.id}><td><strong>{campaign.title}</strong><div className="admin-field-help">Minimal belanja {rupiah.format(campaign.minimumPurchase)}</div></td><td>{campaignLabel(campaign)}</td><td>{campaign.claimedCount} / {campaign.quota}</td><td>{new Date(campaign.validUntil).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</td><td>{campaign.isActive ? "Aktif" : "Nonaktif"}</td><td><button className="admin-logout" type="button" disabled={busy} onClick={() => void setActive(campaign, !campaign.isActive)}>{campaign.isActive ? "Nonaktifkan" : "Aktifkan"}</button></td></tr>)}
      {!campaigns.length && <tr><td className="admin-empty-cell" colSpan={6}>Belum ada kampanye promo.</td></tr>}
    </tbody></table></div>
  </section>;
}

type PublicCampaign = Omit<Campaign, "isActive" | "freeProductId">;
type ClaimedVoucher = { code: string; title: string; discountType: string; discountValue: number; expiresAt: string | null; freeProduct: { name: string } | null };

export function PublicPromotionCampaigns({ storeSlug, initial }: { storeSlug: string; initial: PublicCampaign[] }) {
  const [name, setName] = useState("");
  const [phoneWa, setPhoneWa] = useState("");
  const [dataConsent, setDataConsent] = useState(false);
  const [claimed, setClaimed] = useState<ClaimedVoucher | null>(null);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState("");

  async function claim(campaignId: string) {
    setBusyId(campaignId); setStatus(""); setClaimed(null);
    try {
      const response = await fetch(`/api/public/${storeSlug}/promotions/${campaignId}/claim`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, phoneWa, dataConsent }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Klaim promo gagal.");
      setClaimed(result.voucher);
      setStatus("Voucher berhasil diklaim. Masukkan kodenya saat membayar di toko.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Klaim promo gagal."); }
    finally { setBusyId(""); }
  }

  if (!initial.length) return null;
  return <section className="report-section public-promotions">
    <div className="menu-heading"><span className="store-kicker">Promo toko</span><h2>Klaim voucher kejutan.</h2><p>Voucher terbatas, terikat ke nomor WhatsApp, dan masukkan kodenya saat membayar.</p></div>
    <div className="admin-card onboarding-form">
      <div className="admin-form-grid"><div className="admin-field"><label htmlFor={`promo-customer-${storeSlug}`}>Nama Anda</label><input id={`promo-customer-${storeSlug}`} value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required /></div><div className="admin-field"><label htmlFor={`promo-phone-${storeSlug}`}>Nomor WhatsApp</label><input id={`promo-phone-${storeSlug}`} type="tel" value={phoneWa} onChange={(event) => setPhoneWa(event.target.value)} minLength={8} maxLength={20} placeholder="08 atau 628..." required /></div></div>
      <label className="application-consent"><input type="checkbox" checked={dataConsent} onChange={(event) => setDataConsent(event.target.checked)} /><span>Saya setuju nama dan nomor WhatsApp digunakan untuk menerbitkan, membatasi, dan memverifikasi voucher promo ini.</span></label>
      <div className="promotion-card-grid">{initial.map((campaign) => <article className="promotion-card" key={campaign.id}><span className="admin-eyebrow">{campaign.claimedCount} dari {campaign.quota} diklaim</span><h3>{campaign.title}</h3><p>{campaignLabel(campaign)}</p>{campaign.minimumPurchase > 0 && <p>Minimal belanja {rupiah.format(campaign.minimumPurchase)}.</p>}<small>Berlaku sampai {new Date(campaign.validUntil).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" })}</small><button className="button" type="button" disabled={busyId !== "" || name.trim().length < 2 || phoneWa.trim().length < 8 || !dataConsent} onClick={() => void claim(campaign.id)}>{busyId === campaign.id ? "Mengklaim…" : "Klaim voucher"}</button></article>)}</div>
      {status && <p className={claimed ? "branch-group-success" : "form-error"} role="status">{status}</p>}
      {claimed && <div className="temporary-credentials"><div><strong>{claimed.title}</strong><code>{claimed.code}</code><span>{campaignLabel({ discountType: claimed.discountType, discountValue: claimed.discountValue, freeProduct: claimed.freeProduct })} · sampaikan kode ke kasir.</span></div></div>}
    </div>
  </section>;
}
