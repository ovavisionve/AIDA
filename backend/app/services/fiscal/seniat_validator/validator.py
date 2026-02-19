"""
Motor Principal de Validación SENIAT V1.4

Valida un documento fiscal electrónico completo según las reglas
oficiales del SENIAT (GGTIC.GIT.00.02 / Versión 1.4).

Flujo de validación:
1. Validar estructura (campos presentes)
2. Validar formatos (longitudes, tipos de dato, fechas, horas)
3. Validar campos obligatorios según tipo de documento
4. Validar catálogos (valores permitidos)
5. Validar cálculos (totales, IVA, retenciones)
6. Validar cross-checks (otra moneda, formas de pago)
"""

from __future__ import annotations

import re
from datetime import datetime

from .catalogs import (
    TIPO_DOCUMENTO, TIPO_PROVEEDOR, TIPO_TRANSACCION, TIPO_IDENTIFICACION,
    ALICUOTAS_IVA, FORMAS_PAGO, CODIGOS_IVA_TODOS,
    TIPOS_NOTAS, TIPOS_RETENCION, TIPOS_GUIA,
    MONEDA_CURSO_LEGAL, TIPO_COMPROBANTE_ISLR, TIPO_SUJETO_RETENIDO,
)
from .errors import ValidationCodes as VC, HttpCodes, ValidationResult
from .schemas import DocumentoElectronico
from .calculator import (
    validar_items, validar_totales, validar_totales_otra_moneda, validar_retenciones,
)

# Regex patterns
FECHA_PATTERN = re.compile(r"^\d{2}/\d{2}/\d{4}$")  # DD/MM/AAAA
HORA_12H_PATTERN = re.compile(r"^\d{2}:\d{2}:\d{2}\s*(am|pm|a\.m\.|p\.m\.)$", re.IGNORECASE)
NUMERO_CONTROL_PATTERN = re.compile(r"^\d{2}-\d{8,}$")
HEX_PATTERN = re.compile(r"^[0-9a-fA-F]+$")

# Longitudes máximas por campo (de la hoja Excel SENIAT V1.4)
MAX_LENGTHS = {
    "tipoDocumento": 2,
    "tipoProveedor": 4,
    "tipoTransaccion": 2,
    "numPlanillaImportacion": 20,
    "numExpedienteImportacion": 20,
    "serieFacturaAfectada": 20,
    "comentarioFacturaAfectada": 255,
    "montoFacturaAfectada": 10,
    "regimenEspTributacion": 60,
    "fechaEmision": 10,
    "fechaVencimiento": 10,
    "horaEmision": 10,
    "tipoDePago": 30,
    "serie": 20,
    "tipoDeVenta": 25,
    "moneda": 3,
    "transaccionId": 50,
    "banner": 35,
    "razonSocial": 255,
    "direccion": 260,
    "pais": 2,
    "descripcion": 255,
    "unidadMedida": 3,
    "codigoPLU": 20,
    "codigoInterno": 25,
}


