import { loadConnection, mercadoPagoRequest } from "../../../utils/mercadopago";

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  if (!body?.token || !body?.paymentMethodId) throw createError({ statusCode: 400, statusMessage: "A provider card token and payment method ID are required" });
  const connection = await loadConnection();
  if (!connection?.accessToken) throw createError({ statusCode: 503, statusMessage: "Mercado Pago seller account is not connected" });
  const method = await mercadoPagoRequest(`/v1/payment_methods/${encodeURIComponent(String(body.paymentMethodId))}`);
  return { card: { id: `mp-${crypto.randomUUID()}`, provider: "mercadopago", providerPaymentMethodId: body.paymentMethodId, brand: method.name || method.id, issuerId: body.issuerId, issuerName: method.issuer?.name || "Issuer unavailable", last4: body.last4 || "", type: method.payment_type_id || "credit_card", verified: true, status: "verified" } };
});
