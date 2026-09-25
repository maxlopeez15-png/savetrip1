import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Persona = "Consistent Builder" | "Future Planner" | "Steady Starter" | "Ambitious Saver";
export type LinkedCard = { id: string; brand: "Visa" | "Mastercard" | "Amex"; last4: string; expirationMonth: string; expirationYear: string };

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  password: string;
  isLoggedIn: boolean;
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
  xp: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  microGoalProgress: number;
  completedMicroGoals: number[];
  badges: string[];
  linkedCards: LinkedCard[];
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
];
const levelMins = [0, 250, 600, 1000, 1600, 2300, 3200, 4200, 5000, 6500, 7000, 9000, 11000, 13000, 15000, 17500, 20000, 23000, 26000, 30000];
const levelRewards = [
  "Welcome badge", "First Step badge", "Builder badge", "Consistency badge", "New profile badge", "Accelerator badge", "Focused Saver badge", "Wealth Builder badge", "Investor badge", "Premium theme preview",
  "Growth Seeker badge", "Capital Builder badge", "Future Architect badge", "Wealth Planner badge", "Exclusive Legacy badge", "Legacy Builder badge", "Long-Term badge", "Financial Leader badge", "Wealth Master badge", "Ultimate Retirement badge",
];
export const LEVELS = levelTitles.map((title, index) => ({ level: index + 1, title, min: levelMins[index], max: levelMins[index + 1] ?? levelMins[index] + 5000, reward: levelRewards[index] }));

export const DEFAULT_USER: UserProfile = {
  id: "demo-max",
  name: "Max",
  email: "max@pulsepass.demo",
  password: "demo1234",
  isLoggedIn: false,
  onboardingCompleted: true,
  quizAnswers: {},
  age: 22,
  income: 48000,
  currentSavings: 15000,
  monthlyContribution: 2000,
  retirementAge: 65,
  retirementTarget: 5000000,
  expectedReturn: 7,
  persona: "Consistent Builder",
  xp: 720,
  currentStreak: 12,
  longestStreak: 18,
  streakFreezes: 2,
  microGoalProgress: 750,
  completedMicroGoals: [250, 500],
  badges: ["first-deposit", "streak-7", "projection-improved"],
  linkedCards: [],
  isPremium: false,
  settings: { notifications: true, theme: "mint", currency: "MXN" },
};

const STORAGE_KEY = "savetrip-user";

export const formatMoney = (amount: number, compact = false) => {
  if (compact && amount >= 1000000) return `$${(amount / 1000000).toFixed(1)} M`;
  if (compact && amount >= 1000) return `$${Math.round(amount / 1000)} k`;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(amount);
};

export const projectSavings = (current: number, monthly: number, age: number, retirementAge: number, annualReturn = 0.07) => {
  const months = Math.max(0, (retirementAge - age) * 12);
  const monthlyRate = annualReturn / 12;
  if (!monthlyRate) return current + monthly * months;
  return current * Math.pow(1 + monthlyRate, months) + monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
};

export const getLevel = (xp: number) => LEVELS.reduce((current, level) => (xp >= level.min ? level : current), LEVELS[0]);

export const getPersona = (answers: Record<string, string>): Persona => {
  if (answers.savingsStyle === "aggressive") return "Ambitious Saver";
  if (answers.savingsStyle === "plan") return "Future Planner";
  if (answers.savingsStyle === "steady") return "Consistent Builder";
  return "Steady Starter";
};

type SavetripContextValue = {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  registerAccount: (name: string, email: string, password: string) => void;
  login: (email: string, password: string) => boolean;
  loginDemo: () => void;
  logout: () => void;
  completeOnboarding: (updates: Partial<UserProfile>, quizAnswers: Record<string, string>) => void;
  addSavings: (amount: number) => { completed: number[]; leveledUp: boolean; xpEarned: number };
  linkCard: (card: Omit<LinkedCard, "id">) => void;
  removeCard: (id: string) => void;
  activatePremium: () => void;
  useFreeze: () => boolean;
  resetDemo: () => void;
};