class SeniatValidator:
    """
    Motor de validación de documentos fiscales SENIAT V1.4.

    Uso:
        validator = SeniatValidator()
        result = validator.validate(documento_dict)

        if result.is_valid:
            # Documento válido, procesar
        else:
            # Devolver errores
            print(result.to_dict())
    """

    def validate(self, data: dict) -> ValidationResult:
        """
        Valida un documento fiscal completo.

        Args:
            data: Diccionario con la estructura JSON SENIAT V1.4

        Returns:
            ValidationResult con errores y advertencias
        """
        result = ValidationResult(is_valid=True, http_code=HttpCodes.SUCCESS)

        # Parse del documento
        try:
            doc = DocumentoElectronico.model_validate(data)
        except Exception as e:
            result.is_valid = False
            result.http_code = HttpCodes.BAD_REQUEST
            result.add_error(VC.FORMATO_INCORRECTO, "root",
                             f"Error al parsear el documento: {str(e)[:200]}")
            return result

        # 1. Validar encabezado
        if not doc.encabezado:
            result.add_error(VC.CAMPO_REQUERIDO, "encabezado", "El nodo encabezado es requerido")
            return result

        if not doc.encabezado.identificacionDocumento:
            result.add_error(VC.CAMPO_REQUERIDO, "encabezado.identificacionDocumento",
                             "El subnodo identificacionDocumento es requerido")
            return result

        tipo_doc = doc.encabezado.identificacionDocumento.tipoDocumento

        # 2. Validar identificación del documento
        self._validar_identificacion(doc, result)

        # 3. Validar comprador (obligatorio para facturas, notas)
        self._validar_comprador(doc, result)

        # 4. Validar sujeto retenido (solo retenciones)
        if tipo_doc in TIPOS_RETENCION:
            self._validar_sujeto_retenido(doc, result)

        # 5. Validar detalle de ítems (obligatorio para facturas, notas, guías)
        if tipo_doc not in TIPOS_RETENCION:
            self._validar_detalle_items_estructura(doc, result)

        # 6. Validar totales (estructura)
        self._validar_totales_estructura(doc, result)

        # 7. Validar formas de pago
        self._validar_formas_pago(doc, result)

        # 8. Validar guía de despacho (si tipo 04)
        if tipo_doc in TIPOS_GUIA:
            self._validar_guia_despacho(doc, result)

        # 9. Validar info adicional
        self._validar_info_adicional(doc, result)

        # 10. Validar CÁLCULOS (ítems)
        validar_items(doc, result)

        # 11. Validar CÁLCULOS (totales)
        validar_totales(doc, result)

        # 12. Validar CÁLCULOS (otra moneda)
        validar_totales_otra_moneda(doc, result)

        # 13. Validar CÁLCULOS (retenciones)
        if tipo_doc in TIPOS_RETENCION:
            validar_retenciones(doc, result)

        return result

    # =========================================================================
    # Validación de Identificación del Documento
    # =========================================================================
    def _validar_identificacion(self, doc: DocumentoElectronico, result: ValidationResult) -> None:
        ident = doc.encabezado.identificacionDocumento
        path = "encabezado.identificacionDocumento"

        # tipoDocumento (obligatorio, catálogo 1)
        if not ident.tipoDocumento:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.tipoDocumento")
        elif ident.tipoDocumento not in TIPO_DOCUMENTO:
            result.add_error(VC.TIPO_DOCUMENTO_INVALIDO, f"{path}.tipoDocumento",
                             f"Valor '{ident.tipoDocumento}' no está en Catálogo 1")
        self._check_length(ident.tipoDocumento, 2, f"{path}.tipoDocumento", result)

        # numeroDocumento (obligatorio)
        if ident.numeroDocumento is None:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.numeroDocumento")
        elif len(str(ident.numeroDocumento)) > 19:
            result.add_error(VC.LONGITUD_EXCEDIDA, f"{path}.numeroDocumento", "Máximo 19 dígitos")

        # tipoProveedor (opcional, catálogo 2)
        if ident.tipoProveedor and ident.tipoProveedor not in TIPO_PROVEEDOR:
            result.add_error(VC.FORMATO_INCORRECTO, f"{path}.tipoProveedor",
                             f"Valor '{ident.tipoProveedor}' no está en Catálogo 2")

        # tipoTransaccion (opcional, catálogo 3)
        if ident.tipoTransaccion and ident.tipoTransaccion not in TIPO_TRANSACCION:
            result.add_error(VC.FORMATO_INCORRECTO, f"{path}.tipoTransaccion",
                             f"Valor '{ident.tipoTransaccion}' no está en Catálogo 3")

        # Campos obligatorios para Notas (tipo 02 y 03) - código 108
        if ident.tipoDocumento in TIPOS_NOTAS:
            if ident.numeroFacturaAfectada is None:
                result.add_error(VC.CAMPO_REQUERIDO_NOTAS, f"{path}.numeroFacturaAfectada")
            if not ident.fechaFacturaAfectada:
                result.add_error(VC.CAMPO_REQUERIDO_NOTAS, f"{path}.fechaFacturaAfectada")
            elif not FECHA_PATTERN.match(ident.fechaFacturaAfectada):
                result.add_error(VC.FECHA_INVALIDA, f"{path}.fechaFacturaAfectada",
                                 f"Formato requerido: DD/MM/AAAA, recibido: '{ident.fechaFacturaAfectada}'")
            if not ident.montoFacturaAfectada and ident.montoFacturaAfectada != "":
                result.add_error(VC.CAMPO_REQUERIDO_NOTAS, f"{path}.montoFacturaAfectada")

        # fechaEmision (obligatorio)
        if not ident.fechaEmision:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.fechaEmision")
        else:
            if not FECHA_PATTERN.match(ident.fechaEmision):
                result.add_error(VC.FECHA_INVALIDA, f"{path}.fechaEmision",
                                 f"Formato DD/MM/AAAA, recibido: '{ident.fechaEmision}'")
            else:
                # No puede ser fecha futura (115)
                try:
                    fecha = datetime.strptime(ident.fechaEmision, "%d/%m/%Y")
                    if fecha.date() > datetime.now().date():
                        result.add_error(VC.FECHA_FUTURA, f"{path}.fechaEmision",
                                         "No se puede emitir un documento con fecha futura")
                except ValueError:
                    result.add_error(VC.FECHA_INVALIDA, f"{path}.fechaEmision")

        # fechaVencimiento (opcional, validar formato si está)
        if ident.fechaVencimiento:
            if not FECHA_PATTERN.match(ident.fechaVencimiento):
                result.add_error(VC.FECHA_VENCIMIENTO_INVALIDA, f"{path}.fechaVencimiento",
                                 f"Formato DD/MM/AAAA, recibido: '{ident.fechaVencimiento}'")

        # horaEmision (obligatorio, formato 12h)
        if not ident.horaEmision:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.horaEmision")
        elif not HORA_12H_PATTERN.match(ident.horaEmision):
            result.add_error(VC.HORA_INVALIDA, f"{path}.horaEmision",
                             f"Formato hh:mm:ss am/pm, recibido: '{ident.horaEmision}'")

        # moneda (obligatorio, catálogo 6)
        if not ident.moneda:
            result.add_error(VC.MONEDA_INVALIDA, f"{path}.moneda")
        elif len(ident.moneda) != 3 or not ident.moneda.isalpha():
            result.add_error(VC.MONEDA_INVALIDA, f"{path}.moneda",
                             f"Código ISO 4217 de 3 letras requerido, recibido: '{ident.moneda}'")

        # transaccionId (opcional, hexadecimal)
        if ident.transaccionId:
            if len(ident.transaccionId) > 50:
                result.add_error(VC.LONGITUD_EXCEDIDA, f"{path}.transaccionId", "Máximo 50 caracteres")

    # =========================================================================
    # Validación del Comprador
    # =========================================================================
    def _validar_comprador(self, doc: DocumentoElectronico, result: ValidationResult) -> None:
        comp = doc.encabezado.comprador
        path = "encabezado.comprador"

        if not comp:
            tipo_doc = doc.encabezado.identificacionDocumento.tipoDocumento
            if tipo_doc not in TIPOS_RETENCION:
                result.add_error(VC.CAMPO_REQUERIDO, path, "Comprador requerido")
            return

        # tipoIdentificacion (obligatorio, catálogo 7)
        if not comp.tipoIdentificacion:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.tipoIdentificacion")
        elif comp.tipoIdentificacion not in TIPO_IDENTIFICACION:
            result.add_error(VC.TIPO_DOCUMENTO_INVALIDO, f"{path}.tipoIdentificacion",
                             f"Valor '{comp.tipoIdentificacion}' no está en Catálogo 7")
        self._check_length(comp.tipoIdentificacion, 1, f"{path}.tipoIdentificacion", result)

        # numeroIdentificacion (obligatorio, máx 20)
        if not comp.numeroIdentificacion:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.numeroIdentificacion")
        self._check_length(comp.numeroIdentificacion, 20, f"{path}.numeroIdentificacion", result)

        # razonSocial (obligatorio, máx 255)
        if not comp.razonSocial:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.razonSocial")
        self._check_length(comp.razonSocial, 255, f"{path}.razonSocial", result)

        # dirección (obligatorio)
        if not comp.direccion:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.direccion")
        self._check_length(comp.direccion, 260, f"{path}.direccion", result)

        # país (obligatorio, catálogo 8)
        if not comp.pais:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.pais")
        self._check_length(comp.pais, 2, f"{path}.pais", result)

    # =========================================================================
    # Validación del Sujeto Retenido
    # =========================================================================
    def _validar_sujeto_retenido(self, doc: DocumentoElectronico, result: ValidationResult) -> None:
        sr = doc.encabezado.sujetoRetenido
        path = "encabezado.sujetoRetenido"

        if not sr:
            result.add_error(VC.CAMPO_REQUERIDO, path, "Sujeto retenido obligatorio para retenciones")
            return

        if not sr.tipoIdentificacion:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.tipoIdentificacion")
        elif sr.tipoIdentificacion not in TIPO_IDENTIFICACION:
            result.add_error(VC.TIPO_DOCUMENTO_INVALIDO, f"{path}.tipoIdentificacion")

        if not sr.numeroIdentificacion:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.numeroIdentificacion")
        self._check_length(sr.numeroIdentificacion, 20, f"{path}.numeroIdentificacion", result)

        if not sr.razonSocial:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.razonSocial")

        if not sr.direccion:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.direccion")

    # =========================================================================
    # Validación de Detalle Items (estructura)
    # =========================================================================
    def _validar_detalle_items_estructura(self, doc: DocumentoElectronico, result: ValidationResult) -> None:
        items = doc.detalleItems
        if not items:
            result.add_error(VC.CAMPO_REQUERIDO, "detalleItems",
                             "Al menos un ítem es requerido para este tipo de documento")
            return

        for i, item in enumerate(items):
            path = f"detalleItems[{i}]"

            # numeroLinea (obligatorio)
            if item.numeroLinea is None:
                result.add_error(VC.CAMPO_REQUERIDO, f"{path}.numeroLinea")

            # indicadorBienoServicio (obligatorio)
            if not item.indicadorBienoServicio:
                result.add_error(VC.CAMPO_REQUERIDO, f"{path}.indicadorBienoServicio")

            # descripcion (obligatorio, mín 2 chars)
            if not item.descripcion:
                result.add_error(VC.CAMPO_REQUERIDO, f"{path}.descripcion")
            self._check_length(item.descripcion, 255, f"{path}.descripcion", result)

            # cantidad (obligatorio)
            if item.cantidad is None:
                result.add_error(VC.CAMPO_REQUERIDO, f"{path}.cantidad")

            # unidadMedida (obligatorio)
            if not item.unidadMedida:
                result.add_error(VC.CAMPO_REQUERIDO, f"{path}.unidadMedida")

            # precioUnitario (obligatorio)
            if item.precioUnitario is None:
                result.add_error(VC.CAMPO_REQUERIDO, f"{path}.precioUnitario")

            # precioItem (obligatorio)
            if item.precioItem is None:
                result.add_error(VC.CAMPO_REQUERIDO, f"{path}.precioItem")

            # codigoImpuesto (obligatorio, catálogo 9)
            if not item.codigoImpuesto:
                result.add_error(VC.CAMPO_REQUERIDO, f"{path}.codigoImpuesto")
            elif item.codigoImpuesto not in CODIGOS_IVA_TODOS:
                result.add_error(VC.TIPO_DOCUMENTO_INVALIDO, f"{path}.codigoImpuesto",
                                 f"Código '{item.codigoImpuesto}' no está en Catálogo 9")

            # valorTotalItem (obligatorio)
            if item.valorTotalItem is None:
                result.add_error(VC.CAMPO_REQUERIDO, f"{path}.valorTotalItem")

    # =========================================================================
    # Validación de Totales (estructura)
    # =========================================================================
    def _validar_totales_estructura(self, doc: DocumentoElectronico, result: ValidationResult) -> None:
        totales = doc.encabezado.totales
        if not totales:
            return

        path = "encabezado.totales"

        # Campos obligatorios
        if totales.subtotal is None:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.subtotal")
        if totales.totalIVA is None:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.totalIVA")
        if totales.montoTotalConIVA is None:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.montoTotalConIVA")
        if totales.totalAPagar is None:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.totalAPagar")

        # impuestosSubtotal (al menos uno requerido)
        if not totales.impuestosSubtotal:
            result.add_error(VC.CODIGO_IMPUESTO_SUBTOTAL_INVALIDO, f"{path}.impuestosSubtotal",
                             "Al menos una alícuota de impuesto requerida")

    # =========================================================================
    # Validación de Formas de Pago
    # =========================================================================
    def _validar_formas_pago(self, doc: DocumentoElectronico, result: ValidationResult) -> None:
        totales = doc.encabezado.totales
        if not totales or not totales.formasPago:
            return

        for j, fp in enumerate(totales.formasPago):
            path = f"encabezado.totales.formasPago[{j}]"

            # monto requerido (1016)
            if fp.monto is None:
                result.add_error(VC.MONTO_PAGO_FALTANTE, f"{path}.monto")

            # moneda requerida (1017)
            if not fp.moneda:
                result.add_error(VC.MONEDA_PAGO_FALTANTE, f"{path}.moneda")

            # tipoCambio requerido si moneda no es Bs (1018)
            if fp.moneda and fp.moneda != MONEDA_CURSO_LEGAL and fp.tipoCambio is None:
                result.add_error(VC.TIPO_CAMBIO_PAGO_FALTANTE, f"{path}.tipoCambio",
                                 f"Requerido para moneda '{fp.moneda}'")

            # forma de pago debe estar en catálogo 10
            if fp.forma and fp.forma not in FORMAS_PAGO:
                result.add_error(VC.FORMATO_INCORRECTO, f"{path}.forma",
                                 f"Forma de pago '{fp.forma}' no está en Catálogo 10")

            # fecha requerida
            if fp.fecha and not FECHA_PATTERN.match(fp.fecha):
                result.add_error(VC.FECHA_INVALIDA, f"{path}.fecha",
                                 f"Formato DD/MM/AAAA requerido")

        # Si solo hay una forma de pago, monto debe coincidir con totalAPagar (1016)
        if len(totales.formasPago) == 1 and totales.formasPago[0].monto is not None and totales.totalAPagar is not None:
            from .calculator import _approx, TOLERANCIA
            # Solo verificar si misma moneda base
            if totales.formasPago[0].moneda == doc.encabezado.identificacionDocumento.moneda:
                if not _approx(totales.formasPago[0].monto, totales.totalAPagar, TOLERANCIA):
                    result.add_error(VC.MONTO_PAGO_FALTANTE,
                                     "encabezado.totales.formasPago[0].monto",
                                     f"Con pago único, monto ({totales.formasPago[0].monto}) debe coincidir con totalAPagar ({totales.totalAPagar})")

    # =========================================================================
    # Validación de Guía de Despacho
    # =========================================================================
    def _validar_guia_despacho(self, doc: DocumentoElectronico, result: ValidationResult) -> None:
        guia = doc.guiaDespacho
        if not guia:
            result.add_error(VC.INFO_REQUERIDA_GUIA, "guiaDespacho",
                             "Nodo guiaDespacho requerido para tipo documento 04")
            return

        path = "guiaDespacho"

        if not guia.esGuiaDespacho:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.esGuiaDespacho")

        if not guia.motivoTraslado:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.motivoTraslado")

        if not guia.origenProducto:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.origenProducto")

        if not guia.destinoProducto:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.destinoProducto")

        if not guia.nombreCompleto:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.nombreCompleto",
                             "Nombre del conductor requerido")

        if not guia.tipoIdentificacion:
            result.add_error(VC.CAMPO_REQUERIDO, f"{path}.tipoIdentificacion")

    # =========================================================================
    # Validación de Info Adicional
    # =========================================================================
    def _validar_info_adicional(self, doc: DocumentoElectronico, result: ValidationResult) -> None:
        if not doc.InfoAdicional:
            return

        for i, info in enumerate(doc.InfoAdicional):
            path = f"InfoAdicional[{i}]"

            # No debe contener la palabra "Total" (1050)
            if info.campo and "total" in info.campo.lower():
                result.add_error(VC.PALABRA_RESERVADA, f"{path}.campo",
                                 "Uso de palabra reservada 'Total' en información adicional")
            if info.valor and "total" in info.valor.lower().split():
                result.add_error(VC.PALABRA_RESERVADA, f"{path}.valor",
                                 "Uso de palabra reservada 'Total' en información adicional")

    # =========================================================================
    # Utilidades
    # =========================================================================
    def _check_length(self, value: str | None, max_len: int, field_path: str,
                      result: ValidationResult) -> None:
        """Verifica que un campo no exceda la longitud máxima."""
        if value and len(str(value)) > max_len:
            result.add_error(VC.LONGITUD_EXCEDIDA, field_path,
                             f"Máximo {max_len} caracteres, recibido {len(str(value))}")
