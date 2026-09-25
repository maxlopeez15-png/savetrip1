import { loadConnection, mercadoPagoRequest } from "../../utils/mercadopago";

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  const connection = await loadConnection();
  if (!connection?.accessToken) throw createError({ statusCode: 503, statusMessage: "Mercado Pago seller account is not connected" });
  if (!body?.token || !body?.amount || !body?.investmentPlanId) throw createError({ statusCode: 400, statusMessage: "Contribution details are incomplete" });
  const payment = await mercadoPagoRequest("/v1/payments", { method: "POST", headers: { Authorization: `Bearer ${connection.accessToken}`, "X-Idempotency-Key": String(body.idempotencyKey || crypto.randomUUID()) }, body: JSON.stringify({ transaction_amount: Number(body.amount), token: body.token, description: `PulsePass contribution · ${body.investmentPlanId}`, installments: 1, payer: body.payer, metadata: { pulsepass_user_id: body.userId, investment_plan_id: body.investmentPlanId } }) });
  return { paymentStatus: payment.status, contribution: { id: `contribution-${payment.id}`, amount: Number(body.amount), currency: "MXN", investmentPlanId: body.investmentPlanId, paymentMethodId: body.paymentMethodId, providerTransactionId: String(payment.id), status: payment.status, createdAt: new Date().toISOString() } };
});
