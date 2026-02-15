// Re-export common types used across portals

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: boolean;
  is_superadmin: boolean;
  is_verified: boolean;
  totp_enabled: boolean;
  last_login: string | null;
  language: string;
  timezone: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  rif: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion_fiscal: string;
  telefono_principal: string | null;
  email_principal: string;
  representante_legal: string | null;
  sector_industria: string | null;
  plan: string;
  fecha_inicio: string;
  fecha_renovacion: string | null;
  is_active: boolean;
  is_suspended: boolean;
  moneda_principal: string;
  max_documentos_mes: number;
  max_usuarios: number;
  max_almacenamiento_gb: number;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  document_number: string;
  control_number: string | null;
  emisor_rif: string;
  emisor_razon_social: string;
  receptor_rif: string;
  receptor_razon_social: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  subtotal: number;
  descuento: number;
  base_imponible: number;
  base_exenta: number;
  monto_iva_16: number;
  monto_iva_8: number;
  total: number;
  moneda: string;
  forma_pago: string;
  condicion_pago: string;
  status: string;
  pdf_url: string | null;
  xml_url: string | null;
  items: DocumentItem[];
  created_at: string;
}

export interface DocumentItem {
  id: string;
  product_code: string | null;
  description: string;
  unit_of_measure: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  line_number: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
