"use client";

import { useCallback, useEffect, useState } from "react";

type Product = { id: string; name: string; category: string; price: number };
type CartLine = { product: Product; quantity: number };
type Shift = { id: string; openingCash: number; expectedCash?: number } | null;
type Receipt = {
  id: string;
  phone: string;
  createdAt: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  total: number;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
};

const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const paymentLabels: Record<string, string> = { CASH: "Tunai", QRIS: "QRIS", TRANSFER: "Transfer", CARD: "Kartu" };

export function PointOfSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shift, setShift] = useState<Shift>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [cash, setCash] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/staff/pos", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setProducts(body.products);
      setShift(body.shift);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "POS gagal dimuat.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  const subtotal = cart.reduce((total, line) => total + line.product.price * line.quantity, 0);

  function add(product: Product) {
    setCart((current) => {
      const line = current.find((item) => item.product.id === product.id);
      return line
        ? current.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, 99) } : item)
        : [...current, { product, quantity: 1 }];
    });
  }

  function quantity(id: string, value: number) {
    setCart((current) => value < 1
      ? current.filter((item) => item.product.id !== id)
      : current.map((item) => item.product.id === id ? { ...item, quantity: Math.min(value, 99) } : item));
  }

  async function shiftAction(payload: Record<string, unknown>) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/staff/cash-shift", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setShift(body.shift);
      if (body.difference !== undefined) setMessage(`Kas ekspektasi ${money.format(body.expectedCash)} · selisih ${money.format(body.difference)}.`);
      setCash("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kas laci gagal diperbarui.");
    } finally { setBusy(false); }
  }

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length) return;
    setBusy(true); setError(""); setMessage(""); setReceipt(null);
    try {
      const response = await fetch("/api/staff/pos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: cart.map(({ product, quantity: count }) => ({ productId: product.id, quantity: count })), paymentMethod, customerName, customerPhone, voucherCode }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setReceipt({
        id: body.order.id,
        phone: body.customerPhone,
        createdAt: body.order.createdAt,
        paymentMethod: body.order.paymentMethod,
        subtotal: body.order.subtotal,
        discount: body.order.discount,
        total: body.order.total,
        items: body.order.items,
      });
      setMessage(`Transaksi tercatat · ${money.format(body.order.total)}${body.stampsAdded ? " · 1 stempel ditambahkan" : ""}.`);
      setCart([]); setVoucherCode("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Transaksi gagal.");
    } finally { setBusy(false); }
  }

  function openWhatsappReceipt() {
    if (!receipt?.phone) return;
    const phone = receipt.phone.startsWith("0")
      ? `62${receipt.phone.slice(1)}`
      : receipt.phone.startsWith("8")
        ? `62${receipt.phone}`
        : receipt.phone;
    const lines = [
      "Struk RAI",
      ...receipt.items.map((item) => `${item.quantity} x ${item.name} — ${money.format(item.lineTotal)}`),
      `Subtotal: ${money.format(receipt.subtotal)}`,
      `Diskon: ${money.format(receipt.discount)}`,
      `Total: ${money.format(receipt.total)}`,
      `Pembayaran: ${paymentLabels[receipt.paymentMethod] ?? receipt.paymentMethod}`,
      `No. transaksi: ${receipt.id}`,
    ];
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  }

  return <>
    <div className="pos-layout">
      <section className="admin-card pos-products">
        <div className="queue-admin-head"><div><span className="admin-eyebrow">Katalog tersedia</span><h2>Pilih produk</h2></div></div>
        <div className="pos-product-grid">
          {products.map((product) => <button className="pos-product" type="button" key={product.id} onClick={() => add(product)}><span>{product.category}</span><strong>{product.name}</strong><b>{money.format(product.price)}</b></button>)}
          {!products.length && <p className="admin-field-help">Belum ada produk tersedia. Owner dapat mengisinya di Menu & produk.</p>}
        </div>
      </section>

      <aside className="pos-side">
        <section className="admin-card cash-shift-card">
          <span className="admin-eyebrow">Kas laci</span>
          {shift ? <>
            <h2>Shift terbuka</h2><p>Modal awal {money.format(shift.openingCash)} · ekspektasi {money.format(shift.expectedCash ?? shift.openingCash)}</p>
            <div className="admin-field"><label htmlFor="cash-movement">Jumlah pemasukan / pengeluaran (Rp)</label><input id="cash-movement" type="number" min="1" value={cash} onChange={(event) => setCash(event.target.value)} /></div>
            <div className="pos-buttons"><button className="admin-logout" type="button" disabled={busy || !cash} onClick={() => void shiftAction({ action: "MOVEMENT", type: "OUT", amount: Number(cash), note: "Pengeluaran kas" })}>Catat keluar</button><button className="admin-logout" type="button" disabled={busy || !cash} onClick={() => void shiftAction({ action: "MOVEMENT", type: "IN", amount: Number(cash), note: "Pemasukan kas" })}>Catat masuk</button></div>
            <div className="admin-field"><label htmlFor="cash-close">Uang fisik saat tutup (Rp)</label><input id="cash-close" type="number" min="0" value={cash} onChange={(event) => setCash(event.target.value)} /></div>
            <button className="button secondary" type="button" disabled={busy || cash === ""} onClick={() => void shiftAction({ action: "CLOSE", countedCash: Number(cash) })}>Tutup shift & hitung selisih</button>
          </> : <>
            <p>Shift kas belum dibuka. Pembayaran tunai perlu modal awal.</p>
            <div className="admin-field"><label htmlFor="cash-open">Modal awal (Rp)</label><input id="cash-open" type="number" min="0" value={cash} onChange={(event) => setCash(event.target.value)} /></div>
            <button className="button" type="button" disabled={busy || cash === ""} onClick={() => void shiftAction({ action: "OPEN", amount: Number(cash) })}>Buka shift kas</button>
          </>}
        </section>

        <form className="admin-card pos-checkout" onSubmit={checkout}>
          <span className="admin-eyebrow">Keranjang</span><h2>Total {money.format(subtotal)}</h2>
          <div className="pos-cart">{cart.map(({ product, quantity: count }) => <div className="pos-cart-row" key={product.id}><div><strong>{product.name}</strong><span>{money.format(product.price)} / item</span></div><div><button type="button" aria-label={`Kurangi ${product.name}`} onClick={() => quantity(product.id, count - 1)}>−</button><span>{count}</span><button type="button" aria-label={`Tambah ${product.name}`} onClick={() => quantity(product.id, count + 1)}>+</button></div></div>)}{!cart.length && <p className="admin-field-help">Keranjang kosong.</p>}</div>
          <div className="admin-field"><label htmlFor="pos-payment">Pembayaran</label><select id="pos-payment" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="CASH">Tunai</option><option value="QRIS">QRIS</option><option value="TRANSFER">Transfer</option><option value="CARD">Kartu</option></select></div>
          <div className="admin-field"><label htmlFor="pos-customer">Nama pelanggan</label><input id="pos-customer" value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={100} /></div>
          <div className="admin-field"><label htmlFor="pos-phone">WhatsApp untuk stempel & struk (opsional)</label><input id="pos-phone" type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} maxLength={20} /></div>
          <div className="admin-field"><label htmlFor="pos-voucher">Kode voucher</label><input id="pos-voucher" value={voucherCode} onChange={(event) => setVoucherCode(event.target.value.toUpperCase())} maxLength={40} /></div>
          <button className="button" type="submit" disabled={busy || !cart.length}>{busy ? "Mencatat…" : "Catat pembayaran"}</button>
          {error && <p className="form-error">{error}</p>}{message && <p className="admin-field-help" role="status">{message}</p>}
        </form>
      </aside>
    </div>

    {receipt && <section className="admin-card pos-receipt">
      <span className="admin-eyebrow">Transaksi berhasil · {receipt.id}</span><h2>Struk pelanggan</h2>
      <p>{new Date(receipt.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} · {paymentLabels[receipt.paymentMethod] ?? receipt.paymentMethod}</p>
      <div className="receipt-items">{receipt.items.map((item, index) => <div className="receipt-row" key={`${item.name}-${index}`}><span>{item.quantity} × {item.name}</span><strong>{money.format(item.lineTotal)}</strong></div>)}</div>
      <div className="receipt-totals"><span>Subtotal</span><strong>{money.format(receipt.subtotal)}</strong><span>Diskon</span><strong>{money.format(receipt.discount)}</strong><span>Total</span><strong>{money.format(receipt.total)}</strong></div>
      <div className="pos-receipt-actions"><button className="button" type="button" onClick={openWhatsappReceipt} disabled={!receipt.phone}>Kirim lewat WhatsApp</button><button className="button secondary" type="button" onClick={() => window.print()}>Cetak struk</button><span className="admin-field-help">Pilih printer thermal 58 mm pada dialog cetak jika tersedia.</span></div>
    </section>}
  </>;
}
