import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIDA Facturador - Sistema de Facturación",
  description: "Portal de facturación AIDA - Imprenta Digital",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
