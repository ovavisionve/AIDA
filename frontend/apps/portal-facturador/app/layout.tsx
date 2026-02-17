import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIDA Facturador - Sistema de Facturación",
  description: "Portal de facturación AIDA - Imprenta Digital",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0a0f1a] text-white antialiased">{children}</body>
    </html>
  );
}
