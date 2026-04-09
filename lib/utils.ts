import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

export function getWeekStartDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekStartDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type DayName = (typeof DAY_NAMES)[number];

export const DAY_LABELS: Record<DayName, string> = {
  monday: "月",
  tuesday: "火",
  wednesday: "水",
  thursday: "木",
  friday: "金",
  saturday: "土",
  sunday: "日",
};

export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
};

export const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
};

export const CATEGORY_COLORS: Record<string, string> = {
  "和食": "bg-orange-100 text-orange-700",
  "洋食": "bg-blue-100 text-blue-700",
  "中華": "bg-red-100 text-red-700",
  "その他": "bg-gray-100 text-gray-700",
};
