import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIDA Gestión - Portal 5",
  description: "Gestión de integraciones y monitoreo - Imprenta Digital AIDA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0a0f1a] text-white antialiased">{children}</body>
    </html>
  );
}
