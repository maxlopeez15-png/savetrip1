import { loadConnection, mercadoPagoRequest } from "../../utils/mercadopago";

export default defineEventHandler(async (event) => {
  const connection = await loadConnection();
  if (!connection?.accessToken) throw createError({ statusCode: 503, statusMessage: "Mercado Pago seller account is not connected" });
  const id = getRouterParam(event, "id");
  const payment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(id || "")}`, { headers: { Authorization: `Bearer ${connection.accessToken}` } });
  return { status: payment.status, contribution: { id: `contribution-${payment.id}`, amount: payment.transaction_amount, currency: payment.currency_id || "MXN", providerTransactionId: String(payment.id), status: payment.status, createdAt: payment.date_created } };
});
