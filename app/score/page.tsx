"use client";
export const runtime = 'edge';
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatCurrency,
  getWeekStartDate,
  formatWeekStartDate,
  addDays,
} from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";

interface ScoreData {
  week_start_date: string;
  total_score: number;
  calorie_score: number;
  pfc_score: number;
  variety_score: number;
  budget_score: number;
  meal_count: number;
  avg_calories: number;
  total_cost: number;
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-500";
  if (score >= 70) return "text-green-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function getScoreStrokeColor(score: number): string {
  if (score >= 85) return "#10b981"; // emerald-500
  if (score >= 70) return "#22c55e"; // green-500
  if (score >= 50) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "優秀";
  if (score >= 70) return "良好";
  if (score >= 50) return "普通";
  return "要改善";
}

function RingScore({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference * (1 - progress / 100);
  const strokeColor = getScoreStrokeColor(score);
  const textColor = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        {/* Background ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        {/* Score ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${textColor}`}>{score}</span>
        <span className="text-xs text-gray-400">/ 100</span>
        <span className={`text-xs font-medium mt-0.5 ${textColor}`}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

function ScoreBar({ value, max = 25, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function getBarColor(score: number): string {
  if (score >= 22) return "bg-emerald-500";
  if (score >= 18) return "bg-green-500";
  if (score >= 13) return "bg-amber-500";
  return "bg-red-400";
}

const SCORE_ITEMS = [
  { key: "calorie_score" as const, label: "カロリー", desc: "1日平均2000kcal目標" },
  { key: "pfc_score" as const, label: "PFCバランス", desc: "P:15% F:25% C:60%" },
  { key: "variety_score" as const, label: "多様性", desc: "ユニークな料理の数" },
  { key: "budget_score" as const, label: "予算", desc: "週間食費の目標達成" },
];

export default function ScorePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStartDate());
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStartStr = formatWeekStartDate(currentWeekStart);
  const isThisWeek =
    weekStartStr === formatWeekStartDate(getWeekStartDate());

  const fetchScore = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/score?week=${weekStartStr}${forceRefresh ? "&refresh=1" : ""}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("スコアの取得に失敗しました");
        const data = await res.json();
        setScoreData(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    },
    [weekStartStr]
  );

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  const prevWeek = () => setCurrentWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setCurrentWeekStart((d) => addDays(d, 7));
  const goToThisWeek = () => setCurrentWeekStart(getWeekStartDate());

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">週間スコアレポート</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            onClick={goToThisWeek}
            className="text-sm font-medium text-gray-700 hover:text-primary min-w-[110px] text-center"
          >
            {currentWeekStart.toLocaleDateString("ja-JP", {
              month: "short",
              day: "numeric",
            })}
            〜
            {addDays(currentWeekStart, 6).toLocaleDateString("ja-JP", {
              month: "short",
              day: "numeric",
            })}
            {isThisWeek && (
              <span className="ml-1 text-xs text-primary">（今週）</span>
            )}
          </button>
          <Button variant="ghost" size="icon" onClick={nextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl p-6 text-center text-red-500">
          <p className="text-sm">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => fetchScore()}
          >
            再試行
          </Button>
        </div>
      ) : scoreData ? (
        <div className="space-y-4">
          {/* Total score ring */}
          <Card className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <RingScore score={scoreData.total_score} />
              <div>
                <p className="text-sm text-gray-500 mt-1">
                  週間スコア
                  <span className="ml-2 text-xs text-gray-400">
                    {currentWeekStart.toLocaleDateString("ja-JP", {
                      month: "long",
                      day: "numeric",
                    })}
                    週
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-400 hover:text-gray-600"
                onClick={() => fetchScore(true)}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                再計算
              </Button>
            </div>
          </Card>

          {/* Score breakdown */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              スコア内訳
            </h2>
            <div className="space-y-4">
              {SCORE_ITEMS.map(({ key, label, desc }) => {
                const val = scoreData[key];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-gray-800">
                          {label}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">{desc}</span>
                      </div>
                      <span
                        className={`text-sm font-bold ${getScoreColor(val * 4)}`}
                      >
                        {val}
                        <span className="text-xs font-normal text-gray-400">
                          {" "}
                          / 25
                        </span>
                      </span>
                    </div>
                    <ScoreBar value={val} max={25} color={getBarColor(val)} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Supplementary stats */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              週間サマリー
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {scoreData.meal_count}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">食数</p>
                <p className="text-[10px] text-gray-400">/ 21食</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {scoreData.avg_calories > 0
                    ? scoreData.avg_calories.toLocaleString()
                    : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">平均カロリー</p>
                <p className="text-[10px] text-gray-400">kcal / 日</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-800">
                  {scoreData.total_cost > 0
                    ? formatCurrency(scoreData.total_cost)
                    : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">推定総食費</p>
                <p className="text-[10px] text-gray-400">週間合計</p>
              </div>
            </div>
          </Card>

          {/* Score guide */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              スコアガイド
            </h2>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { range: "85〜100", label: "優秀", color: "text-emerald-500", bg: "bg-emerald-50" },
                { range: "70〜84", label: "良好", color: "text-green-500", bg: "bg-green-50" },
                { range: "50〜69", label: "普通", color: "text-amber-500", bg: "bg-amber-50" },
                { range: "0〜49", label: "要改善", color: "text-red-500", bg: "bg-red-50" },
              ].map(({ range, label, color, bg }) => (
                <div key={range} className={`${bg} rounded-lg px-3 py-1.5 flex justify-between`}>
                  <span className="text-gray-600">{range}点</span>
                  <span className={`font-semibold ${color}`}>{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
