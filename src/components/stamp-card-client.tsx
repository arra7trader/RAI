"use client";

import { useEffect, useState } from "react";

type Card = { name: string; cardToken: string; stampBalance: number; stampsIssued: number; stampsRedeemed: number };
type Program = { targetStamps: number; rewardTitle: string; termsText: string };

export function StampCardClient({ storeSlug, program, cardToken }: { storeSlug: string; program: Program | null; cardToken: string }) {
  const [card, setCard] = useState<Card | null>(null);
  const [name, setName] = useState("");
  const [phoneWa, setPhoneWa] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!cardToken) return;
    fetch(`/api/public/${storeSlug}/customers?card=${encodeURIComponent(cardToken)}`).then(async (response) => {
      const body = await response.json(); if (response.ok) setCard(body.customer); else setError(body.error || "Kartu tidak ditemukan.");
    }).catch(() => setError("Kartu tidak dapat dimuat."));
  }, [cardToken, storeSlug]);
  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/public/${storeSlug}/customers`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, phoneWa }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Kartu gagal dibuat.");
      setCard(body.customer); window.history.replaceState(null, "", `/${storeSlug}/stamp?card=${encodeURIComponent(body.customer.cardToken)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Kartu gagal dibuat."); }
    finally { setBusy(false); }
  }
  if (!program) return <div className="empty-menu"><h2>Program stempel belum aktif</h2><p>Tanya kasir atau hubungi toko untuk informasi program loyalti.</p></div>;
  if (!card) return <form className="admin-card stamp-register-form" onSubmit={register}>
    <span className="admin-eyebrow">Kartu pelanggan gratis</span><h2>{program.rewardTitle}</h2><p>Daftar dengan nama dan WhatsApp. Kasir akan menambahkan stempel setelah kunjungan atau transaksi.</p>
    <div className="admin-form-grid"><div className="admin-field"><label htmlFor="stamp-name">Nama Anda</label><input id="stamp-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} /></div><div className="admin-field"><label htmlFor="stamp-phone">Nomor WhatsApp</label><input id="stamp-phone" type="tel" value={phoneWa} onChange={(event) => setPhoneWa(event.target.value)} required minLength={8} maxLength={20} placeholder="628..." /></div></div>
    {error && <p className="form-error">{error}</p>}<button className="button" type="submit" disabled={busy}>{busy ? "Membuat kartu…" : "Buat kartu digital"}</button>
  </form>;
  const count = Math.min(Math.max(program.targetStamps, 1), 20);
  return <section className="stamp-card"><span className="store-kicker">Kartu pelanggan · {card.name}</span><h2>{program.rewardTitle}</h2><p>Kumpulkan {program.targetStamps} stempel untuk membuka hadiah.</p>{program.termsText && <p>{program.termsText}</p>}<div className="stamp-slots">{Array.from({ length: count }, (_, index) => <span className={`stamp-slot ${index < card.stampBalance % count ? "filled" : ""}`} key={index}>{index < card.stampBalance % count ? "✓" : index + 1}</span>)}</div><p><strong>{card.stampBalance % count} / {program.targetStamps} stempel</strong> · total terkumpul {card.stampsIssued}</p><div className="stamp-note">Tunjukkan kartu ini kepada kasir: <code>{card.cardToken}</code></div><p><a className="admin-table-link" href={`/${storeSlug}/stamp?card=${encodeURIComponent(card.cardToken)}`}>Simpan tautan kartu</a></p>{error && <p className="form-error">{error}</p>}</section>;
}
