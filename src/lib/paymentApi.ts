import type { Contribution, LinkedCard } from "@/lib/savetrip";

export type PaymentEnvironment = "DEMO" | "SANDBOX" | "PRODUCTION";
export const PAYMENT_ENVIRONMENT: PaymentEnvironment = import.meta.env.VITE_PULSEPASS_ENV === "production" ? "PRODUCTION" : import.meta.env.VITE_PULSEPASS_ENV === "sandbox" ? "SANDBOX" : "DEMO";
export const MERCADO_PAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || "";
export const isProviderConfigured = Boolean(MERCADO_PAGO_PUBLIC_KEY) && PAYMENT_ENVIRONMENT !== "DEMO";

export const paymentEnvironmentCopy = PAYMENT_ENVIRONMENT === "PRODUCTION" ? "Live payment processing" : PAYMENT_ENVIRONMENT === "SANDBOX" ? "Test credentials only · no live funds" : "No provider configured · local UI only";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Mercado Pago service unavailable");
  return body as T;
}

export const validateProviderCard = (payload: Record<string, unknown>) => request<{ card: LinkedCard }>("/api/payments/methods/validate", { method: "POST", body: JSON.stringify(payload) });
export const createProviderPayment = (payload: Record<string, unknown>) => request<{ contribution: Contribution; paymentStatus: string }>("/api/payments/create", { method: "POST", body: JSON.stringify(payload) });
export const getProviderStatus = (id: string) => request<{ status: string; contribution?: Contribution }>(`/api/payments/${encodeURIComponent(id)}`);
export const getMercadoPagoConnection = () => request<{ connected: boolean; environment: PaymentEnvironment; account?: string; status: string }>("/api/admin/mercadopago/status");
