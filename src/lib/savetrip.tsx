import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Persona = "Consistent Builder" | "Future Planner" | "Steady Starter" | "Ambitious Saver";

export type UserProfile = {
  name: string;
  age: number;
  income: number;
  currentSavings: number;
  monthlyContribution: number;
  retirementAge: number;
  retirementTarget: number;
  persona: Persona;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  microGoalProgress: number;
  completedMicroGoals: number[];
  badges: string[];
  settings: {
    notifications: boolean;
    theme: "mint" | "sunset" | "midnight";
    currency: "MXN";
  };
};

export const MICRO_GOALS = [
  { target: 250, label: "Starter", reward: "+50 XP", color: "mint" },
  { target: 500, label: "Builder", reward: "+75 XP", color: "blue" },
  { target: 1000, label: "Momentum", reward: "Momentum theme", color: "coral" },
  { target: 2500, label: "Accelerator", reward: "+150 XP", color: "gold" },
  { target: 5000, label: "Champion", reward: "Champion badge", color: "navy" },
];

export const LEVELS = [
  { level: 1, title: "Starter", min: 0, max: 250 },
  { level: 2, title: "Builder", min: 250, max: 500 },
  { level: 3, title: "Consistent", min: 500, max: 750 },
  { level: 4, title: "Momentum Builder", min: 750, max: 1000 },
  { level: 5, title: "Accelerator", min: 1000, max: 1400 },
  { level: 6, title: "Wealth Builder", min: 1400, max: 1850 },
  { level: 7, title: "Retirement Ready", min: 1850, max: 2400 },
];

export const DEFAULT_USER: UserProfile = {
  name: "Max",
  age: 22,
  income: 48000,
  currentSavings: 15000,
  monthlyContribution: 2000,
  retirementAge: 65,
  retirementTarget: 5000000,
  persona: "Consistent Builder",
  xp: 720,
  currentStreak: 12,
  longestStreak: 18,
  streakFreezes: 2,
  microGoalProgress: 750,
  completedMicroGoals: [250, 500],
  badges: ["first-deposit", "streak-7", "projection-improved"],
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

export const getLevel = (xp: number) => {
  return LEVELS.reduce((current, level) => (xp >= level.min ? level : current), LEVELS[0]);
};

export const getPersona = (answers: Record<string, string>): Persona => {
  if (answers.savingsStyle === "aggressive") return "Ambitious Saver";
  if (answers.savingsStyle === "plan") return "Future Planner";
  if (answers.savingsStyle === "steady") return "Consistent Builder";
  return "Steady Starter";
};

type SavetripContextValue = {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  addSavings: (amount: number) => { completed: number[]; leveledUp: boolean; xpEarned: number };
  useFreeze: () => boolean;
  resetDemo: () => void;
};

const SavetripContext = createContext<SavetripContextValue | null>(null);

export function SavetripProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_USER, ...JSON.parse(stored) } : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  const updateUser = (updates: Partial<UserProfile>) => setUser((current) => ({ ...current, ...updates }));

  const addSavings = (amount: number) => {
    let result = { completed: [] as number[], leveledUp: false, xpEarned: Math.max(10, Math.round(amount / 5)) };
    setUser((current) => {
      const previousLevel = getLevel(current.xp).level;
      const newProgress = current.microGoalProgress + amount;
      const completed = MICRO_GOALS.filter((goal) => newProgress >= goal.target && !current.completedMicroGoals.includes(goal.target)).map((goal) => goal.target);
      const xp = current.xp + result.xpEarned + completed.length * 50;
      const nextLevel = getLevel(xp).level;
      result = { completed, leveledUp: nextLevel > previousLevel, xpEarned: result.xpEarned + completed.length * 50 };
      return {
        ...current,
        currentSavings: current.currentSavings + amount,
        microGoalProgress: newProgress,
        completedMicroGoals: [...current.completedMicroGoals, ...completed],
        xp,
        currentStreak: current.currentStreak + 1,
        longestStreak: Math.max(current.longestStreak, current.currentStreak + 1),
        badges: [...new Set([...current.badges, ...(current.currentSavings + amount >= 1000 ? ["first-thousand"] : []), ...(completed.length ? ["micro-goal-master"] : [])])],
      };
    });
    return result;
  };

  const useFreeze = () => {
    if (user.streakFreezes <= 0) return false;
    setUser((current) => ({ ...current, streakFreezes: current.streakFreezes - 1 }));
    return true;
  };

  const resetDemo = () => setUser(DEFAULT_USER);
  const value = useMemo(() => ({ user, updateUser, addSavings, useFreeze, resetDemo }), [user]);

  return <SavetripContext.Provider value={value}>{children}</SavetripContext.Provider>;
}

export const useSavetrip = () => {
  const context = useContext(SavetripContext);
  if (!context) throw new Error("useSavetrip must be used inside SavetripProvider");
  return context;
};
