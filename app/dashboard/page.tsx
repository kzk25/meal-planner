"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getWeekStartDate, formatWeekStartDate, DAY_NAMES, DAY_LABELS, MEAL_LABELS, type DayName, type MealType } from "@/lib/utils";
import type { MealPlan, StreakStats } from "@/lib/types";
import Link from "next/link";
import { Flame, ShoppingCart, CalendarDays, TrendingUp, ChefHat, Terminal } from "lucide-react";

const STREAK_MILESTONES = [
  { days: 3, label: "ビギナー", icon: "🌱" },
  { days: 7, label: "1週間達成", icon: "🔥" },
  { days: 14, label: "2週間達成", icon: "⭐" },
  { days: 30, label: "1ヶ月達成", icon: "🏅" },
  { days: 60, label: "2ヶ月達成", icon: "🥈" },
  { days: 100, label: "100日達成", icon: "🥇" },
  { days: 365, label: "1年達成", icon: "💎" },
];

function getStreakBadge(streak: number) {
  let badge = null;
  for (const m of STREAK_MILESTONES) {
    if (streak >= m.days) badge = m;
  }
  return badge;
}

export default function DashboardPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [streak, setStreak] = useState<StreakStats | null>(null);
  const [nutrition, setNutrition] = useState<{ total_calories: number; avg_calories: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const weekStart = formatWeekStartDate(getWeekStartDate());

  useEffect(() => {
    Promise.all([
      fetch(`/api/meal-plan?week=${weekStart}`).then((r) => r.json()),
      fetch("/api/streak").then((r) => r.json()),
      fetch(`/api/nutrition?week=${weekStart}`).then((r) => r.json()),
    ]).then(([plans, streakData, nutritionData]) => {
      setMealPlans(plans ?? []);
      setStreak(streakData);
      setNutrition(nutritionData);
      setLoading(false);
    });
  }, [weekStart]);

  const currentStreak = streak?.current_streak ?? 0;
  const streakBadge = getStreakBadge(currentStreak);

  // Build week grid summary
  const weekSummary = DAY_NAMES.map((day) => {
    const dayPlans = mealPlans.filter((p) => p.day_of_week === day);
    return { day, plans: dayPlans };
  });

  const totalEstimatedCost = mealPlans.reduce((sum, p) => {
    return sum + (p.dish?.estimated_price_per_serving ?? 0) * (p.servings ?? 1);
  }, 0);

  const totalMealsPlanned = mealPlans.filter((p) => p.dish_id).length;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">ダッシュボード</h1>
        <span className="text-sm text-gray-500">{new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}</span>
      </div>

      {/* Streak */}
      {currentStreak > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 p-4 text-white shadow">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8" />
            <div>
              <div className="text-2xl font-bold">{currentStreak}日連続記録中！</div>
              {streakBadge && (
                <div className="text-sm opacity-90">{streakBadge.icon} {streakBadge.label}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-gray-500 mb-1">今週の献立</div>
            <div className="text-2xl font-bold text-primary">{loading ? "…" : totalMealsPlanned}<span className="text-sm font-normal text-gray-500">/21食</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-gray-500 mb-1">週間カロリー</div>
            <div className="text-2xl font-bold text-gray-800">{loading ? "…" : (nutrition?.total_calories ?? 0).toLocaleString()}<span className="text-sm font-normal text-gray-500">kcal</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-gray-500 mb-1">週間食費（概算）</div>
            <div className="text-2xl font-bold text-gray-800">{loading ? "…" : formatCurrency(totalEstimatedCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-gray-500 mb-1">連続記録</div>
            <div className="text-2xl font-bold text-gray-800">{loading ? "…" : streak?.longest_streak ?? 0}<span className="text-sm font-normal text-gray-500">日最長</span></div>
          </CardContent>
        </Card>
      </div>

      {/* This week summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            今週の献立（概要）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-8 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {weekSummary.map(({ day, plans }) => {
                const dinner = plans.find((p) => p.meal_type === "dinner");
                const lunch = plans.find((p) => p.meal_type === "lunch");
                const breakfast = plans.find((p) => p.meal_type === "breakfast");
                const hasPlan = plans.some((p) => p.dish_id);
                return (
                  <div key={day} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                    <span className="w-6 text-sm font-medium text-gray-500 shrink-0">{DAY_LABELS[day as DayName]}</span>
                    {hasPlan ? (
                      <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                        {[breakfast, lunch, dinner].filter(Boolean).map((p) => p?.dish && (
                          <span key={p.id} className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 truncate max-w-[140px]">
                            {MEAL_LABELS[p.meal_type as MealType]} {p.dish.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">未設定</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3">
            <Link href="/meal-plan">
              <Button variant="outline" size="sm" className="w-full">
                献立を確認・編集する
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-primary" />
            クイックアクション
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/shopping-list">
            <Button variant="outline" className="w-full justify-start gap-2">
              <ShoppingCart className="w-4 h-4" />
              買い物リストを確認する
            </Button>
          </Link>
          <Link href="/nutrition">
            <Button variant="outline" className="w-full justify-start gap-2">
              <TrendingUp className="w-4 h-4" />
              栄養バランスを確認する
            </Button>
          </Link>
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-gray-700 mb-1">
              <Terminal className="w-4 h-4" />
              Claude Codeで献立を生成する
            </div>
            <p className="text-xs text-gray-500 mb-2">ターミナルで以下を実行してください：</p>
            <code className="block bg-gray-800 text-green-400 rounded p-2 text-xs font-mono">
              npm run generate-meal-plan
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
