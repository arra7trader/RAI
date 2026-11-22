"use client";

import { useState } from "react";

type Experience = "customer" | "owner";

export function ExperienceSwitcher() {
  const [experience, setExperience] = useState<Experience>("customer");
  const isCustomer = experience === "customer";

  return (
    <div className="experience">
      <div className="experience-copy">
        <span className="eyebrow">Satu QR, dua pengalaman</span>
        <h3>{isCustomer ? "Mudah untuk pelanggan." : "Ringkas untuk owner."}</h3>
        <p>
          {isCustomer
            ? "Pelanggan scan untuk melihat katalog, memberi ulasan, dan mengenal program loyalti toko."
            : "Owner melihat ringkasan usaha dan bisa meminta bantuan Tim RAI untuk memperbarui informasi toko."}
        </p>
        <div className="switcher" aria-label="Pilih simulasi tampilan">
          <button
            type="button"
            aria-pressed={isCustomer}
            onClick={() => setExperience("customer")}
          >
            Tampilan Pembeli
          </button>
          <button
            type="button"
            aria-pressed={!isCustomer}
            onClick={() => setExperience("owner")}
          >
            Tampilan Owner
          </button>
        </div>
      </div>
      <div className="preview-card" aria-live="polite">
        <div className="phone">
          <div className="phone-top" />
          <div className="phone-kicker">{isCustomer ? "KOPI SENJA · PELANGGAN" : "KOPI SENJA · OWNER"}</div>
          <h4>{isCustomer ? "Selamat datang ☀" : "Sekilas hari ini"}</h4>
          <div className="phone-tiles">
            {isCustomer ? (
              <>
                <div className="phone-tile">Menu favorit<strong>Es Kopi Susu</strong></div>
                <div className="phone-tile">Kartu loyalti<strong>● ● ● ○ ○</strong></div>
              </>
            ) : (
              <>
                <div className="phone-tile">Pengunjung QR<strong>48</strong></div>
                <div className="phone-tile">Transaksi hari ini<strong>32</strong></div>
              </>
            )}
          </div>
          <div className="phone-action">
            {isCustomer ? "Lihat menu toko" : "Minta Tim RAI bantu atur"}
          </div>
        </div>
      </div>
    </div>
  );
}
