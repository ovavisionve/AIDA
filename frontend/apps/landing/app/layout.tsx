import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aida.com.ve"),
  title: {
    default: "AIDA - Imprenta Digital con IA | Facturación Electrónica Venezuela",
    template: "%s | AIDA Imprenta Digital",
  },
  description:
    "AIDA es la primera imprenta digital en Venezuela potenciada por Inteligencia Artificial. Facturación electrónica, integración con SAP, Odoo, WooCommerce. Cumplimiento SENIAT automático. Emite documentos fiscales en segundos.",
  keywords: [
    "facturación electrónica Venezuela",
    "imprenta digital Venezuela",
    "facturación digital SENIAT",
    "imprenta fiscal Venezuela",
    "factura electrónica Caracas",
    "número de control SENIAT",
    "software facturación Venezuela",
    "API facturación Venezuela",
    "integración SAP facturación",
    "integración Odoo Venezuela",
    "documentos fiscales digitales",
    "providencia SNAT facturación",
    "AIDA imprenta",
    "imprenta digital con IA",
    "facturación automática Venezuela",
    "nota de crédito electrónica",
    "nota de débito digital",
    "guía de despacho electrónica",
    "retención IVA digital",
    "impresión fiscal inteligente",
  ],
  authors: [{ name: "AIDA - Imprenta Digital Inteligente" }],
  creator: "AIDA",
  publisher: "AIDA Imprenta Digital C.A.",
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: "https://aida.com.ve",
    siteName: "AIDA Imprenta Digital",
    title: "AIDA - La Imprenta Digital más Inteligente de Venezuela",
    description:
      "Emite facturas, notas de crédito, guías de despacho y retenciones en segundos. IA integrada, cumplimiento SENIAT automático, integración con cualquier ERP.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AIDA Imprenta Digital - Facturación Electrónica con IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIDA - Imprenta Digital con IA",
    description: "Facturación electrónica inteligente para Venezuela. Cumplimiento SENIAT automático.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://aida.com.ve",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="geo.region" content="VE" />
        <meta name="geo.placename" content="Caracas" />
        <meta name="geo.position" content="10.4806;-66.9036" />
        <meta name="ICBM" content="10.4806, -66.9036" />
      </head>
      <body className="font-sans antialiased bg-aida-dark text-white overflow-x-hidden">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ChatBot />
      </body>
    </html>
  );
}
