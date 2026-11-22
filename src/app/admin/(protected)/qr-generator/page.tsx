import { AdminQrGenerator } from "@/components/admin-qr-generator";

export default function QrGeneratorPage() {
  return (
    <>
      <div className="admin-page-heading">
        <span className="admin-eyebrow">Inventaris fisik</span>
        <h1>Generator QR</h1>
        <p>Buat kode unik untuk dicetak di stand akrilik atau stiker toko.</p>
      </div>
      <AdminQrGenerator />
    </>
  );
}
