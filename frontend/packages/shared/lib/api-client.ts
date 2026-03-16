const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Error de red" }));
      throw new ApiError(response.status, error.detail || "Error desconocido");
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string, totpCode?: string) {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password, totp_code: totpCode },
    });
  }

  async refresh(refreshToken: string) {
    return this.request<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: refreshToken },
    });
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" });
  }

  // Clients (Admin)
  async getClients(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<PaginatedResponse<Client>>(`/clients${query}`);
  }

  async getClient(id: string) {
    return this.request<Client>(`/clients/${id}`);
  }

  async createClient(data: Partial<Client>) {
    return this.request<Client>("/clients", { method: "POST", body: data });
  }

  async updateClient(id: string, data: Partial<Client>) {
    return this.request<Client>(`/clients/${id}`, { method: "PUT", body: data });
  }

  async deleteClient(id: string) {
    return this.request(`/clients/${id}`, { method: "DELETE" });
  }

  // Users (Admin)
  async getUsers(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<PaginatedResponse<User>>(`/users${query}`);
  }

  async createUser(data: Partial<User> & { password: string }) {
    return this.request<User>("/users", { method: "POST", body: data });
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.request<User>(`/users/${id}`, { method: "PUT", body: data });
  }

  // Documents (Client Portal)
  async getDashboard() {
    return this.request<DashboardStats>("/documents/dashboard");
  }

  async getDocuments(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<PaginatedResponse<Invoice>>(`/documents${query}`);
  }

  async getDocument(id: string) {
    return this.request<Invoice>(`/documents/${id}`);
  }

  // Admin
  async getAdminDashboard() {
    return this.request<AdminDashboard>("/admin/dashboard");
  }

  async getAuditLogs(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<PaginatedResponse<AuditLog>>(`/admin/audit-logs${query}`);
  }

  async seedSystem() {
    return this.request("/admin/seed", { method: "POST" });
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Type definitions used by the client
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  requires_2fa: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superadmin: boolean;
  totp_enabled: boolean;
  language: string;
  theme: string;
}

interface Client {
  id: string;
  rif: string;
  razon_social: string;
  nombre_comercial: string | null;
  email_principal: string;
  plan: string;
  is_active: boolean;
  is_suspended: boolean;
}

interface Invoice {
  id: string;
  document_number: string;
  control_number: string | null;
  receptor_rif: string;
  receptor_razon_social: string;
  fecha_emision: string;
  total: number;
  status: string;
  moneda: string;
}

interface DashboardStats {
  total_documents_month: number;
  total_pending_download: number;
  total_billed_current: number;
  total_billed_previous: number;
  documents_by_status: Record<string, number>;
  recent_documents: Invoice[];
}

interface AdminDashboard {
  total_clients: number;
  active_clients: number;
  total_users: number;
  total_documents_today: number;
  total_documents_month: number;
  alerts: string[];
}

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  details: string | null;
  ip_address: string | null;
  timestamp: string;
}
