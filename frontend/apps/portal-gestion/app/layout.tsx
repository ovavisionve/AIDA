import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIDA Gestión - Portal 5",
  description: "Gestión de integraciones y monitoreo - Imprenta Digital AIDA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