const normalizeUser = (stored: Partial<UserProfile> | null): UserProfile => ({
  ...DEFAULT_USER,
  ...stored,
  quizAnswers: stored?.quizAnswers ?? {},
  linkedCards: stored?.linkedCards ?? [],
  settings: { ...DEFAULT_USER.settings, ...(stored?.settings ?? {}) },
});

const SavetripContext = createContext<SavetripContextValue | null>(null);

export function SavetripProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(() => {
    try { return normalizeUser(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); } catch { return DEFAULT_USER; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); }, [user]);
  const updateUser = (updates: Partial<UserProfile>) => setUser((current) => ({ ...current, ...updates }));

  const registerAccount = (name: string, email: string, password: string) => setUser({ ...DEFAULT_USER, id: `account-${Date.now()}`, name, email: email.trim().toLowerCase(), password, isLoggedIn: true, onboardingCompleted: false, quizAnswers: {}, currentSavings: 0, monthlyContribution: 500, currentStreak: 0, longestStreak: 0, xp: 0, microGoalProgress: 0, completedMicroGoals: [], badges: [], linkedCards: [], isPremium: false });
  const login = (email: string, password: string) => {
    if (user.email.toLowerCase() !== email.trim().toLowerCase() || user.password !== password) return false;
    setUser((current) => ({ ...current, isLoggedIn: true }));
    return true;
  };
  const loginDemo = () => setUser((current) => ({ ...current, isLoggedIn: true, onboardingCompleted: true }));
  const logout = () => setUser((current) => ({ ...current, isLoggedIn: false }));
  const completeOnboarding = (updates: Partial<UserProfile>, quizAnswers: Record<string, string>) => setUser((current) => ({ ...current, ...updates, quizAnswers, onboardingCompleted: true, isLoggedIn: true }));

  const addSavings = (amount: number) => {
    let result = { completed: [] as number[], leveledUp: false, xpEarned: Math.max(10, Math.round(amount / 5)) };
    setUser((current) => {
      const previousLevel = getLevel(current.xp).level;
      const newProgress = current.microGoalProgress + amount;
      const completed = MICRO_GOALS.filter((goal) => newProgress >= goal.target && !current.completedMicroGoals.includes(goal.target)).map((goal) => goal.target);
      const xp = current.xp + result.xpEarned + completed.length * 50;
      const nextLevel = getLevel(xp).level;
      result = { completed, leveledUp: nextLevel > previousLevel, xpEarned: result.xpEarned + completed.length * 50 };
      const newBadges = [
        ...(current.currentSavings + amount >= 1000 ? ["first-thousand"] : []),
        ...(completed.length ? ["micro-goal-master"] : []),
        ...(current.currentStreak + 1 >= 30 ? ["streak-30"] : []),
      ];
      return { ...current, currentSavings: current.currentSavings + amount, microGoalProgress: newProgress, completedMicroGoals: [...current.completedMicroGoals, ...completed], xp, currentStreak: current.currentStreak + 1, longestStreak: Math.max(current.longestStreak, current.currentStreak + 1), badges: [...new Set([...current.badges, ...newBadges])] };
    });
    return result;
  };
  const linkCard = (card: Omit<LinkedCard, "id">) => setUser((current) => ({ ...current, linkedCards: [...current.linkedCards, { ...card, id: `card-${Date.now()}` }] }));
  const removeCard = (id: string) => setUser((current) => ({ ...current, linkedCards: current.linkedCards.filter((card) => card.id !== id) }));
  const activatePremium = () => setUser((current) => ({ ...current, isPremium: true }));
  const useFreeze = () => { if (user.streakFreezes <= 0) return false; setUser((current) => ({ ...current, streakFreezes: current.streakFreezes - 1 })); return true; };
  const resetDemo = () => setUser(DEFAULT_USER);
  const value = useMemo(() => ({ user, updateUser, registerAccount, login, loginDemo, logout, completeOnboarding, addSavings, linkCard, removeCard, activatePremium, useFreeze, resetDemo }), [user]);
  return <SavetripContext.Provider value={value}>{children}</SavetripContext.Provider>;
}

export const useSavetrip = () => {
  const context = useContext(SavetripContext);
  if (!context) throw new Error("useSavetrip must be used inside SavetripProvider");
  return context;
};
