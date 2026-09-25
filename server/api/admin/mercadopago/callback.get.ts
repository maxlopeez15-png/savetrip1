import { saveConnection } from "../../../utils/mercadopago";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const expectedState = getCookie(event, "pulsepass_mp_oauth_state");
  if (!query.code || !query.state || query.state !== expectedState) throw createError({ statusCode: 400, statusMessage: "Invalid Mercado Pago OAuth state" });
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI || `${getRequestURL(event).origin}/api/admin/mercadopago/callback`;
  const token = await $fetch<{ access_token: string; refresh_token?: string; expires_in?: number; user_id?: number }>("https://api.mercadopago.com/oauth/token", { method: "POST", body: { client_id: process.env.MERCADOPAGO_CLIENT_ID, client_secret: process.env.MERCADOPAGO_CLIENT_SECRET, code: query.code, grant_type: "authorization_code", redirect_uri: redirectUri } });
  await saveConnection({ status: "connected", userId: token.user_id, accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: Date.now() + (token.expires_in || 0) * 1000, connectedAt: new Date().toISOString() });
  deleteCookie(event, "pulsepass_mp_oauth_state", { path: "/" });
  return sendRedirect(event, "/admin/payments?connected=1");
});
