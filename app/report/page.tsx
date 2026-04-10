"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Loader2 } from "lucide-react";

const ChartLoader = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-5 h-5 animate-spin text-primary" />
  </div>
);

const WeekBarChart = dynamic(
  () => import("./ReportCharts").then((m) => m.WeekBarChart),
  { ssr: false, loading: ChartLoader }
);

const CategoryPieChart = dynamic(
  () => import("./ReportCharts").then((m) => m.CategoryPieChart),
  { ssr: false, loading: ChartLoader }
);

interface WeekData {
  week_start: string;
  label: string;
  total_calories: number;
  total_cost: number;
  meal_count: number;
  avg_calories_per_meal: number;
}

interface CategoryEntry {
  name: string;
  value: number;
}

interface TopDish {
  name: string;
  count: number;
  category: string;
}

interface ReportData {
  weeks: WeekData[];
  category_breakdown: CategoryEntry[];
  top_dishes: TopDish[];
}

const WEEK_OPTIONS = [
  { label: "4週", value: 4 },
  { label: "8週", value: 8 },
  { label: "12週", value: 12 },
] as const;

const CATEGORY_BADGE: Record<string, string> = {
  和食: "bg-orange-100 text-orange-700",
  洋食: "bg-blue-100 text-blue-700",
  中華: "bg-red-100 text-red-700",
  主菜: "bg-green-100 text-green-700",
  副菜: "bg-lime-100 text-lime-700",
  汁物: "bg-yellow-100 text-yellow-700",
  その他: "bg-gray-100 text-gray-600",
};

function categoryBadge(cat: string) {
  return CATEGORY_BADGE[cat] ?? "bg-gray-100 text-gray-600";
}

export default function ReportPage() {
  const [selectedWeeks, setSelectedWeeks] = useState<4 | 8 | 12>(4);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/report?weeks=${selectedWeeks}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setData(d as ReportData);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("データの読み込みに失敗しました");
        setLoading(false);
      });
  }, [selectedWeeks]);

  const hasCalories = data?.weeks.some((w) => w.total_calories > 0) ?? false;
  const hasCost = data?.weeks.some((w) => w.total_cost > 0) ?? false;
  const hasPie = (data?.category_breakdown.length ?? 0) > 0;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          食の傾向レポート
        </h1>

        {/* Week selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {WEEK_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setSelectedWeeks(value as 4 | 8 | 12)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                selectedWeeks === value
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Weekly trend bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">週間トレンド</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasCalories && !hasCost ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  この期間のデータがありません
                </p>
              ) : (
                <WeekBarChart
                  weeks={data.weeks}
                  hasCalories={hasCalories}
                  hasCost={hasCost}
                />
              )}
            </CardContent>
          </Card>

          {/* Summary stats row */}
          {data.weeks.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {(() => {
                const totalMeals = data.weeks.reduce(
                  (s, w) => s + w.meal_count,
                  0
                );
                const avgCalPerMeal =
                  totalMeals > 0
                    ? Math.round(
                        data.weeks.reduce(
                          (s, w) => s + w.total_calories,
                          0
                        ) / totalMeals
                      )
                    : 0;
                const totalCost = data.weeks.reduce(
                  (s, w) => s + w.total_cost,
                  0
                );
                return (
                  <>
                    <Card className="text-center">
                      <CardContent className="pt-4 pb-3">
                        <p className="text-2xl font-bold text-primary">
                          {totalMeals}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          合計食事回数
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-4 pb-3">
                        <p className="text-2xl font-bold text-primary">
                          {avgCalPerMeal > 0
                            ? `${avgCalPerMeal.toLocaleString()}`
                            : "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          平均kcal/食
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-4 pb-3">
                        <p className="text-2xl font-bold text-amber-500">
                          {totalCost > 0 ? formatCurrency(totalCost) : "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          合計食費
                        </p>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          )}

          {/* Category pie chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">カテゴリ分布</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasPie ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  この期間のデータがありません
                </p>
              ) : (
                <CategoryPieChart
                  categoryBreakdown={data.category_breakdown}
                />
              )}
            </CardContent>
          </Card>

          {/* Top 5 dishes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">よく食べる料理 Top5</CardTitle>
            </CardHeader>
            <CardContent>
              {data.top_dishes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  この期間のデータがありません
                </p>
              ) : (
                <ol className="space-y-2">
                  {data.top_dishes.map((dish, index) => (
                    <li
                      key={dish.name}
                      className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          index === 0
                            ? "bg-amber-400 text-white"
                            : index === 1
                            ? "bg-gray-300 text-gray-700"
                            : index === 2
                            ? "bg-orange-300 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                        {dish.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${categoryBadge(
                          dish.category
                        )}`}
                      >
                        {dish.category}
                      </span>
                      <span className="flex-shrink-0 text-xs font-semibold text-primary bg-green-50 px-2 py-0.5 rounded-full">
                        {dish.count}回
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
