import type { Vehicle } from "./inventory";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "https://api.awaautos.com/api"
).replace(/\/$/, "");
export const API_HEALTH_PATH = import.meta.env.VITE_API_HEALTH_PATH ?? "/health";
export const ADMIN_API_ENABLED_KEY = "awa-admin-api-enabled";
export const ADMIN_TOKEN_KEY = "awa-admin-jwt";

export function isAdminApiEnabled(): boolean {
  return (
    typeof window === "undefined" || window.localStorage.getItem(ADMIN_API_ENABLED_KEY) !== "false"
  );
}

export function setAdminApiEnabled(enabled: boolean): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ADMIN_API_ENABLED_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent("awa-admin-api-changed", { detail: enabled }));
  }
}

const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY ?? "";

export type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
  meta?: { page: number; per_page: number; total: number; pages: number };
  error?: string;
};
export type ApiList<T> = ApiEnvelope<T[]>;
export type AdminSummary = {
  totalVehicles: number;
  publishedVehicles?: number;
  availableVehicles: number;
  newInquiries?: number;
  openInquiries?: number;
  inquiries?: number;
  activeOrders: number;
  publishedArticles?: number;
  pendingEmails?: number;
};
export type AdminLoginResponse = {
  ok: true;
  token_type: "Bearer";
  token: string;
  expires_in: number;
  user: { id: number; email: string; name: string; role: string };
};

type ApiVehicle = Record<string, unknown>;

function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function resolveApiAsset(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  try {
    return new URL(value, API_BASE_URL.replace(/\/api\/?$/, "") || "http://localhost").toString();
  } catch {
    return value;
  }
}

function parseImages(value: unknown): string[] {
  let images: unknown[] = [];
  try {
    images = Array.isArray(value) ? value : JSON.parse(typeof value === "string" ? value : "[]");
  } catch {
    images = [];
  }
  return images.filter((entry): entry is string => typeof entry === "string").map(resolveApiAsset);
}

function mapApiVehicle(item: ApiVehicle): Vehicle {
  const images = parseImages(item.images_json ?? item.images);
  const image = resolveApiAsset(item.image ?? images[0]);

  return {
    slug: String(item.slug ?? ""),
    brand: String(item.brand ?? ""),
    model: String(item.model ?? ""),
    year: Number(item.year ?? 0),
    condition: String(item.condition_name ?? item.condition ?? ""),
    fuel: String(item.fuel ?? ""),
    transmission: String(item.transmission ?? ""),
    driveType: String(item.drive_type ?? item.driveType ?? ""),
    price: String(item.price ?? "Contact for Price"),
    mileage: String(item.mileage ?? "On request"),
    engine: String(item.engine ?? ""),
    color: String(item.color ?? ""),
    availability: String(item.availability ?? "Available"),
    image,
    images,
    description: String(item.description ?? ""),
    has_360: Boolean(item.has_360),
    category: String(item.category ?? ""),
    source: String(item.price_source ?? "Live API"),
  };
}

const ANALYTICS_SESSION_KEY = "awa-analytics-session";

function analyticsSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existing) return existing;
  const value =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(ANALYTICS_SESSION_KEY, value);
  return value;
}

export function trackAnalytics(
  eventName: string,
  entityType?: string,
  entityId?: number,
  metadata: Record<string, unknown> = {},
): void {
  if (!API_BASE_URL || typeof window === "undefined") return;
  void fetch(apiUrl("/analytics"), {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      event_name: eventName,
      entity_type: entityType,
      entity_id: entityId,
      session_id: analyticsSessionId(),
      metadata,
    }),
  }).catch(() => undefined);
}

