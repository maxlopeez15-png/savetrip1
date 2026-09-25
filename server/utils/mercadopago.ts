const apiBase = process.env.MERCADOPAGO_API_BASE_URL || "https://api.mercadopago.com";

export const paymentEnvironment = process.env.PULSEPASS_ENV === "production" ? "PRODUCTION" : process.env.PULSEPASS_ENV === "sandbox" ? "SANDBOX" : "DEMO";
export const providerConfigured = Boolean(process.env.MERCADOPAGO_CLIENT_ID && process.env.MERCADOPAGO_CLIENT_SECRET);

export const requireProvider = () => {
  if (!providerConfigured) throw createError({ statusCode: 503, statusMessage: "Mercado Pago is not configured" });
};

export const mercadoPagoRequest = async (path: string, options: RequestInit = {}) => {
  requireProvider();
  const response = await fetch(`${apiBase}${path}`, { ...options, headers: { Accept: "application/json", "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw createError({ statusCode: response.status, statusMessage: body.message || "Mercado Pago request failed", data: body });
  return body;
};

export const loadConnection = () => useStorage().getItem<Record<string, unknown>>(process.env.PULSEPASS_TOKEN_STORAGE_PREFIX || "pulsepass/mercadopago/connection");
export const saveConnection = (connection: Record<string, unknown>) => useStorage().setItem(process.env.PULSEPASS_TOKEN_STORAGE_PREFIX || "pulsepass/mercadopago/connection", connection);
export const clearConnection = () => useStorage().removeItem(process.env.PULSEPASS_TOKEN_STORAGE_PREFIX || "pulsepass/mercadopago/connection");
