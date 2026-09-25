import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Persona = "Consistent Builder" | "Future Planner" | "Steady Starter" | "Ambitious Saver";
export type LinkedCard = { id: string; provider?: "mercadopago"; providerPaymentMethodId?: string; brand: "Visa" | "Mastercard" | "Amex" | string; issuerId?: string; issuerName?: string; last4: string; type?: string; expirationMonth?: string; expirationYear?: string; verified?: boolean; status?: "verified" | "pending" | "rejected" };
export type Contribution = { id: string; userId?: string; amount: number; currency: "MXN"; investmentPlanId: string; paymentMethodId?: string; paymentMethodBrand?: string; paymentMethodLast4?: string; providerTransactionId?: string; status: "pending" | "approved" | "rejected" | "cancelled" | "refunded"; createdAt: string };
export type BadgeDefinition = { id: string; title: string; description: string; category: "savings" | "streak" | "micro-goal" | "xp" | "behavior"; threshold: number; icon: string };

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  password: string;
  isLoggedIn: boolean;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  quizAnswers: Record<string, string>;
  age: number;
  income: number;
  currentSavings: number;
  monthlyContribution: number;
  retirementAge: number;
  retirementTarget: number;
  expectedReturn: number;
  persona: Persona;
  personaImage?: string;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  microGoalProgress: number;
  completedMicroGoals: number[];
  badges: string[];
  badgeDates: Record<string, string>;
  linkedCards: LinkedCard[];
  investmentPlanId: string;
  contributions: Contribution[];
  isPremium: boolean;
  settings: { notifications: boolean; theme: "mint" | "sunset" | "midnight"; currency: "MXN" };
};

export const MICRO_GOALS = [
  { target: 250, label: "Starter", reward: "+50 XP", color: "mint" },
  { target: 500, label: "Builder", reward: "+75 XP", color: "blue" },
  { target: 1000, label: "Momentum", reward: "Momentum theme", color: "coral" },
  { target: 2500, label: "Accelerator", reward: "+150 XP", color: "gold" },
  { target: 5000, label: "Champion", reward: "Champion badge", color: "navy" },
];

const levelTitles = [
  "Starter", "First Step", "Builder", "Consistent", "Momentum Builder", "Accelerator", "Focused Saver", "Wealth Builder", "Investor", "Financial Strategist",
  "Growth Seeker", "Capital Builder", "Future Architect", "Wealth Planner", "Financial Pioneer", "Legacy Builder", "Long-Term Thinker", "Financial Leader", "Wealth Master", "Retirement Ready",
  "Financial Visionary", "Wealth Architect", "Capital Strategist", "Future Builder", "Financial Master", "Legacy Architect", "Wealth Pioneer", "Financial Champion", "Retirement Strategist", "PulsePass Legend",
];
const levelMins = [0, 250, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6500, 8000, 9500, 11000, 13000, 15000, 17500, 20000, 23000, 26000, 30000, 34000, 38000, 43000, 48000, 54000, 60000, 67000, 75000, 85000, 100000];
const levelRewards = [
  "Welcome badge", "First Step badge", "Builder badge", "Consistency badge", "New profile badge", "Accelerator badge", "Focused Saver badge", "Wealth Builder badge", "Investor badge", "Premium theme preview",
  "Growth Seeker badge", "Capital Builder badge", "Future Architect badge", "Wealth Planner badge", "Exclusive Legacy badge", "Legacy Builder badge", "Long-Term badge", "Financial Leader badge", "Wealth Master badge", "Retirement Ready badge",
  "Financial Visionary badge", "Wealth Architect badge", "Capital Strategist badge", "Future Builder badge", "Financial Master badge", "Legacy Architect badge", "Wealth Pioneer badge", "Financial Champion badge", "Retirement Strategist badge", "PulsePass Legend badge",
];
export const LEVELS = levelTitles.map((title, index) => ({ level: index + 1, title, min: levelMins[index], max: levelMins[index + 1] ?? levelMins[index] + 15000, reward: levelRewards[index] }));

