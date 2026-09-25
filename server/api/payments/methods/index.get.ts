import { loadConnection, mercadoPagoRequest } from "../../../utils/mercadopago";

export default defineEventHandler(async () => {
  const connection = await loadConnection();
  if (!connection?.accessToken) throw createError({ statusCode: 503, statusMessage: "Mercado Pago seller account is not connected" });
  const methods = await mercadoPagoRequest("/v1/payment_methods", { headers: { Authorization: `Bearer ${connection.accessToken}` } });
  return { methods: methods.map((method: Record<string, unknown>) => ({ id: method.id, name: method.name, type: method.payment_type_id, status: method.status, issuer: method.issuer })) };
});
