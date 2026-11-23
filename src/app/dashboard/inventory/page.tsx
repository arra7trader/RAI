import { InventoryManager } from "@/components/inventory-manager";

export default function InventoryPage() {
  return <><div className="admin-page-heading"><span className="admin-eyebrow">POS · persediaan · pembelian</span><h1>Stok & pembelian</h1><p>Catat barang masuk, pantau stok rendah, dan koreksi saldo dengan alasan.</p></div><InventoryManager /></>;
}
