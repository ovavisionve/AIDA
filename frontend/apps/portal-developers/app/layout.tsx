import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIDA - Portal Developers",
  description: "Portal para desarrolladores: API keys, documentacion, ejemplos de integracion con AIDA Imprenta Digital",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-gradient-to-br from-gray-900 via-aida-dark to-aida-primary text-white antialiased">
        {children}
      </body>
    </html>
  );
}