export async function checkApiReady(): Promise<boolean> {
  if (!API_BASE_URL || !isAdminApiEnabled()) return false;
  try {
    const response = await fetch(apiUrl(API_HEALTH_PATH), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL || !isAdminApiEnabled())
    throw new Error("API mode is off. Turn it on in Admin Settings.");
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  else if (ADMIN_API_KEY) headers.set("X-Admin-Key", ADMIN_API_KEY);
  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    signal: init?.signal ?? AbortSignal.timeout(8000),
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && typeof window !== "undefined")
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  if (!response.ok || payload?.ok === false) {
    throw new Error(
      typeof payload?.error === "string" ? payload.error : `API request failed: ${response.status}`,
    );
  }
  return payload as T;
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  if (!API_BASE_URL || !isAdminApiEnabled()) throw new Error("API mode is off or not configured.");
  const response = await fetch(apiUrl("/admin/auth/login"), {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(8000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false || typeof payload?.token !== "string") {
    throw new Error(
      typeof payload?.error === "string" ? payload.error : `Login failed: ${response.status}`,
    );
  }
  if (typeof window !== "undefined") window.localStorage.setItem(ADMIN_TOKEN_KEY, payload.token);
  return payload as AdminLoginResponse;
}

export async function adminLogout(): Promise<void> {
  try {
    await apiRequest("/admin/auth/logout", { method: "POST" });
  } finally {
    if (typeof window !== "undefined") window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

export async function publicVehicles(): Promise<Vehicle[]> {
  if (!API_BASE_URL) throw new Error("Live API is not configured.");
  const perPage = 100;

  async function fetchPage(page: number): Promise<ApiList<ApiVehicle>> {
    const params = new URLSearchParams({
      type: "vehicle",
      per_page: String(perPage),
      page: String(page),
    });
    const response = await fetch(apiUrl(`/catalog?${params.toString()}`), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    const payload = (await response.json().catch(() => ({}))) as Partial<ApiList<ApiVehicle>>;
    if (!response.ok || payload?.ok === false || !Array.isArray(payload?.data)) {
      throw new Error(
        typeof payload?.error === "string"
          ? payload.error
          : `Catalog request failed: ${response.status}`,
      );
    }
    return payload as ApiList<ApiVehicle>;
  }

  const firstPage = await fetchPage(1);
  const totalPages = Math.max(
    1,
    Number(
      firstPage.meta?.pages ??
        Math.ceil(Number(firstPage.meta?.total ?? firstPage.data.length) / perPage),
    ),
  );
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2)),
  );
  const allItems = [firstPage, ...remainingPages].flatMap((page) => page.data);

  return allItems.map(mapApiVehicle).filter((item) => item.slug && item.brand && item.model);
}

export async function publicVehicleBySlug(slug: string): Promise<Vehicle | null> {
  if (!API_BASE_URL) throw new Error("Live API is not configured.");
  const response = await fetch(apiUrl(`/catalog/${encodeURIComponent(slug)}`), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<ApiVehicle> | ApiVehicle;
  if (response.status === 404) return null;
  if (!response.ok || ("ok" in payload && payload.ok === false)) {
    const error =
      "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Vehicle request failed: ${response.status}`;
    throw new Error(error);
  }
  const item = "data" in payload ? payload.data : payload;
  if (!item || typeof item !== "object") return null;
  const vehicle = mapApiVehicle(item as ApiVehicle);
  return vehicle.slug && vehicle.brand && vehicle.model ? vehicle : null;
}

export type PublicNewsArticle = {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image?: string | null;
  published_at?: string | null;
};

export async function publicNews(slug?: string): Promise<PublicNewsArticle | PublicNewsArticle[]> {
  if (!API_BASE_URL) throw new Error("Live API is not configured.");
  const path = slug ? `/news/${encodeURIComponent(slug)}` : "/news";
  const response = await fetch(apiUrl(path), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<
    PublicNewsArticle | PublicNewsArticle[]
  >;
  if (!response.ok || payload?.ok === false) {
    throw new Error(
      typeof payload?.error === "string"
        ? payload.error
        : `News request failed: ${response.status}`,
    );
  }
  return payload.data;
}

export type PublicOrderTracking = {
  status?: string;
  order_number?: string;
  events?: Array<{ status: string; note?: string; location?: string; event_at?: string }>;
};

export async function publicTrackOrder(
  orderNumber: string,
  confirmation: string,
): Promise<PublicOrderTracking> {
  if (!API_BASE_URL) throw new Error("Live API is not configured.");
  const response = await fetch(
    apiUrl(
      `/orders/track/${encodeURIComponent(orderNumber)}?confirmation=${encodeURIComponent(confirmation)}`,
    ),
    { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) },
  );
  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    order?: PublicOrderTracking;
    error?: string;
  };
  if (!response.ok || payload.ok === false || !payload.order) {
    throw new Error(typeof payload.error === "string" ? payload.error : "Order not found");
  }
  return payload.order;
}

export async function adminList<T>(
  resource: "vehicles" | "parts" | "inquiries" | "orders" | "articles",
  query = "",
) {
  return apiRequest<ApiList<T>>(`/admin/${resource}${query}`);
}

export async function adminSummary() {
  return apiRequest<{ ok: true; data: AdminSummary }>("/admin/summary");
}

export function adminCreate<T extends Record<string, unknown>>(resource: string, payload: T) {
  return apiRequest<{ ok: true; id: number }>(`/admin/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminUpdate<T extends Record<string, unknown>>(
  resource: string,
  id: number,
  payload: T,
) {
  return apiRequest<{ ok: true }>(`/admin/${resource}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function adminDelete(resource: string, id: number) {
  return apiRequest<{ ok: true }>(`/admin/${resource}/${id}`, { method: "DELETE" });
}

export function adminAction(
  resource: string,
  id: number,
  action: string,
  payload: Record<string, unknown> = {},
) {
  return apiRequest<{ ok: true }>(`/admin/${resource}/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminBulk(resource: string, payload: Record<string, unknown>) {
  return apiRequest<{ ok: true; updated: number }>(`/admin/${resource}/bulk`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitInquiry(payload: Record<string, unknown>) {
  if (!API_BASE_URL) throw new Error("Live inquiry service is not configured.");
  const response = await fetch(apiUrl("/inquiries"), {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(
      typeof data?.error === "string" ? data.error : `Inquiry request failed: ${response.status}`,
    );
  }
  return data as { ok: true; id: number };
}

export async function adminUploadFiles(files: File[], folder: string, entityId?: number) {
  if (!API_BASE_URL || !isAdminApiEnabled()) throw new Error("API mode is off.");
  const form = new FormData();
  files.forEach((file) => form.append("files[]", file));
  form.append("folder", folder);
  if (entityId) {
    form.append("entity_type", "vehicle");
    form.append("entity_id", String(entityId));
  }
  const headers = new Headers({ Accept: "application/json" });
  const token = typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  else if (ADMIN_API_KEY) headers.set("X-Admin-Key", ADMIN_API_KEY);
  const response = await fetch(apiUrl("/admin/uploads"), {
    method: "POST",
    headers,
    body: form,
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(
      typeof payload?.error === "string" ? payload.error : `Upload failed: ${response.status}`,
    );
  }
  return payload as {
    ok: true;
    data: Array<{ url: string; name: string; mime_type: string; file_size: number }>;
  };
}

export const currencyRates: Record<string, number> = {
  USD: 1,
  GHS: 12.4,
  AED: 3.67,
  CNY: 7.18,
  GBP: 0.79,
};
export const currencySymbols: Record<string, string> = {
  USD: "$",
  GHS: "₵",
  AED: "د.إ",
  CNY: "¥",
  GBP: "£",
};

export function formatMarketplacePrice(price: string, currency: string): string {
  if (!price || /contact|request|on request/i.test(price)) return price;

  const values = price.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!values?.length) return price;

  // Inventory fallback prices are stored in GHS. Rates are expressed as units
  // of each currency per USD, so converting GHS uses targetRate / ghsRate.
  const ghsRate = currencyRates.GHS ?? 1;
  const targetRate = currencyRates[currency] ?? 1;
  const symbol = currencySymbols[currency] ?? currency;
  const converted = values.map((value) => {
    const amount = Number(value.replace(/,/g, ""));
    const result = (amount / ghsRate) * targetRate;
    return result.toLocaleString(undefined, { maximumFractionDigits: 2 });
  });

  return `${symbol} ${converted.join(" - ")}`;
}

export function formatIndicativePrice(vehicle: Vehicle, currency: string): string {
  if (!vehicle.price || vehicle.price.toLowerCase().includes("contact")) return "Contact for Price";
  const numeric = Number(vehicle.price.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric)) return vehicle.price;
  const converted = numeric * (currencyRates[currency] ?? 1);
  return `${currencySymbols[currency] ?? currency} ${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function getVehicleCategory(vehicle: Vehicle): string {
  return (
    vehicle.category ??
    (/land cruiser|rx 350|range rover|santa fe|sport/i.test(vehicle.model) ? "SUV" : "Sedan")
  );
}

export function vehicleMatches(vehicle: Vehicle, query: string): boolean {
  return `${vehicle.brand} ${vehicle.model} ${vehicle.year} ${getVehicleCategory(vehicle)}`
    .toLowerCase()
    .includes(query.trim().toLowerCase());
}