export const BADGES: BadgeDefinition[] = [
  { id: "first-deposit", title: "First Deposit", description: "Make your first savings contribution.", category: "savings", threshold: 1, icon: "deposit" },
  { id: "first-500", title: "First $500", description: "Build your first $500 in contributions.", category: "savings", threshold: 500, icon: "coin" },
  { id: "first-thousand", title: "First $1,000", description: "Cross your first four-figure savings milestone.", category: "savings", threshold: 1000, icon: "coin" },
  { id: "first-5000", title: "First $5,000", description: "Save your first $5,000.", category: "savings", threshold: 5000, icon: "wallet" },
  { id: "first-10000", title: "First $10,000", description: "Reach five figures saved.", category: "savings", threshold: 10000, icon: "wallet" },
  { id: "first-25000", title: "First $25,000", description: "Reach the $25,000 milestone.", category: "savings", threshold: 25000, icon: "wallet" },
  { id: "first-50000", title: "First $50,000", description: "Reach the $50,000 milestone.", category: "savings", threshold: 50000, icon: "wallet" },
  { id: "first-100000", title: "First $100,000", description: "Join the six-figure saver club.", category: "savings", threshold: 100000, icon: "trophy" },
  { id: "streak-3", title: "3-Day Streak", description: "Show up three days in a row.", category: "streak", threshold: 3, icon: "flame" },
  { id: "streak-7", title: "7-Day Streak", description: "Keep the habit alive for a week.", category: "streak", threshold: 7, icon: "flame" },
  { id: "streak-14", title: "14-Day Streak", description: "Two weeks of consistent action.", category: "streak", threshold: 14, icon: "flame" },
  { id: "streak-30", title: "30-Day Streak", description: "Make consistency part of your rhythm.", category: "streak", threshold: 30, icon: "flame" },
  { id: "streak-60", title: "60-Day Streak", description: "Two months of momentum.", category: "streak", threshold: 60, icon: "flame" },
  { id: "streak-90", title: "90-Day Streak", description: "Build a habit that lasts a season.", category: "streak", threshold: 90, icon: "flame" },
  { id: "streak-180", title: "180-Day Streak", description: "Half a year of showing up.", category: "streak", threshold: 180, icon: "flame" },
  { id: "streak-365", title: "365-Day Streak", description: "One full year of future-focused action.", category: "streak", threshold: 365, icon: "flame" },
  { id: "micro-first", title: "First Micro-goal", description: "Unlock your first visible milestone.", category: "micro-goal", threshold: 1, icon: "target" },
  { id: "micro-5", title: "5 Micro-goals", description: "Unlock five milestones.", category: "micro-goal", threshold: 5, icon: "target" },
  { id: "micro-10", title: "10 Micro-goals", description: "Unlock ten milestones.", category: "micro-goal", threshold: 10, icon: "target" },
  { id: "micro-25", title: "25 Micro-goals", description: "Unlock twenty-five milestones.", category: "micro-goal", threshold: 25, icon: "target" },
  { id: "micro-50", title: "50 Micro-goals", description: "Unlock fifty milestones.", category: "micro-goal", threshold: 50, icon: "target" },
  { id: "micro-100", title: "100 Micro-goals", description: "Unlock one hundred milestones.", category: "micro-goal", threshold: 100, icon: "target" },
  { id: "xp-1000", title: "1,000 XP", description: "Earn your first thousand XP.", category: "xp", threshold: 1000, icon: "zap" },
  { id: "xp-5000", title: "5,000 XP", description: "Reach five thousand XP.", category: "xp", threshold: 5000, icon: "zap" },
  { id: "xp-10000", title: "10,000 XP", description: "Reach ten thousand XP.", category: "xp", threshold: 10000, icon: "zap" },
  { id: "xp-25000", title: "25,000 XP", description: "Reach twenty-five thousand XP.", category: "xp", threshold: 25000, icon: "zap" },
  { id: "xp-50000", title: "50,000 XP", description: "Reach fifty thousand XP.", category: "xp", threshold: 50000, icon: "zap" },
  { id: "xp-100000", title: "100,000 XP", description: "Reach the six-figure XP milestone.", category: "xp", threshold: 100000, icon: "zap" },
  { id: "consistent-saver", title: "Consistent Saver", description: "Keep a 14-day streak.", category: "behavior", threshold: 14, icon: "repeat" },
  { id: "momentum-builder", title: "Momentum Builder", description: "Complete five savings actions.", category: "behavior", threshold: 5, icon: "trending" },
  { id: "future-focused", title: "Future Focused", description: "Build a 90-day streak.", category: "behavior", threshold: 90, icon: "star" },
  { id: "long-term-thinker", title: "Long-Term Thinker", description: "Build a 365-day streak.", category: "behavior", threshold: 365, icon: "compass" },
  { id: "projection-improved", title: "Projection Improved", description: "Tune your plan in the projection simulator.", category: "behavior", threshold: 1, icon: "trending" },
];

