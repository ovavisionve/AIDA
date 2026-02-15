"""
Servicio de notificaciones por email para AIDA.

Envía documentos fiscales por email, notificaciones de sistema,
y alertas usando SMTP configurado.
"""
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime

from app.config import get_settings


class EmailService:
    """Servicio de envío de emails."""

    def __init__(self):
        self.settings = get_settings()

    def _is_configured(self) -> bool:
        return bool(self.settings.SMTP_HOST and self.settings.SMTP_USER)

    def _send_raw(self, to: str, subject: str, html_body: str, attachments: list[tuple[str, bytes]] | None = None):
        """Envía un email sincrónicamente."""
        if not self._is_configured():
            return False

        msg = MIMEMultipart("mixed")
        msg["From"] = self.settings.SMTP_FROM_EMAIL
        msg["To"] = to
        msg["Subject"] = subject

        html_part = MIMEText(html_body, "html", "utf-8")
        msg.attach(html_part)

        if attachments:
            for filename, content in attachments:
                part = MIMEApplication(content, Name=filename)
                part["Content-Disposition"] = f'attachment; filename="{filename}"'
                msg.attach(part)

        try:
            with smtplib.SMTP(self.settings.SMTP_HOST, self.settings.SMTP_PORT) as server:
                server.starttls()
                server.login(self.settings.SMTP_USER, self.settings.SMTP_PASSWORD)
                server.send_message(msg)
            return True
        except Exception:
            return False

    async def send_email(self, to: str, subject: str, html_body: str,
                         attachments: list[tuple[str, bytes]] | None = None) -> bool:
        """Envía un email asincrónicamente."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._send_raw, to, subject, html_body, attachments)

    async def send_document_email(
        self, to: str, doc_type: str, numero_control: str,
        emisor_razon: str, receptor_razon: str,
        total: float, moneda: str,
        pdf_bytes: bytes | None = None,
        xml_bytes: bytes | None = None,
    ) -> bool:
        """Envía un documento fiscal por email con PDF y XML adjuntos."""
        type_labels = {
            "factura": "Factura",
            "nota_credito": "Nota de Credito",
            "nota_debito": "Nota de Debito",
            "guia_despacho": "Guia de Despacho",
        }
        label = type_labels.get(doc_type, doc_type)
        subject = f"AIDA - {label} {numero_control} de {emisor_razon}"

        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; text-align: center;">
                <h1 style="color: #e94560; margin: 0; font-size: 24px;">AIDA Imprenta Digital</h1>
                <p style="color: #ccc; margin: 5px 0 0; font-size: 12px;">Sistema de Facturacion Electronica</p>
            </div>
            <div style="padding: 30px; background: #fff; border: 1px solid #eee;">
                <h2 style="color: #1a1a2e; margin-top: 0;">{label}</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; color: #666;">N. Control:</td><td style="padding: 8px 0; font-weight: bold;">{numero_control}</td></tr>
                    <tr><td style="padding: 8px 0; color: #666;">Emisor:</td><td style="padding: 8px 0;">{emisor_razon}</td></tr>
                    <tr><td style="padding: 8px 0; color: #666;">Receptor:</td><td style="padding: 8px 0;">{receptor_razon}</td></tr>
                    <tr><td style="padding: 8px 0; color: #666;">Total:</td><td style="padding: 8px 0; font-size: 20px; font-weight: bold; color: #e94560;">{moneda} {total:,.2f}</td></tr>
                </table>
                <p style="margin-top: 20px; font-size: 13px; color: #666;">
                    {"Se adjunta el documento en formato PDF y XML." if pdf_bytes else "El documento esta disponible para descarga en el portal."}
                </p>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <p style="font-size: 12px; color: #666; margin: 0;">Verifique este documento en</p>
                    <p style="font-size: 14px; color: #0f3460; font-weight: bold; margin: 5px 0 0;">https://validacion.aida.com.ve</p>
                </div>
            </div>
            <div style="padding: 15px; background: #f5f5f5; text-align: center; font-size: 11px; color: #999;">
                AIDA Imprenta Digital - Conforme a normativa SENIAT<br/>
                Este es un mensaje automatico, no responda a este correo.
            </div>
        </body>
        </html>
        """

        attachments = []
        if pdf_bytes:
            attachments.append((f"{doc_type}_{numero_control}.pdf", pdf_bytes))
        if xml_bytes:
            attachments.append((f"{doc_type}_{numero_control}.xml", xml_bytes))

        return await self.send_email(to, subject, html, attachments if attachments else None)

    async def send_system_notification(self, to: str, title: str, message: str) -> bool:
        """Envía una notificación del sistema."""
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; padding: 20px; text-align: center;">
                <h1 style="color: #e94560; margin: 0;">AIDA</h1>
            </div>
            <div style="padding: 30px; background: #fff; border: 1px solid #eee;">
                <h2 style="color: #1a1a2e; margin-top: 0;">{title}</h2>
                <p style="color: #555; line-height: 1.6;">{message}</p>
            </div>
            <div style="padding: 10px; background: #f5f5f5; text-align: center; font-size: 11px; color: #999;">
                AIDA Imprenta Digital - Notificacion del sistema
            </div>
        </body>
        </html>
        """
        return await self.send_email(to, f"AIDA - {title}", html)


# Singleton
_email_service: EmailService | None = None


def get_email_service() -> EmailService:
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
