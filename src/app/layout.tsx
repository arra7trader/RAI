import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAI — Satu QR. Dua Dunia. Terima Beres.",
  description:
    "QR cerdas dan platform operasional UMKM. Tim RAI bantu siapkan dari katalog sampai siap dipakai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
