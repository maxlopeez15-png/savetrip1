type ProviderPayment = { id: string | number; status: string; transaction_amount?: number; currency_id?: string; metadata?: Record<string, string | number> };

export const recordProviderPayment = async (payment: ProviderPayment) => {
  const userId = payment.metadata?.pulsepass_user_id;
  if (!userId) return { recorded: false, reason: "missing-user-reference" };
  const status = ["approved", "pending", "rejected", "cancelled", "refunded"].includes(payment.status) ? payment.status : "pending";
  const record = { id: `contribution-${payment.id}`, userId: String(userId), amount: payment.transaction_amount || 0, currency: payment.currency_id || "MXN", investmentPlanId: payment.metadata?.investment_plan_id || "balanced", providerTransactionId: String(payment.id), status, createdAt: new Date().toISOString() };
  await useStorage().setItem(`pulsepass/contributions/${record.id}`, record);
  if (status !== "approved") return { recorded: true, status };
  const balanceKey = `pulsepass/users/${record.userId}/savings`;
  const current = await useStorage().getItem<{ balance: number; xp: number; microGoalProgress: number; currentStreak: number; longestStreak: number; lastContributionAt?: string; completedMicroGoals?: number[]; badges?: string[] }>(balanceKey);
  const balance = (current?.balance || 0) + record.amount;
  const xp = (current?.xp || 0) + Math.max(10, Math.round(record.amount / 5));
  const microGoalProgress = (current?.microGoalProgress || 0) + record.amount;
  const currentStreak = (current?.currentStreak || 0) + 1;
  const completedMicroGoals = [250, 500, 1000, 2500, 5000].filter((target) => microGoalProgress >= target);
  const badges = new Set(current?.badges || []);
  if (balance > 0) badges.add("first-deposit");
  if (balance >= 1000) badges.add("first-thousand");
  if (currentStreak >= 7) badges.add("streak-7");
  await useStorage().setItem(balanceKey, { balance, xp, microGoalProgress, currentStreak, longestStreak: Math.max(current?.longestStreak || 0, currentStreak), completedMicroGoals, badges: [...badges], lastContributionAt: record.createdAt });
  return { recorded: true, status, balanceUpdated: true, microGoalUpdated: true, xpAwarded: Math.max(10, Math.round(record.amount / 5)), streakUpdated: true, badgesChecked: true };
};
