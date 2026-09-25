import { createHmac, timingSafeEqual } from "node:crypto";
import { paymentEnvironment, loadConnection, mercadoPagoRequest } from "../../utils/mercadopago";
import { recordProviderPayment } from "../../utils/ledger";

const verifySignature = (event: Parameters<typeof defineEventHandler>[0], paymentId: string) => {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return paymentEnvironment === "DEMO";
  const signature = getHeader(event, "x-signature");
  const requestId = getHeader(event, "x-request-id") || "";
  if (!signature) return false;
  const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=")));
  const manifest = `id:${paymentId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return Boolean(parts.v1) && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
};

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  const paymentId = body?.data && typeof body.data === "object" ? (body.data as Record<string, unknown>).id : undefined;
  if (!paymentId) return { received: true };
  if (!verifySignature(event, String(paymentId))) throw createError({ statusCode: 401, statusMessage: "Invalid Mercado Pago webhook signature" });
  const connection = await loadConnection();
  if (!connection?.accessToken) return { received: true, ignored: "seller-not-connected" };
  const payment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(String(paymentId))}`, { headers: { Authorization: `Bearer ${connection.accessToken}` } });
  const ledger = await recordProviderPayment(payment);
  await useStorage().setItem(`pulsepass/payments/${payment.id}`, { status: payment.status, providerTransactionId: String(payment.id), updatedAt: new Date().toISOString(), ledger });
  return { received: true, status: payment.status, ledger };
});
