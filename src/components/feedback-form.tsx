"use client";

import { useState } from "react";

export function FeedbackForm({ storeSlug }: { storeSlug: string }) {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setResult("");
    try {
      const response = await fetch(`/api/public/${storeSlug}/feedback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating, message }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Masukan gagal disimpan.");
      setResult(body.message); setMessage("");
    } catch (error) { setResult(error instanceof Error ? error.message : "Masukan gagal disimpan."); }
    finally { setBusy(false); }
  }
  return <form className="feedback-form" onSubmit={submit}>
    <label htmlFor={`rating-${storeSlug}`}>Nilai pengalaman Anda</label>
    <select id={`rating-${storeSlug}`} value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} dari 5</option>)}</select>
    <label htmlFor={`message-${storeSlug}`}>Masukan untuk toko (opsional)</label>
    <textarea id={`message-${storeSlug}`} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} />
    <button className="button secondary" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Kirim masukan privat"}</button>
    {result && <p className="admin-field-help" role="status">{result}</p>}
  </form>;
}
