import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BADGES, DEFAULT_USER, MICRO_GOALS, getLevel, type BadgeDefinition, type Contribution, type LinkedCard, type UserProfile, SavetripContext, type SavetripContextValue } from "@/lib/savetrip";

type AuthResult = { error?: string; needsVerification?: boolean };

const EMPTY_USER: UserProfile = { ...DEFAULT_USER, id: "", name: "", email: "", isLoggedIn: false, emailVerified: false, onboardingCompleted: false, quizAnswers: {}, age: 0, income: 0, currentSavings: 0, monthlyContribution: 0, xp: 0, currentStreak: 0, longestStreak: 0, microGoalProgress: 0, completedMicroGoals: [], badges: [], badgeDates: {}, linkedCards: [], contributions: [], isPremium: false };
const redirectUrl = (path: string) => `${window.location.origin}${path}`;
const normalizeError = (error: { message?: string } | null): AuthResult => {
  const message = error?.message?.toLowerCase() || "";
  if (message.includes("already registered") || message.includes("already been registered") || message.includes("user already exists")) return { error: "This email is already registered." };
  if (message.includes("email not confirmed")) return { error: "Please verify your email before continuing.", needsVerification: true };
  if (message.includes("invalid login credentials")) return { error: "Incorrect email or password." };
  if (message.includes("password")) return { error: "This password does not meet the requirements." };
  return { error: "We couldn't connect to the server. Please try again." };
};

const calculateProgress = (current: UserProfile, amount: number) => {
  const previousLevel = getLevel(current.xp).level;
  const newProgress = current.microGoalProgress + amount;
  const completed = MICRO_GOALS.filter((goal) => newProgress >= goal.target && !current.completedMicroGoals.includes(goal.target)).map((goal) => goal.target);
  const xpEarned = Math.max(10, Math.round(amount / 5)) + completed.length * 50;
  const xp = current.xp + xpEarned;
  const nextStreak = current.currentStreak + 1;
  const nextSavings = current.currentSavings + amount;
  const nextCompleted = [...current.completedMicroGoals, ...completed];
  const shouldUnlock = (badge: BadgeDefinition) => badge.category === "savings" ? (badge.id === "first-deposit" ? nextSavings > 0 : nextSavings >= badge.threshold) : badge.category === "streak" ? nextStreak >= badge.threshold : badge.category === "micro-goal" ? nextCompleted.length >= badge.threshold : badge.category === "xp" ? xp >= badge.threshold : nextStreak >= badge.threshold;
  const newBadgeIds = BADGES.filter((badge) => !current.badges.includes(badge.id) && shouldUnlock(badge)).map((badge) => badge.id);
  const badgeDates = { ...current.badgeDates };
  const today = new Date().toISOString().slice(0, 10);
  newBadgeIds.forEach((id) => { badgeDates[id] = today; });
  return { next: { ...current, currentSavings: nextSavings, microGoalProgress: newProgress, completedMicroGoals: nextCompleted, xp, currentStreak: nextStreak, longestStreak: Math.max(current.longestStreak, nextStreak), badges: [...current.badges, ...newBadgeIds], badgeDates }, result: { completed, leveledUp: getLevel(xp).level > previousLevel, xpEarned } };
};

function toUser(sessionUser: any, profile: any, savings: any, progress: any, preferences: any, badges: any[], contributions: any[], methods: any[], avatarUrl?: string): UserProfile {
  return { ...EMPTY_USER, id: sessionUser.id, name: profile?.full_name || sessionUser.user_metadata?.full_name || "", email: sessionUser.email || profile?.email || "", isLoggedIn: true, emailVerified: Boolean(sessionUser.email_confirmed_at), onboardingCompleted: Boolean(profile?.onboarding_completed), quizAnswers: profile?.onboarding_answers || {}, age: Number(profile?.age || 0), income: Number(profile?.income || 0), currentSavings: Number(savings?.current_balance ?? profile?.current_savings ?? 0), monthlyContribution: Number(savings?.monthly_contribution ?? profile?.monthly_contribution ?? 0), retirementAge: Number(savings?.retirement_age ?? profile?.retirement_age ?? 65), retirementTarget: Number(savings?.retirement_target ?? profile?.retirement_target ?? 0), expectedReturn: Number(profile?.expected_return ?? 7), persona: profile?.savings_persona || "Steady Starter", personaImage: avatarUrl || profile?.avatar_url || undefined, xp: Number(progress?.xp || 0), currentStreak: Number(progress?.current_streak || 0), longestStreak: Number(progress?.longest_streak || 0), streakFreezes: Number(progress?.streak_freezes || 0), microGoalProgress: Number(progress?.micro_goal_progress || 0), completedMicroGoals: Array.isArray(progress?.completed_micro_goals) ? progress.completed_micro_goals : [], badges: badges.map((badge) => badge.badge_id), badgeDates: Object.fromEntries(badges.map((badge) => [badge.badge_id, badge.unlocked_at])), linkedCards: methods.map((method) => ({ id: method.id, provider: method.provider, providerPaymentMethodId: method.provider_payment_method_id, brand: method.brand || "Card", issuerId: method.issuer_id, issuerName: method.issuer_name || "Issuer unavailable", last4: method.last4 || "", type: method.type, verified: method.verified, status: method.status })), contributions: contributions.map((item) => ({ ...item, userId: item.user_id, investmentPlanId: item.investment_plan_id, paymentMethodId: item.payment_method_id, providerTransactionId: item.provider_transaction_id, createdAt: item.created_at })), investmentPlanId: profile?.investment_plan_id || "balanced", isPremium: Boolean(profile?.is_premium), settings: { notifications: preferences?.notifications ?? true, theme: preferences?.theme || "mint", currency: "MXN" } };
}