export const DEFAULT_USER: UserProfile = {
  id: "demo-max", name: "Max", email: "max@pulsepass.demo", password: "demo1234", isLoggedIn: false, emailVerified: true, onboardingCompleted: true, quizAnswers: {}, age: 22, income: 48000, currentSavings: 15000, monthlyContribution: 2000, retirementAge: 65, retirementTarget: 5000000, expectedReturn: 7, persona: "Consistent Builder", personaImage: undefined, xp: 720, currentStreak: 12, longestStreak: 18, streakFreezes: 2, microGoalProgress: 750, completedMicroGoals: [250, 500], badges: ["first-deposit", "first-thousand", "streak-7", "projection-improved"], badgeDates: { "first-deposit": "2025-01-04", "first-thousand": "2025-02-12", "streak-7": "2025-02-28" }, linkedCards: [], investmentPlanId: "balanced", contributions: [], isPremium: false, settings: { notifications: true, theme: "mint", currency: "MXN" },
};

const STORAGE_KEY = "savetrip-user";
export const formatMoney = (amount: number, compact = false) => { if (compact && amount >= 1000000) return `$${(amount / 1000000).toFixed(1)} M`; if (compact && amount >= 1000) return `$${Math.round(amount / 1000)} k`; return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(amount); };
export const projectSavings = (current: number, monthly: number, age: number, retirementAge: number, annualReturn = 0.07) => { const months = Math.max(0, (retirementAge - age) * 12); const monthlyRate = annualReturn / 12; if (!monthlyRate) return current + monthly * months; return current * Math.pow(1 + monthlyRate, months) + monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate); };
export const getLevel = (xp: number) => LEVELS.reduce((current, level) => (xp >= level.min ? level : current), LEVELS[0]);
export const getPersona = (answers: Record<string, string>): Persona => { if (answers.savingsStyle === "aggressive") return "Ambitious Saver"; if (answers.savingsStyle === "plan") return "Future Planner"; if (answers.savingsStyle === "steady") return "Consistent Builder"; return "Steady Starter"; };

type SavetripContextValue = { user: UserProfile; updateUser: (updates: Partial<UserProfile>) => void; registerAccount: (name: string, email: string, password: string) => void; login: (email: string, password: string) => boolean; loginDemo: () => void; logout: () => void; verifyEmail: () => void; completeOnboarding: (updates: Partial<UserProfile>, quizAnswers: Record<string, string>) => void; addSavings: (amount: number) => { completed: number[]; leveledUp: boolean; xpEarned: number }; addConfirmedContribution: (contribution: Contribution) => { completed: number[]; leveledUp: boolean; xpEarned: number }; linkCard: (card: Omit<LinkedCard, "id">) => void; removeCard: (id: string) => void; activatePremium: () => void; useFreeze: () => boolean; resetDemo: () => void; };
const normalizeUser = (stored: Partial<UserProfile> | null): UserProfile => ({ ...DEFAULT_USER, ...stored, quizAnswers: stored?.quizAnswers ?? {}, contributions: stored?.contributions ?? [], investmentPlanId: stored?.investmentPlanId ?? DEFAULT_USER.investmentPlanId, linkedCards: (stored?.linkedCards ?? []).map((card) => ({ ...card, verified: card.verified ?? true, status: card.status ?? "verified" })), badgeDates: stored?.badgeDates ?? DEFAULT_USER.badgeDates, settings: { ...DEFAULT_USER.settings, ...(stored?.settings ?? {}) } });
const SavetripContext = createContext<SavetripContextValue | null>(null);

