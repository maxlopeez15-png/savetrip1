export default defineEventHandler((event) => {
  if (!process.env.MERCADOPAGO_CLIENT_ID || !process.env.MERCADOPAGO_CLIENT_SECRET) return sendRedirect(event, "/settings?payment=not-configured");
  const state = crypto.randomUUID();
  setCookie(event, "pulsepass_mp_oauth_state", state, { httpOnly: true, secure: process.env.PULSEPASS_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI || `${getRequestURL(event).origin}/api/admin/mercadopago/callback`;
  const url = new URL("https://auth.mercadopago.com/authorization");
  url.searchParams.set("client_id", process.env.MERCADOPAGO_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return sendRedirect(event, url.toString());
});
