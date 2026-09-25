import { loadConnection, saveConnection } from "../../../utils/mercadopago";

export default defineEventHandler(async (event) => {
  const connection = await loadConnection();
  if (!connection?.refreshToken) throw createError({ statusCode: 409, statusMessage: "Mercado Pago refresh token is unavailable" });
  const token = await $fetch<{ access_token: string; refresh_token?: string; expires_in?: number }>("https://api.mercadopago.com/oauth/token", { method: "POST", body: { client_id: process.env.MERCADOPAGO_CLIENT_ID, client_secret: process.env.MERCADOPAGO_CLIENT_SECRET, grant_type: "refresh_token", refresh_token: connection.refreshToken } });
  await saveConnection({ ...connection, accessToken: token.access_token, refreshToken: token.refresh_token || connection.refreshToken, expiresAt: Date.now() + (token.expires_in || 0) * 1000, refreshedAt: new Date().toISOString() });
  return { status: "connected" };
});