export function SavetripProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(() => { try { return normalizeUser(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); } catch { return DEFAULT_USER; } });
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); }, [user]);
  const updateUser = (updates: Partial<UserProfile>) => setUser((current) => ({ ...current, ...updates }));
  const registerAccount = (name: string, email: string, password: string) => setUser({ ...DEFAULT_USER, id: `account-${Date.now()}`, name, email: email.trim().toLowerCase(), password, isLoggedIn: true, onboardingCompleted: false, emailVerified: false, quizAnswers: {}, currentSavings: 0, monthlyContribution: 500, currentStreak: 0, longestStreak: 0, xp: 0, microGoalProgress: 0, completedMicroGoals: [], badges: [], badgeDates: {}, linkedCards: [], investmentPlanId: "balanced", contributions: [], isPremium: false });
  const login = (email: string, password: string) => { if (user.email.toLowerCase() !== email.trim().toLowerCase() || user.password !== password) return false; setUser((current) => ({ ...current, isLoggedIn: true })); return true; };
  const loginDemo = () => setUser((current) => ({ ...current, isLoggedIn: true, onboardingCompleted: true, emailVerified: true }));
  const logout = () => setUser((current) => ({ ...current, isLoggedIn: false }));
  const verifyEmail = () => setUser((current) => ({ ...current, emailVerified: true }));
  const completeOnboarding = (updates: Partial<UserProfile>, quizAnswers: Record<string, string>) => setUser((current) => ({ ...current, ...updates, quizAnswers, onboardingCompleted: true, isLoggedIn: true }));
  const addSavings = (amount: number) => {
    let result = { completed: [] as number[], leveledUp: false, xpEarned: Math.max(10, Math.round(amount / 5)) };
    setUser((current) => {
      const previousLevel = getLevel(current.xp).level; const newProgress = current.microGoalProgress + amount;
      const completed = MICRO_GOALS.filter((goal) => newProgress >= goal.target && !current.completedMicroGoals.includes(goal.target)).map((goal) => goal.target);
      const xp = current.xp + result.xpEarned + completed.length * 50; const nextLevel = getLevel(xp).level; result = { completed, leveledUp: nextLevel > previousLevel, xpEarned: result.xpEarned + completed.length * 50 };
      const nextStreak = current.currentStreak + 1; const nextSavings = current.currentSavings + amount; const nextCompleted = [...current.completedMicroGoals, ...completed];
      const shouldUnlock = (badge: BadgeDefinition) => badge.category === "savings" ? (badge.id === "first-deposit" ? nextSavings > 0 : nextSavings >= badge.threshold) : badge.category === "streak" ? nextStreak >= badge.threshold : badge.category === "micro-goal" ? nextCompleted.length >= badge.threshold : badge.category === "xp" ? xp >= badge.threshold : badge.id === "momentum-builder" ? nextStreak >= badge.threshold : badge.id === "consistent-saver" ? nextStreak >= badge.threshold : badge.id === "future-focused" ? nextStreak >= badge.threshold : nextStreak >= badge.threshold;
      const newBadgeIds = BADGES.filter((badge) => !current.badges.includes(badge.id) && shouldUnlock(badge)).map((badge) => badge.id); const today = new Date().toISOString().slice(0, 10); const badgeDates = { ...current.badgeDates }; newBadgeIds.forEach((id) => { badgeDates[id] = today; });
      return { ...current, currentSavings: nextSavings, microGoalProgress: newProgress, completedMicroGoals: nextCompleted, xp, currentStreak: nextStreak, longestStreak: Math.max(current.longestStreak, nextStreak), badges: [...current.badges, ...newBadgeIds], badgeDates };
    }); return result;
  };
  const addConfirmedContribution = (contribution: Contribution) => {
    const result = addSavings(contribution.amount);
    setUser((current) => ({ ...current, contributions: [...current.contributions, contribution] }));
    return result;
  };
  const linkCard = (card: Omit<LinkedCard, "id">) => setUser((current) => ({ ...current, linkedCards: [...current.linkedCards, { ...card, id: `card-${Date.now()}` }] }));
  const removeCard = (id: string) => setUser((current) => ({ ...current, linkedCards: current.linkedCards.filter((card) => card.id !== id) }));
  const activatePremium = () => setUser((current) => ({ ...current, isPremium: true }));
  const useFreeze = () => { if (user.streakFreezes <= 0) return false; setUser((current) => ({ ...current, streakFreezes: current.streakFreezes - 1 })); return true; };
  const resetDemo = () => setUser(DEFAULT_USER);
  const value = useMemo(() => ({ user, updateUser, registerAccount, login, loginDemo, logout, verifyEmail, completeOnboarding, addSavings, addConfirmedContribution, linkCard, removeCard, activatePremium, useFreeze, resetDemo }), [user]);
  return <SavetripContext.Provider value={value}>{children}</SavetripContext.Provider>;
}
export const useSavetrip = () => { const context = useContext(SavetripContext); if (!context) throw new Error("useSavetrip must be used inside SavetripProvider"); return context; };
