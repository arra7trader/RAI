"use client";

import { useState } from "react";

export function StampIssuer() {
  const [cardToken, setCardToken] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [result, setResult] = useState("");
  const [voucherCardToken, setVoucherCardToken] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setResult("");
    try {
      const response = await fetch("/api/staff/stamps", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cardToken: cardToken.trim(), quantity: Number(quantity) }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Stempel gagal ditambahkan.");
      setResult(`${body.customer.name}: ${body.customer.stampBalance} stempel tersimpan.`); setCardToken("");
    } catch (error) { setResult(error instanceof Error ? error.message : "Stempel gagal ditambahkan."); }
    finally { setBusy(false); }
  }
  async function claimVoucher() {
    setBusy(true); setVoucherMessage("");
    try {
      const response = await fetch("/api/staff/vouchers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cardToken: voucherCardToken.trim() }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Voucher gagal dibuat.");
      setVoucherMessage(`${body.customer.name}: voucher ${body.voucher.code} · potongan ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(body.voucher.discountAmount)}.`); setVoucherCardToken("");
    } catch (error) { setVoucherMessage(error instanceof Error ? error.message : "Voucher gagal dibuat."); }
    finally { setBusy(false); }
  }
  return <form className="admin-card admin-form stamp-issuer" onSubmit={submit}>
    <label htmlFor="cardToken">Token kartu pelanggan</label><input id="cardToken" value={cardToken} onChange={(event) => setCardToken(event.target.value)} required minLength={16} maxLength={80} autoComplete="off" />
    <label htmlFor="quantity">Jumlah stempel</label><select id="quantity" value={quantity} onChange={(event) => setQuantity(event.target.value)}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}</select>
    <button className="button" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Tambahkan stempel"}</button>{result && <p className="admin-field-help" role="status">{result}</p>}
    <hr />
    <span className="admin-eyebrow">Klaim hadiah</span><label htmlFor="voucherCardToken">Token kartu untuk tukar hadiah</label><input id="voucherCardToken" value={voucherCardToken} onChange={(event) => setVoucherCardToken(event.target.value)} minLength={16} maxLength={80} />
    <button className="admin-logout" type="button" disabled={busy || voucherCardToken.length < 16} onClick={() => void claimVoucher()}>Tukar stempel menjadi voucher</button>{voucherMessage && <p className="admin-field-help" role="status">{voucherMessage}</p>}
  </form>;
}