export function SupabaseSavetripProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(EMPTY_USER);
  const [authLoading, setAuthLoading] = useState(true);

  const hydrate = async (session: any) => {
    if (!session?.user) { setUser(EMPTY_USER); setAuthLoading(false); return; }
    const id = session.user.id;
    const [{ data: profile }, { data: savings }, { data: progress }, { data: preferences }, { data: badges }, { data: contributions }, { data: methods }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", id).maybeSingle(),
      supabase.from("user_savings").select("*").eq("user_id", id).maybeSingle(),
      supabase.from("user_progress").select("*").eq("user_id", id).maybeSingle(),
      supabase.from("user_preferences").select("*").eq("user_id", id).maybeSingle(),
      supabase.from("user_badges").select("*").eq("user_id", id).order("unlocked_at"),
      supabase.from("contributions").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("payment_methods").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    ]);
    let avatarUrl = profile?.avatar_url;
    if (avatarUrl && !avatarUrl.startsWith("http")) avatarUrl = (await supabase.storage.from("profile-images").createSignedUrl(avatarUrl, 3600)).data?.signedUrl;
    setUser(toUser(session.user, profile, savings, progress, preferences, badges || [], contributions || [], methods || [], avatarUrl));
    setAuthLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) void hydrate(data.session); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (mounted) window.setTimeout(() => void hydrate(session), 0); });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const registerAccount = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: name.trim() }, emailRedirectTo: redirectUrl("/auth/callback") } });
    if (data.user && data.user.identities?.length === 0) return { error: "This email is already registered." };
    if (!error && data.session) await supabase.auth.signOut();
    return normalizeError(error);
  };
  const login = async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return normalizeError(error);
    if (!data.user?.email_confirmed_at) return { error: "Please verify your email before continuing.", needsVerification: true };
    await hydrate(data.session);
    return {};
  };
  const logout = async () => { await supabase.auth.signOut(); setUser(EMPTY_USER); };
  const resendVerification = async (email: string): Promise<AuthResult> => { const { error } = await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase(), options: { emailRedirectTo: redirectUrl("/auth/callback") } }); return normalizeError(error); };
  const checkVerification = async () => { const { data } = await supabase.auth.getSession(); if (!data.session) return false; await hydrate(data.session); return Boolean(data.session.user.email_confirmed_at); };
  const resetPassword = async (email: string): Promise<AuthResult> => { const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: redirectUrl("/auth/reset-password") }); return normalizeError(error); };
  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((current) => ({ ...current, ...updates }));
    if (!user.id) return;
    const profileUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) profileUpdates.full_name = updates.name;
    if (updates.email !== undefined) profileUpdates.email = updates.email;
    if (updates.persona !== undefined) profileUpdates.savings_persona = updates.persona;
    if (updates.personaImage !== undefined) profileUpdates.avatar_url = updates.personaImage || null;
    if (updates.onboardingCompleted !== undefined) profileUpdates.onboarding_completed = updates.onboardingCompleted;
    if (updates.quizAnswers !== undefined) profileUpdates.onboarding_answers = updates.quizAnswers;
    if (updates.age !== undefined) profileUpdates.age = updates.age;
    if (updates.income !== undefined) profileUpdates.income = updates.income;
    if (updates.expectedReturn !== undefined) profileUpdates.expected_return = updates.expectedReturn;
    if (updates.investmentPlanId !== undefined) profileUpdates.investment_plan_id = updates.investmentPlanId;
    if (Object.keys(profileUpdates).length) void supabase.from("profiles").update(profileUpdates).eq("user_id", user.id);
    if (updates.currentSavings !== undefined || updates.monthlyContribution !== undefined || updates.retirementAge !== undefined || updates.retirementTarget !== undefined) void supabase.from("user_savings").upsert({ user_id: user.id, current_balance: updates.currentSavings ?? user.currentSavings, monthly_contribution: updates.monthlyContribution ?? user.monthlyContribution, retirement_age: updates.retirementAge ?? user.retirementAge, retirement_target: updates.retirementTarget ?? user.retirementTarget });
    if (updates.settings) void supabase.from("user_preferences").upsert({ user_id: user.id, notifications: updates.settings.notifications, theme: updates.settings.theme, currency: updates.settings.currency });
  };
  const completeOnboarding = (updates: Partial<UserProfile>, quizAnswers: Record<string, string>) => updateUser({ ...updates, quizAnswers, onboardingCompleted: true });
  const addSavings = (amount: number) => {
    const { next, result } = calculateProgress(user, amount);
    setUser(next);
    if (user.id) {
      void supabase.from("user_savings").upsert({ user_id: user.id, current_balance: next.currentSavings, monthly_contribution: next.monthlyContribution, retirement_age: next.retirementAge, retirement_target: next.retirementTarget });
      void supabase.from("user_progress").upsert({ user_id: user.id, xp: next.xp, current_streak: next.currentStreak, longest_streak: next.longestStreak, streak_freezes: next.streakFreezes, micro_goal_progress: next.microGoalProgress, completed_micro_goals: next.completedMicroGoals });
      for (const badgeId of next.badges.filter((badgeId) => !user.badges.includes(badgeId))) void supabase.from("user_badges").upsert({ user_id: user.id, badge_id: badgeId }, { onConflict: "user_id,badge_id" });
    }
    return result;
  };
  const addConfirmedContribution = (contribution: Contribution) => { const result = addSavings(contribution.amount); setUser((current) => ({ ...current, contributions: [contribution, ...current.contributions] })); if (user.id) void supabase.from("contributions").insert({ user_id: user.id, amount: contribution.amount, currency: contribution.currency, investment_plan_id: contribution.investmentPlanId, payment_method_id: contribution.paymentMethodId, provider: "mercadopago", provider_transaction_id: contribution.providerTransactionId, status: contribution.status }); return result; };
  const linkCard = (card: Omit<LinkedCard, "id">) => { const optimistic = { ...card, id: `card-${Date.now()}` }; setUser((current) => ({ ...current, linkedCards: [optimistic, ...current.linkedCards] })); if (user.id) void supabase.from("payment_methods").insert({ user_id: user.id, provider: card.provider || "mercadopago", provider_payment_method_id: card.providerPaymentMethodId, brand: card.brand, issuer_id: card.issuerId, issuer_name: card.issuerName, last4: card.last4, type: card.type, verified: card.verified, status: card.status }); };
  const removeCard = (id: string) => { setUser((current) => ({ ...current, linkedCards: current.linkedCards.filter((card) => card.id !== id) })); if (user.id && !id.startsWith("card-")) void supabase.from("payment_methods").delete().eq("id", id).eq("user_id", user.id); };
  const activatePremium = () => { if (!user.id) return; void supabase.rpc("grant_demo_premium").then(({ error }) => { if (!error) setUser((current) => ({ ...current, isPremium: true })); }); };
  const useFreeze = () => { if (user.streakFreezes <= 0) return false; updateUser({ streakFreezes: user.streakFreezes - 1 }); if (user.id) void supabase.from("user_progress").update({ streak_freezes: user.streakFreezes - 1 }).eq("user_id", user.id); return true; };
  const uploadAvatar = async (file: File): Promise<{ error?: string }> => { if (!user.id) return { error: "Please log in before uploading an image." }; const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"; const path = `${user.id}/${crypto.randomUUID()}.${extension}`; const { error } = await supabase.storage.from("profile-images").upload(path, file, { contentType: file.type, upsert: false }); if (error) return { error: "We couldn't upload that image. Please try again." }; const { data } = await supabase.storage.from("profile-images").createSignedUrl(path, 3600); setUser((current) => ({ ...current, personaImage: data?.signedUrl || path })); await supabase.from("profiles").update({ avatar_url: path }).eq("user_id", user.id); return {}; };
  const removeAvatar = async (): Promise<{ error?: string }> => { if (!user.id) return {}; const currentPath = user.personaImage?.includes("/profile-images/") ? user.personaImage.split("/profile-images/")[1]?.split("?")[0] : undefined; if (currentPath) await supabase.storage.from("profile-images").remove([currentPath]); const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", user.id); if (!error) setUser((current) => ({ ...current, personaImage: undefined })); return error ? { error: "We couldn't remove that image. Please try again." } : {}; };
  const resetDemo = () => { void logout(); };
  const value = useMemo<SavetripContextValue>(() => ({ user, authLoading, updateUser, registerAccount, login, logout, resendVerification, checkVerification, resetPassword, completeOnboarding, addSavings, addConfirmedContribution, linkCard, removeCard, activatePremium, useFreeze, resetDemo, uploadAvatar, removeAvatar }), [user, authLoading]);
  return <SavetripContext.Provider value={value}>{children}</SavetripContext.Provider>;
}

export const useSupabaseSavetrip = () => { const context = useContext(SavetripContext); if (!context) throw new Error("useSupabaseSavetrip must be used inside SupabaseSavetripProvider"); return context; };
