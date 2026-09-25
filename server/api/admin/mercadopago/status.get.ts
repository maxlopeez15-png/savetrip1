import { loadConnection, paymentEnvironment } from "../../../utils/mercadopago";

export default defineEventHandler(async () => {
  const connection = await loadConnection();
  return { connected: Boolean(connection?.accessToken), environment: paymentEnvironment, status: connection?.status || "disconnected", account: connection?.userId ? `Mercado Pago account ···${String(connection.userId).slice(-4)}` : undefined };
});
