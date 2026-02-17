import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Portal de Auditoría SENIAT | AIDA",
    template: "%s | Portal SENIAT - AIDA",
  },
  description:
    "Portal de auditoría fiscal SENIAT. Acceso para auditores autorizados al sistema de verificación de documentos fiscales electrónicos emitidos a través de AIDA Imprenta Digital.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalSeniatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-aida-dark text-white">
      {children}
    </div>
  );
}
