"use client";

import { useCallback, useEffect, useState } from "react";

type Product = { id: string; name: string; category: string; trackInventory: boolean; stockQuantity: number; lowStockThreshold: number };
type Supplier = { id: string; name: string; phone: string };
type Purchase = { id: string; reference: string; total: number; createdAt: string; supplier: { name: string } | null; items: Array<{ name: string; quantity: number }> };
type Movement = { id: string; type: string; quantity: number; note: string; createdAt: string; product: { name: string } };
type InventoryData = { products: Product[]; suppliers: Supplier[]; purchases: Purchase[]; movements: Movement[] };
type PurchaseLine = { productId: string; quantity: string; unitCost: string };

const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const typeLabel: Record<string, string> = { OPENING: "Saldo awal", PURCHASE: "Pembelian", SALE: "Penjualan", ADJUSTMENT: "Penyesuaian" };

export function InventoryManager() {
  const [data, setData] = useState<InventoryData>({ products: [], suppliers: [], purchases: [], movements: [] });
  const [supplier, setSupplier] = useState({ name: "", phone: "", notes: "" });
  const [supplierId, setSupplierId] = useState("");
  const [reference, setReference] = useState("");
  const [purchaseNote, setPurchaseNote] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([{ productId: "", quantity: "1", unitCost: "0" }]);
  const [adjustment, setAdjustment] = useState<{ productId: string; quantity: string; note: string } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const trackedProducts = data.products.filter((product) => product.trackInventory);
  const lowStock = trackedProducts.filter((product) => product.stockQuantity <= product.lowStockThreshold);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/owner/inventory", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Inventaris gagal dimuat.");
    setData(body);
  }, []);

  useEffect(() => { void refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "Inventaris gagal dimuat.")); }, [refresh]);

  async function submit(payload: Record<string, unknown>) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/owner/inventory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Perubahan inventaris gagal disimpan.");
      await refresh();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Perubahan inventaris gagal disimpan.");
      return false;
    } finally { setBusy(false); }
  }

  async function saveSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await submit({ action: "SUPPLIER", ...supplier })) { setSupplier({ name: "", phone: "", notes: "" }); setMessage("Pemasok tersimpan."); }
  }

  async function receivePurchase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await submit({ action: "PURCHASE", supplierId: supplierId || null, reference, note: purchaseNote, items: lines.map((line) => ({ productId: line.productId, quantity: Number(line.quantity), unitCost: Number(line.unitCost) })) });
    if (ok) { setReference(""); setPurchaseNote(""); setLines([{ productId: "", quantity: "1", unitCost: "0" }]); setMessage("Pembelian tersimpan dan stok bertambah."); }
  }

  async function saveAdjustment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adjustment) return;
    const ok = await submit({ action: "ADJUSTMENT", productId: adjustment.productId, quantity: Number(adjustment.quantity), note: adjustment.note });
    if (ok) { setAdjustment(null); setMessage("Penyesuaian stok tersimpan."); }
  }

  const totalPurchase = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitCost || 0), 0);

  return <div className="inventory-manager">
    <section className="admin-metrics inventory-metrics"><article className="admin-metric"><span>Produk dilacak</span><strong>{trackedProducts.length}</strong></article><article className="admin-metric"><span>Perlu restok</span><strong>{lowStock.length}</strong></article><article className="admin-metric"><span>Pemasok</span><strong>{data.suppliers.length}</strong></article></section>
    {lowStock.length > 0 && <p className="inventory-low-alert">Stok rendah: {lowStock.map((product) => `${product.name} (${product.stockQuantity})`).join(", ")}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="admin-field-help" role="status">{message}</p>}

    <section className="report-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">Saldo barang</span><h2>Stok produk</h2></div><a className="admin-table-link" href="/dashboard/products">Kelola produk ↗</a></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Produk</th><th>Stok</th><th>Batas rendah</th><th>Status</th><th>Penyesuaian</th></tr></thead><tbody>
      {data.products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><div className="admin-field-help">{product.category}</div></td><td>{product.trackInventory ? product.stockQuantity : "Tidak dilacak"}</td><td>{product.trackInventory ? product.lowStockThreshold : "—"}</td><td>{product.trackInventory ? product.stockQuantity <= product.lowStockThreshold ? "Perlu restok" : "Aman" : "Aktifkan di Menu & produk"}</td><td>{product.trackInventory && <button className="admin-logout" type="button" onClick={() => setAdjustment({ productId: product.id, quantity: "", note: "" })}>Koreksi stok</button>}</td></tr>)}
      {!data.products.length && <tr><td className="admin-empty-cell" colSpan={5}>Belum ada produk.</td></tr>}
    </tbody></table></div></section>

    <div className="admin-form-grid inventory-forms">
      <form className="admin-card onboarding-form" onSubmit={saveSupplier}><span className="admin-eyebrow">Data pemasok</span><h2>Tambah pemasok</h2><div className="admin-field"><label htmlFor="supplier-name">Nama pemasok</label><input id="supplier-name" value={supplier.name} onChange={(event) => setSupplier({ ...supplier, name: event.target.value })} required maxLength={120} /></div><div className="admin-field"><label htmlFor="supplier-phone">Telepon</label><input id="supplier-phone" value={supplier.phone} onChange={(event) => setSupplier({ ...supplier, phone: event.target.value })} maxLength={30} /></div><div className="admin-field"><label htmlFor="supplier-notes">Catatan</label><input id="supplier-notes" value={supplier.notes} onChange={(event) => setSupplier({ ...supplier, notes: event.target.value })} maxLength={300} /></div><button className="button" type="submit" disabled={busy}>Simpan pemasok</button></form>

      <form className="admin-card onboarding-form" onSubmit={receivePurchase}><span className="admin-eyebrow">Barang masuk</span><h2>Catat pembelian</h2><div className="admin-field"><label htmlFor="purchase-supplier">Pemasok</label><select id="purchase-supplier" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">Tanpa pemasok</option>{data.suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="admin-field"><label htmlFor="purchase-reference">Nomor nota</label><input id="purchase-reference" value={reference} onChange={(event) => setReference(event.target.value)} maxLength={80} /></div>
        {lines.map((line, index) => <div className="inventory-purchase-line" key={index}><div className="admin-field"><label htmlFor={`purchase-product-${index}`}>Produk</label><select id={`purchase-product-${index}`} value={line.productId} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, productId: event.target.value } : item))} required><option value="">Pilih produk</option>{trackedProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · stok {product.stockQuantity}</option>)}</select></div><div className="admin-field"><label htmlFor={`purchase-quantity-${index}`}>Jumlah</label><input id={`purchase-quantity-${index}`} type="number" min="1" value={line.quantity} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} required /></div><div className="admin-field"><label htmlFor={`purchase-cost-${index}`}>Harga beli / unit</label><input id={`purchase-cost-${index}`} type="number" min="0" value={line.unitCost} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, unitCost: event.target.value } : item))} required /></div>{lines.length > 1 && <button className="admin-logout" type="button" onClick={() => setLines(lines.filter((_, i) => i !== index))}>Hapus item</button>}</div>)}
        <button className="admin-logout" type="button" onClick={() => setLines([...lines, { productId: "", quantity: "1", unitCost: "0" }])} disabled={lines.length >= 30}>Tambah item</button><div className="admin-field"><label htmlFor="purchase-note">Catatan</label><input id="purchase-note" value={purchaseNote} onChange={(event) => setPurchaseNote(event.target.value)} maxLength={300} /></div><p>Total pembelian: <strong>{money.format(totalPurchase)}</strong></p><button className="button" type="submit" disabled={busy || !trackedProducts.length}>Simpan & terima barang</button>{!trackedProducts.length && <span className="admin-field-help">Aktifkan pelacakan stok untuk produk terlebih dahulu.</span>}</form>
    </div>

    <section className="report-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">Riwayat pembelian</span><h2>Pembelian terbaru</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tanggal</th><th>Nota</th><th>Pemasok</th><th>Barang</th><th>Total biaya</th></tr></thead><tbody>{data.purchases.map((purchase) => <tr key={purchase.id}><td>{new Date(purchase.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</td><td>{purchase.reference || "—"}</td><td>{purchase.supplier?.name ?? "—"}</td><td>{purchase.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}</td><td>{money.format(purchase.total)}</td></tr>)}{!data.purchases.length && <tr><td colSpan={5} className="admin-empty-cell">Belum ada pembelian.</td></tr>}</tbody></table></div></section>

    <section className="report-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">Audit persediaan</span><h2>Mutasi stok terbaru</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Waktu</th><th>Produk</th><th>Jenis</th><th>Perubahan</th><th>Catatan</th></tr></thead><tbody>{data.movements.map((movement) => <tr key={movement.id}><td>{new Date(movement.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</td><td>{movement.product.name}</td><td>{typeLabel[movement.type] ?? movement.type}</td><td>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td><td>{movement.note || "—"}</td></tr>)}{!data.movements.length && <tr><td colSpan={5} className="admin-empty-cell">Belum ada mutasi stok.</td></tr>}</tbody></table></div></section>

    {adjustment && <div className="inventory-dialog-backdrop"><form className="admin-card inventory-dialog" onSubmit={saveAdjustment}><button className="admin-logout" type="button" onClick={() => setAdjustment(null)}>Tutup</button><span className="admin-eyebrow">Koreksi stok</span><h2>{data.products.find((product) => product.id === adjustment.productId)?.name}</h2><p>Gunakan angka positif untuk menambah stok, negatif untuk mengurangi.</p><div className="admin-field"><label htmlFor="adjustment-quantity">Perubahan jumlah</label><input id="adjustment-quantity" type="number" value={adjustment.quantity} onChange={(event) => setAdjustment({ ...adjustment, quantity: event.target.value })} required min={-1_000_000} max={1_000_000} /></div><div className="admin-field"><label htmlFor="adjustment-note">Alasan</label><input id="adjustment-note" value={adjustment.note} onChange={(event) => setAdjustment({ ...adjustment, note: event.target.value })} required minLength={3} maxLength={300} /></div><button className="button" type="submit" disabled={busy || !Number(adjustment.quantity)}>Simpan koreksi</button></form></div>}
  </div>;
}
