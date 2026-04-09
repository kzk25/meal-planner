"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getWeekStartDate, formatWeekStartDate } from "@/lib/utils";
import { BarChart2, Loader2 } from "lucide-react";

const PFC_COLORS = ["#2E7D32", "#FF8F00", "#81C784"];

// Reference daily intake for average adult
const DAILY_TARGET = { calories: 2000, protein: 75, fat: 55, carbs: 250, fiber: 20, salt: 7.5 };

export default function NutritionPage() {
  const [nutrition, setNutrition] = useState<{
    total_calories: number;
    avg_calories: number;
    total_protein: number;
    total_fat: number;
    total_carbs: number;
    total_fiber: number;
    total_salt: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const weekStr = formatWeekStartDate(getWeekStartDate());

  useEffect(() => {
    fetch(`/api/nutrition?week=${weekStr}`).then((r) => r.json()).then((d) => {
      setNutrition(d);
      setLoading(false);
    });
  }, [weekStr]);

  const pfcData = nutrition ? [
    { name: "P（たんぱく質）", value: Math.round(nutrition.total_protein), color: PFC_COLORS[0] },
    { name: "F（脂質）", value: Math.round(nutrition.total_fat), color: PFC_COLORS[1] },
    { name: "C（炭水化物）", value: Math.round(nutrition.total_carbs), color: PFC_COLORS[2] },
  ] : [];

  function pct(actual: number, target: number, days = 7) {
    return Math.round((actual / (target * days)) * 100);
  }

  const nutrients = nutrition ? [
    { label: "カロリー", actual: nutrition.total_calories, target: DAILY_TARGET.calories * 7, unit: "kcal" },
    { label: "たんぱく質", actual: nutrition.total_protein, target: DAILY_TARGET.protein * 7, unit: "g" },
    { label: "脂質", actual: nutrition.total_fat, target: DAILY_TARGET.fat * 7, unit: "g" },
    { label: "炭水化物", actual: nutrition.total_carbs, target: DAILY_TARGET.carbs * 7, unit: "g" },
    { label: "食物繊維", actual: nutrition.total_fiber, target: DAILY_TARGET.fiber * 7, unit: "g" },
    { label: "塩分", actual: nutrition.total_salt, target: DAILY_TARGET.salt * 7, unit: "g" },
  ] : [];

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-primary" />
        栄養分析
      </h1>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-sm">今週の栄養達成率</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {nutrients.map(({ label, actual, target, unit }) => {
                const p = Math.min(Math.round((actual / target) * 100), 150);
                const color = p < 70 ? "#EF4444" : p > 130 ? "#F59E0B" : "#2E7D32";
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{label}</span>
                      <span style={{ color }} className="font-medium">
                        {Math.round(actual)}{unit} / {target}{unit} ({p}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(p, 100)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {pfcData.some((d) => d.value > 0) && (
            <Card>
              <CardHeader><CardTitle className="text-sm">PFCバランス</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pfcData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}>
                        {pfcData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
