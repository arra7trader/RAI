"use client";

import QRCode from "qrcode";
import { useState } from "react";

type GeneratedCode = { id: string; code: string; label: string };
type QrAsset = { png: string; svg: string };

export function AdminQrGenerator() {
  const [quantity, setQuantity] = useState("12");
  const [labelPrefix, setLabelPrefix] = useState("QR Baru");
  const [codes, setCodes] = useState<GeneratedCode[]>([]);
  const [qrImages, setQrImages] = useState<Record<string, QrAsset>>({});
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function createBatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCodes([]);
    setQrImages({});
    setIsCreating(true);

    try {
      const response = await fetch("/api/admin/qr-batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity: Number(quantity), labelPrefix }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "QR gagal dibuat. Coba lagi.");
        return;
      }

      const generatedCodes = result.codes as GeneratedCode[];
      setCodes(generatedCodes);
      const imageEntries = await Promise.all(generatedCodes.map(async (item) => {
        const target = `${window.location.origin}/q/${item.code}`;
        const options = {
          errorCorrectionLevel: "H",
          margin: 2,
          width: 512,
          color: { dark: "#1d1d1f", light: "#ffffff" },
        } as const;
        const [png, svg] = await Promise.all([
          QRCode.toDataURL(target, options),
          QRCode.toString(target, { ...options, type: "svg" }),
        ]);
        return [item.id, { png, svg: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` }] as const;
      }));
      setQrImages(Object.fromEntries(imageEntries));
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <form className="admin-card admin-form-grid qr-batch-form" onSubmit={createBatch}>
        <div className="admin-field">
          <label htmlFor="quantity">Jumlah QR</label>
          <input id="quantity" type="number" min={1} max={100} value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
          <span className="admin-field-help">Buat 1–100 kode QR per batch.</span>
        </div>
        <div className="admin-field">
          <label htmlFor="labelPrefix">Awalan label</label>
          <input id="labelPrefix" value={labelPrefix} onChange={(event) => setLabelPrefix(event.target.value)} maxLength={40} required />
          <span className="admin-field-help">Label membantu tim mengenali QR setelah dicetak.</span>
        </div>
        <div className="admin-form-actions">
          <button className="button" type="submit" disabled={isCreating}>
            {isCreating ? "Membuat QR…" : "Buat batch QR"}
          </button>
          {!!codes.length && <button className="button secondary print-button" onClick={() => window.print()} type="button">Cetak lembar QR</button>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>

      {!!codes.length && (
        <section className="qr-sheet" aria-label="Hasil kode QR">
          <div className="qr-sheet-heading"><div><span className="admin-eyebrow">Siap untuk dicetak</span><h2>{codes.length} QR berhasil dibuat</h2></div><span className="admin-status">Belum diaktifkan</span></div>
          <div className="qr-print-grid">
            {codes.map((item, index) => (
              <article className="qr-print-card" key={item.id}>
                {qrImages[item.id] ? <img alt={`Kode QR ${item.code}`} src={qrImages[item.id].png} /> : <div className="qr-image-placeholder" />}
                <span>{item.label || `QR ${index + 1}`}</span>
                <strong>{item.code}</strong>
                {qrImages[item.id] && <div className="qr-downloads"><a href={qrImages[item.id].svg} download={`${item.code}.svg`}>SVG</a><a href={qrImages[item.id].png} download={`${item.code}.png`}>PNG</a></div>}
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
