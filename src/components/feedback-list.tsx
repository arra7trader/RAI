"use client";

import { useState } from "react";
type Item = { id: string; rating: number; message: string; status: string; createdAt: string; customer: { name: string; phoneWa: string } | null };
export function FeedbackList({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial); const [error, setError] = useState("");
  async function toggle(item: Item) { setError(""); try { const response = await fetch(`/api/owner/feedback/${item.id}`, { method: "POST" }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setItems((current) => current.map((row) => row.id === item.id ? { ...row, status: body.status } : row)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Status masukan gagal diperbarui."); } }
  return <div className="feedback-list">{error && <p className="form-error">{error}</p>}{items.map((item) => <article className="feedback-row" key={item.id}><div><strong>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</strong><span>{new Date(item.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} · {item.customer ? `${item.customer.name} · ${item.customer.phoneWa}` : "Pelanggan anonim"}</span><p>{item.message || "Rating tanpa pesan."}</p></div><button className="admin-logout" type="button" onClick={() => void toggle(item)}>{item.status === "OPEN" ? "Tandai ditangani" : "Buka kembali"}</button></article>)}{!items.length && <p className="admin-field-help">Belum ada masukan pelanggan.</p>}</div>;
}
