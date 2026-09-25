import { clearConnection } from "../../../utils/mercadopago";

export default defineEventHandler(async () => {
  await clearConnection();
  return { connected: false, status: "disconnected" };
});
