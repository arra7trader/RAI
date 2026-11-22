"use client";

import { useState } from "react";

type ImportedProduct = {
  category: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
};

function parseRows(value: string): ImportedProduct[] {
  const lines = value.split(/\r?\n/).filter((line) => line.trim());
  const first = lines[0]?.split("\t")[0]?.trim().toLowerCase();
  const dataLines = first === "kategori" ? lines.slice(1) : lines;
  if (!dataLines.length) throw new Error("Tempelkan minimal satu baris produk.");
  if (dataLines.length > 250) throw new Error("Impor dibatasi 250 produk per proses.");

  return dataLines.map((line, index) => {
    const [category = "", name = "", description = "", rawPrice = "", availableText = ""] = line.split("\t");
    const rowNumber = index + (dataLines.length === lines.length ? 1 : 2);
    const priceText = rawPrice.trim().replace(/\s|Rp/gi, "");
    const validPrice = /^\d+(?:[.,]\d{3})*$/.test(priceText);
    const price = validPrice ? Number(priceText.replace(/[.,]/g, "")) : Number.NaN;
    const availability = availableText.trim().toLowerCase();
    if (!category.trim() || !name.trim() || !priceText || !Number.isSafeInteger(price) || price < 0) {
      throw new Error(`Baris ${rowNumber}: isi kategori, nama, dan harga bulat dalam rupiah.`);
    }
    if (availability && !["tersedia", "true", "1", "aktif", "tidak tersedia", "false", "0", "nonaktif"].includes(availability)) {
      throw new Error(`Baris ${rowNumber}: status harus Tersedia atau Tidak tersedia.`);
    }
    return {
      category: category.trim(),
      name: name.trim(),
      description: description.trim(),
      price,
      isAvailable: !["tidak tersedia", "false", "0", "nonaktif"].includes(availability),
    };
  });
}

export function AdminBulkProducts({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const [rows, setRows] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function importProducts(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const products = parseRows(rows);
      const response = await fetch(`/api/admin/tenants/${tenantId}/products/bulk`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ products }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Katalog gagal diimpor.");
      setStatus(`${result.count} produk berhasil ditambahkan ke ${tenantName}.`);
      setRows("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Katalog gagal diimpor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-card onboarding-form bulk-products-form" onSubmit={(event) => void importProducts(event)}>
      <span className="admin-eyebrow">Setup katalog · {tenantName}</span>
      <h2>Impor banyak produk</h2>
      <p>Salin tabel dari Excel lalu tempel. Urutan kolom: kategori, nama, deskripsi, harga (Rp), status (opsional). Maksimal 250 baris; baris judul boleh disertakan.</p>
      <div className="admin-field">
        <label htmlFor="bulk-products">Data dari Excel</label>
        <textarea id="bulk-products" value={rows} onChange={(event) => setRows(event.target.value)} rows={12} spellCheck={false} placeholder={"Kategori\tNama\tDeskripsi\tHarga\tStatus\nMakanan\tNasi goreng\tPedas sedang\t25000\tTersedia"} />
      </div>
      {status && <p className={status.includes("berhasil ditambahkan") ? "branch-group-success" : "form-error"} role="status">{status}</p>}
      <div className="admin-form-actions"><button className="button" type="submit" disabled={busy || !rows.trim()}>{busy ? "Mengimpor…" : "Impor katalog"}</button></div>
    </form>
  );
}
