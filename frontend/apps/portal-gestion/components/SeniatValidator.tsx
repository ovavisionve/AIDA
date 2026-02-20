"use client";
import { useState, useCallback } from "react";

/* ─────────────── Validation Rules (SENIAT V1.4) ─────────────── */

interface VError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

const VALID_DOC_TYPES = ["01", "02", "03", "04", "07", "08"];
const VALID_TIPO_PROV = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "NA"];
const VALID_TIPO_TRANS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const VALID_TIPO_ID = ["V", "J", "E", "P", "G", "C"];
const VALID_MONEDAS = ["VES", "USD", "EUR", "GBP", "COP", "BRL", "MXN", "ARS", "CLP", "PEN", "CNY", "JPY"];
const VALID_BIEN_SERV = ["B", "S"];
const VALID_TASAS_IVA = [0, 8, 16, 31];

const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;
const HORA_RE = /^\d{2}:\d{2}:\d{2}(am|pm)$/;
const RIF_RE = /^[VJEPGC]-\d{5,9}(-\d)?$/;

/* ─────────────── Helpers ─────────────── */

function getIn(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

function isObj(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/* ─────────────── Core Validator ─────────────── */

function validateSeniatJSON(doc: any): VError[] {
  const errors: VError[] = [];
  const e = (path: string, message: string, severity: "error" | "warning" = "error") =>
    errors.push({ path, message, severity });

  // Root structure
  if (!isObj(doc)) {
    e("$", "El documento debe ser un objeto JSON");
    return errors;
  }

  if (!doc.encabezado) {
    e("encabezado", "Sección 'encabezado' es requerida");
    return errors;
  }

  const enc = doc.encabezado;
  const idDoc = enc.identificacionDocumento;

  // ── identificacionDocumento ──
  if (!idDoc) {
    e("encabezado.identificacionDocumento", "Sección requerida");
  } else {
    const tipoDoc = String(idDoc.tipoDocumento).padStart(2, "0");

    if (!idDoc.tipoDocumento && idDoc.tipoDocumento !== 0) {
      e("encabezado.identificacionDocumento.tipoDocumento", "Campo requerido");
    } else if (!VALID_DOC_TYPES.includes(tipoDoc)) {
      e("encabezado.identificacionDocumento.tipoDocumento", `Valor '${idDoc.tipoDocumento}' no válido. Permitidos: ${VALID_DOC_TYPES.join(", ")}`);
    }

    if (!idDoc.numeroDocumento && idDoc.numeroDocumento !== 0) {
      e("encabezado.identificacionDocumento.numeroDocumento", "Campo requerido");
    } else if (String(idDoc.numeroDocumento).length > 19) {
      e("encabezado.identificacionDocumento.numeroDocumento", "Máximo 19 dígitos");
    }

    if (idDoc.tipoProveedor !== undefined && idDoc.tipoProveedor !== null) {
      if (!VALID_TIPO_PROV.includes(String(idDoc.tipoProveedor))) {
        e("encabezado.identificacionDocumento.tipoProveedor", `Valor '${idDoc.tipoProveedor}' no válido. Catálogo 2: ${VALID_TIPO_PROV.join(", ")}`);
      }
    } else if (["01", "02", "03"].includes(tipoDoc)) {
      e("encabezado.identificacionDocumento.tipoProveedor", "Requerido para Factura, NC y ND (tipos 01, 02, 03)");
    }

    if (idDoc.tipoTransaccion !== undefined && idDoc.tipoTransaccion !== null) {
      const tt = String(idDoc.tipoTransaccion).padStart(2, "0");
      if (!VALID_TIPO_TRANS.includes(tt)) {
        e("encabezado.identificacionDocumento.tipoTransaccion", `Valor '${idDoc.tipoTransaccion}' no válido. Catálogo 3: ${VALID_TIPO_TRANS.join(", ")}`);
      }
    } else if (["01", "02", "03", "04"].includes(tipoDoc)) {
      e("encabezado.identificacionDocumento.tipoTransaccion", "Requerido para tipos 01, 02, 03, 04");
    }

    // NC/ND require factura afectada
    if (["02", "03"].includes(tipoDoc)) {
      if (!idDoc.numeroFacturaAfectada && idDoc.numeroFacturaAfectada !== 0) {
        e("encabezado.identificacionDocumento.numeroFacturaAfectada", `Requerido para ${tipoDoc === "02" ? "Nota de Crédito" : "Nota de Débito"}`);
      }
      if (!idDoc.fechaFacturaAfectada) {
        e("encabezado.identificacionDocumento.fechaFacturaAfectada", `Requerido para ${tipoDoc === "02" ? "NC" : "ND"} — formato DD/MM/AAAA`);
      }
    }

    if (idDoc.fechaEmision) {
      if (!DATE_RE.test(idDoc.fechaEmision)) {
        e("encabezado.identificacionDocumento.fechaEmision", "Formato inválido. Esperado: DD/MM/AAAA");
      }
    } else {
      e("encabezado.identificacionDocumento.fechaEmision", "Campo requerido");
    }

    if (idDoc.horaEmision) {
      if (!HORA_RE.test(idDoc.horaEmision)) {
        e("encabezado.identificacionDocumento.horaEmision", "Formato inválido. Esperado: HH:MM:SSam/pm");
      }
    } else {
      e("encabezado.identificacionDocumento.horaEmision", "Campo requerido");
    }

    if (idDoc.moneda) {
      if (!VALID_MONEDAS.includes(idDoc.moneda)) {
        e("encabezado.identificacionDocumento.moneda", `Moneda '${idDoc.moneda}' no reconocida. Usar ISO 4217`, "warning");
      }
    } else {
      e("encabezado.identificacionDocumento.moneda", "Campo requerido");
    }

    if (!idDoc.tipoDePago) {
      e("encabezado.identificacionDocumento.tipoDePago", "Campo requerido");
    }

    if (!idDoc.tipoDeVenta) {
      e("encabezado.identificacionDocumento.tipoDeVenta", "Campo requerido");
    }
  }

  // ── comprador ──
  const comp = enc.comprador;
  if (!comp) {
    if (idDoc && ["01", "02", "03", "04"].includes(String(idDoc?.tipoDocumento).padStart(2, "0"))) {
      e("encabezado.comprador", "Sección requerida para Facturas, NC, ND y Guías");
    }
  } else {
    if (comp.tipoIdentificacion) {
      if (!VALID_TIPO_ID.includes(comp.tipoIdentificacion)) {
        e("encabezado.comprador.tipoIdentificacion", `Valor '${comp.tipoIdentificacion}' no válido. Permitidos: ${VALID_TIPO_ID.join(", ")}`);
      }
    } else {
      e("encabezado.comprador.tipoIdentificacion", "Campo requerido");
    }

    if (comp.numeroIdentificacion) {
      if (!RIF_RE.test(comp.numeroIdentificacion)) {
        e("encabezado.comprador.numeroIdentificacion", "Formato sugerido: X-NNNNNNNN(-N)", "warning");
      }
    } else {
      e("encabezado.comprador.numeroIdentificacion", "Campo requerido");
    }

    if (!comp.razonSocial) e("encabezado.comprador.razonSocial", "Campo requerido");
    if (!comp.direccion) e("encabezado.comprador.direccion", "Campo requerido");
    if (!comp.pais) e("encabezado.comprador.pais", "Campo requerido (ISO 3166)");
  }

  // ── sujetoRetenido (para retenciones) ──
  if (idDoc) {
    const tipoDoc = String(idDoc.tipoDocumento).padStart(2, "0");
    if (["07", "08"].includes(tipoDoc)) {
      const sr = enc.sujetoRetenido;
      if (!sr) {
        e("encabezado.sujetoRetenido", `Sección requerida para Retención ${tipoDoc === "07" ? "IVA" : "ISLR"}`);
      } else {
        if (!sr.tipoIdentificacion) e("encabezado.sujetoRetenido.tipoIdentificacion", "Campo requerido");
        if (!sr.numeroIdentificacion) e("encabezado.sujetoRetenido.numeroIdentificacion", "Campo requerido");
        if (!sr.razonSocial) e("encabezado.sujetoRetenido.razonSocial", "Campo requerido");
        if (!sr.pais) e("encabezado.sujetoRetenido.pais", "Campo requerido");
      }
    }
  }

  // ── totales ──
  const tot = enc.totales;
  if (idDoc && ["01", "02", "03", "04"].includes(String(idDoc?.tipoDocumento).padStart(2, "0"))) {
    if (!tot) {
      e("encabezado.totales", "Sección requerida");
    } else {
      if (tot.nroItems === undefined) e("encabezado.totales.nroItems", "Campo requerido");
      if (tot.subtotal === undefined) e("encabezado.totales.subtotal", "Campo requerido");
      if (tot.totalIVA === undefined) e("encabezado.totales.totalIVA", "Campo requerido");
      if (tot.montoTotalConIVA === undefined) e("encabezado.totales.montoTotalConIVA", "Campo requerido");
      if (tot.totalAPagar === undefined) e("encabezado.totales.totalAPagar", "Campo requerido");
      if (!tot.formasPago || (Array.isArray(tot.formasPago) && tot.formasPago.length === 0)) {
        e("encabezado.totales.formasPago", "Debe incluir al menos una forma de pago");
      }
      if (!tot.impuestosSubtotal || (Array.isArray(tot.impuestosSubtotal) && tot.impuestosSubtotal.length === 0)) {
        e("encabezado.totales.impuestosSubtotal", "Debe incluir desglose de impuestos");
      }

      // Cross-check nroItems vs detalleItems
      if (doc.detalleItems && Array.isArray(doc.detalleItems) && tot.nroItems !== undefined) {
        if (tot.nroItems !== doc.detalleItems.length) {
          e("encabezado.totales.nroItems", `nroItems (${tot.nroItems}) no coincide con detalleItems.length (${doc.detalleItems.length})`, "warning");
        }
      }
    }
  }

  // ── totalRetencion (para retenciones) ──
  if (idDoc && ["07", "08"].includes(String(idDoc?.tipoDocumento).padStart(2, "0"))) {
    const tr = enc.totalRetencion;
    if (!tr) {
      e("encabezado.totalRetencion", "Sección requerida para retenciones");
    } else {
      if (tr.totalBaseImponible === undefined) e("encabezado.totalRetencion.totalBaseImponible", "Campo requerido");
      if (tr.totalRetenido === undefined) e("encabezado.totalRetencion.totalRetenido", "Campo requerido");
      if (!tr.fechaEmisionCR) e("encabezado.totalRetencion.fechaEmisionCR", "Campo requerido (DD/MM/AAAA)");
    }
  }

  // ── detalleItems ──
  if (doc.detalleItems) {
    if (!Array.isArray(doc.detalleItems)) {
      e("detalleItems", "Debe ser un array");
    } else {
      doc.detalleItems.forEach((item: any, idx: number) => {
        const p = `detalleItems[${idx}]`;
        if (item.numeroLinea === undefined) e(`${p}.numeroLinea`, "Campo requerido");
        if (!item.descripcion) e(`${p}.descripcion`, "Campo requerido");
        if (item.cantidad === undefined) e(`${p}.cantidad`, "Campo requerido");
        if (item.precioUnitario === undefined) e(`${p}.precioUnitario`, "Campo requerido");
        if (item.precioItem === undefined) e(`${p}.precioItem`, "Campo requerido");
        if (item.valorTotalItem === undefined) e(`${p}.valorTotalItem`, "Campo requerido");

        if (item.indicadorBienoServicio && !VALID_BIEN_SERV.includes(item.indicadorBienoServicio)) {
          e(`${p}.indicadorBienoServicio`, `Valor '${item.indicadorBienoServicio}' no válido. Usar B o S`);
        } else if (!item.indicadorBienoServicio) {
          e(`${p}.indicadorBienoServicio`, "Campo requerido (B = Bien, S = Servicio)");
        }

        if (item.tasaIVA !== undefined && !VALID_TASAS_IVA.includes(Number(item.tasaIVA))) {
          e(`${p}.tasaIVA`, `Tasa '${item.tasaIVA}' no estándar. Permitidas: ${VALID_TASAS_IVA.join(", ")}%`, "warning");
        }

        if (item.valorIVA === undefined) e(`${p}.valorIVA`, "Campo requerido");
        if (!item.unidadMedida) e(`${p}.unidadMedida`, "Campo requerido (UN/ECE Rec 20)");
      });
    }
  } else if (idDoc && ["01", "02", "03", "04"].includes(String(idDoc?.tipoDocumento).padStart(2, "0"))) {
    e("detalleItems", "Requerido para Facturas, NC, ND y Guías de Despacho");
  }

  // ── detallesRetencion ──
  if (idDoc && ["07", "08"].includes(String(idDoc?.tipoDocumento).padStart(2, "0"))) {
    if (!doc.detallesRetencion || !Array.isArray(doc.detallesRetencion) || doc.detallesRetencion.length === 0) {
      e("detallesRetencion", "Requerido para retenciones IVA/ISLR");
    } else {
      doc.detallesRetencion.forEach((det: any, idx: number) => {
        const p = `detallesRetencion[${idx}]`;
        if (det.numeroLinea === undefined) e(`${p}.numeroLinea`, "Campo requerido");
        if (!det.fechaDocumento) e(`${p}.fechaDocumento`, "Campo requerido");
        if (det.tipoDocumento === undefined) e(`${p}.tipoDocumento`, "Campo requerido");
        if (det.baseImponible === undefined) e(`${p}.baseImponible`, "Campo requerido");
        if (det.porcentajeRetencion === undefined) e(`${p}.porcentajeRetencion`, "Campo requerido");
        if (det.retenido === undefined) e(`${p}.retenido`, "Campo requerido");
      });
    }
  }

  // ── guiaDespacho ──
  if (idDoc && String(idDoc?.tipoDocumento).padStart(2, "0") === "04") {
    if (!doc.guiaDespacho) {
      e("guiaDespacho", "Requerido para Guía de Despacho (tipo 04)");
    } else {
      if (doc.guiaDespacho.esGuiaDespacho !== "1" && doc.guiaDespacho.esGuiaDespacho !== 1) {
        e("guiaDespacho.esGuiaDespacho", "Debe ser '1' para Guía de Despacho");
      }
      if (!doc.guiaDespacho.motivoTraslado) e("guiaDespacho.motivoTraslado", "Campo requerido (Catálogo 13)");
    }
  }

  // ── imprenta (warning - should NOT be sent) ──
  if (doc.imprenta && Object.keys(doc.imprenta).length > 0) {
    e("imprenta", "El nodo 'imprenta' NO debe ser enviado. Es generado automáticamente por AIDA", "warning");
  }

  return errors;
}

/* ─────────────── Sample Documents ─────────────── */

const SAMPLES: Record<string, { label: string; json: string }> = {
  factura: {
    label: "Factura (01)",
    json: JSON.stringify({
      encabezado: {
        identificacionDocumento: {
          tipoDocumento: 1,
          numeroDocumento: 1000001,
          tipoProveedor: "01",
          tipoTransaccion: 1,
          fechaEmision: "20/02/2026",
          horaEmision: "10:30:00am",
          tipoDePago: "Contado",
          tipoDeVenta: "Interna",
          moneda: "VES",
        },
        comprador: {
          tipoIdentificacion: "J",
          numeroIdentificacion: "J-12345678-9",
          razonSocial: "Empresa Ejemplo C.A.",
          direccion: "Caracas, Venezuela",
          pais: "VE",
        },
        totales: {
          nroItems: 2,
          montoGravadoTotal: 1000.00,
          subtotal: 1000.00,
          totalIVA: 160.00,
          montoTotalConIVA: 1160.00,
          totalAPagar: 1160.00,
          impuestosSubtotal: [{ codigo: "G", tasa: 16, monto: 160.00 }],
          formasPago: [{ codigo: "01", monto: 1160.00 }],
        },
      },
      detalleItems: [
        {
          numeroLinea: 1,
          indicadorBienoServicio: "B",
          descripcion: "Producto de ejemplo A",
          cantidad: 5,
          unidadMedida: "UN",
          precioUnitario: 100.00,
          precioItem: 500.00,
          codigoImpuesto: 16,
          tasaIVA: 16,
          valorIVA: 80.00,
          valorTotalItem: 580.00,
        },
        {
          numeroLinea: 2,
          indicadorBienoServicio: "S",
          descripcion: "Servicio de ejemplo B",
          cantidad: 1,
          unidadMedida: "UN",
          precioUnitario: 500.00,
          precioItem: 500.00,
          codigoImpuesto: 16,
          tasaIVA: 16,
          valorIVA: 80.00,
          valorTotalItem: 580.00,
        },
      ],
    }, null, 2),
  },
  nc: {
    label: "Nota de Crédito (02)",
    json: JSON.stringify({
      encabezado: {
        identificacionDocumento: {
          tipoDocumento: 2,
          numeroDocumento: 2000001,
          tipoProveedor: "01",
          tipoTransaccion: 12,
          serieFacturaAfectada: "A",
          numeroFacturaAfectada: 1000001,
          fechaFacturaAfectada: "15/02/2026",
          comentarioFacturaAfectada: "Devolución parcial de mercancía",
          fechaEmision: "20/02/2026",
          horaEmision: "11:00:00am",
          tipoDePago: "Contado",
          tipoDeVenta: "Interna",
          moneda: "VES",
        },
        comprador: {
          tipoIdentificacion: "J",
          numeroIdentificacion: "J-12345678-9",
          razonSocial: "Empresa Ejemplo C.A.",
          direccion: "Caracas, Venezuela",
          pais: "VE",
        },
        totales: {
          nroItems: 1,
          montoGravadoTotal: 200.00,
          subtotal: 200.00,
          totalIVA: 32.00,
          montoTotalConIVA: 232.00,
          totalAPagar: 232.00,
          impuestosSubtotal: [{ codigo: "G", tasa: 16, monto: 32.00 }],
          formasPago: [{ codigo: "12", monto: 232.00 }],
        },
      },
      detalleItems: [
        {
          numeroLinea: 1,
          indicadorBienoServicio: "B",
          descripcion: "Devolución Producto A",
          cantidad: 2,
          unidadMedida: "UN",
          precioUnitario: 100.00,
          precioItem: 200.00,
          codigoImpuesto: 16,
          tasaIVA: 16,
          valorIVA: 32.00,
          valorTotalItem: 232.00,
        },
      ],
    }, null, 2),
  },
  retencion_iva: {
    label: "Retención IVA (07)",
    json: JSON.stringify({
      encabezado: {
        identificacionDocumento: {
          tipoDocumento: 7,
          numeroDocumento: 7000001,
          fechaEmision: "20/02/2026",
          horaEmision: "09:00:00am",
          tipoDePago: "Contado",
          tipoDeVenta: "Interna",
          moneda: "VES",
        },
        sujetoRetenido: {
          tipoIdentificacion: "J",
          numeroIdentificacion: "J-98765432-1",
          razonSocial: "Proveedor Nacional C.A.",
          direccion: "Valencia, Venezuela",
          pais: "VE",
        },
        totalRetencion: {
          totalBaseImponible: 5000.00,
          numeroCompRetencion: 1001,
          fechaEmisionCR: "20/02/2026",
          totalIVA: 800.00,
          totalRetenido: 600.00,
        },
      },
      detallesRetencion: [
        {
          numeroLinea: 1,
          fechaDocumento: "15022026",
          tipoDocumento: 1,
          serieDocumento: "A",
          numeroDocumento: 1000001,
          numeroControl: 500001,
          tipoTransaccion: 1,
          montoTotal: 5800.00,
          baseImponible: 5000.00,
          porcentaje: 16,
          porcentajeRetencion: 75,
          montoIVA: 800.00,
          retenido: 600.00,
          moneda: "VES",
        },
      ],
    }, null, 2),
  },
};

/* ─────────────── Component ─────────────── */

export default function SeniatValidator({ token: _token }: { token: string }) {
  const [jsonInput, setJsonInput] = useState("");
  const [results, setResults] = useState<VError[] | null>(null);
  const [parseError, setParseError] = useState("");

  const validate = useCallback(() => {
    setParseError("");
    setResults(null);

    if (!jsonInput.trim()) {
      setParseError("Pegue un JSON para validar");
      return;
    }

    try {
      const doc = JSON.parse(jsonInput);
      const errs = validateSeniatJSON(doc);
      setResults(errs);
    } catch (err: any) {
      setParseError(`Error de sintaxis JSON: ${err.message}`);
    }
  }, [jsonInput]);

  const loadSample = (key: string) => {
    setJsonInput(SAMPLES[key].json);
    setResults(null);
    setParseError("");
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setParseError("");
    } catch {
      setParseError("No se puede formatear: JSON inválido");
    }
  };

  const errCount = results?.filter(r => r.severity === "error").length ?? 0;
  const warnCount = results?.filter(r => r.severity === "warning").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Validador SENIAT V1.4</h1>
          <p className="text-sm text-gray-500 mt-1">
            Valide documentos fiscales contra las reglas SENIAT V1.4 antes de enviarlos
          </p>
        </div>
        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
          Offline
        </span>
      </div>

      {/* Sample loader */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Cargar ejemplo:</span>
        {Object.entries(SAMPLES).map(([key, val]) => (
          <button key={key} onClick={() => loadSample(key)}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition">
            {val.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">JSON del Documento</h3>
            <button onClick={formatJSON}
              className="text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded hover:bg-white/5">
              Formatear JSON
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            placeholder='{\n  "encabezado": {\n    "identificacionDocumento": {\n      "tipoDocumento": 1,\n      ...\n    }\n  }\n}'
            className="w-full h-[500px] bg-white/[0.03] border border-white/10 text-gray-300 font-mono text-xs rounded-xl p-4 resize-none focus:outline-none focus:border-aida-accent placeholder-gray-600"
            spellCheck={false}
          />
          <button onClick={validate}
            className="w-full bg-aida-accent text-white py-3 rounded-lg font-semibold hover:bg-aida-accent/80 transition">
            Validar Documento
          </button>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Resultados</h3>

          {parseError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
              <p className="font-semibold mb-1">Error de JSON</p>
              <p className="font-mono text-xs">{parseError}</p>
            </div>
          )}

          {results !== null && (
            <>
              {/* Summary */}
              <div className={`rounded-xl border-2 p-5 text-center ${
                errCount === 0 && warnCount === 0
                  ? "border-green-500/30 bg-green-500/5"
                  : errCount > 0
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-yellow-500/30 bg-yellow-500/5"
              }`}>
                <div className="text-4xl mb-2">
                  {errCount === 0 && warnCount === 0 ? "✅" : errCount > 0 ? "❌" : "⚠️"}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {errCount === 0 && warnCount === 0
                    ? "Documento Válido"
                    : errCount > 0
                      ? "Documento con Errores"
                      : "Documento con Advertencias"
                  }
                </h3>
                <div className="flex items-center justify-center gap-4 text-sm">
                  {errCount > 0 && <span className="text-red-400">{errCount} error{errCount > 1 ? "es" : ""}</span>}
                  {warnCount > 0 && <span className="text-yellow-400">{warnCount} advertencia{warnCount > 1 ? "s" : ""}</span>}
                  {errCount === 0 && warnCount === 0 && <span className="text-green-400">Sin observaciones</span>}
                </div>
              </div>

              {/* Error list */}
              {results.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden max-h-[400px] overflow-auto">
                  {results.map((r, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 border-b border-white/5 last:border-0 ${
                      r.severity === "error" ? "bg-red-500/5" : "bg-yellow-500/5"
                    }`}>
                      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        r.severity === "error" ? "bg-red-500" : "bg-yellow-500"
                      }`} />
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-aida-cyan break-all">{r.path}</p>
                        <p className={`text-xs mt-0.5 ${r.severity === "error" ? "text-red-400" : "text-yellow-400"}`}>
                          {r.message}
                        </p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                        r.severity === "error"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {r.severity === "error" ? "ERROR" : "WARN"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Help when no results */}
          {results === null && !parseError && (
            <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <div className="text-4xl mb-3 opacity-30">🔍</div>
              <p className="text-sm text-gray-500 mb-2">Pegue un JSON de documento fiscal en el editor</p>
              <p className="text-xs text-gray-600">
                El validador verificará la estructura, campos requeridos, formatos,
                catálogos y reglas condicionales según el tipo de documento SENIAT V1.4.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
