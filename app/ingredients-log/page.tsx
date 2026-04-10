"use client";
export const runtime = 'edge';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2 } from "lucide-react";
import { CATEGORY_COLORS, formatCurrency } from "@/lib/utils";

interface IngredientLog {
  name: string;
  category: string;
  count: number;
  total_estimated: number;
  total_actual: number;
}

type SortMode = "frequency" | "amount";
const WEEK_OPTIONS = [4, 8, 12] as const;

export default function IngredientsLogPage() {
  const [weeks, setWeeks] = useState<4 | 8 | 12>(4);
  const [sortMode, setSortMode] = useState<SortMode>("frequency");
  const [data, setData] = useState<IngredientLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ingredients-log?weeks=${weeks}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [weeks]);

  const sorted = [...data].sort((a, b) => {
    if (sortMode === "amount") {
      return (b.total_estimated || b.total_actual) - (a.total_estimated || a.total_actual);
    }
    return b.count - a.count;
  });

  const top20 = sorted.slice(0, 20);
  const maxCount = top20.length > 0 ? Math.max(...top20.map((d) => d.count)) : 1;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-primary" />
        食材購入ログ
      </h1>

      {/* Controls */}
      <Card>
        <CardContent className="p-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">期間:</span>
            <div className="flex gap-1">
              {WEEK_OPTIONS.map((w) => (
                <Button
                  key={w}
                  size="sm"
                  variant={weeks === w ? "default" : "outline"}
                  onClick={() => setWeeks(w)}
                  className="text-xs h-7 px-2"
                >
                  {w}週
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">並び順:</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={sortMode === "frequency" ? "default" : "outline"}
                onClick={() => setSortMode("frequency")}
                className="text-xs h-7 px-2"
              >
                頻度順
              </Button>
              <Button
                size="sm"
                variant={sortMode === "amount" ? "default" : "outline"}
                onClick={() => setSortMode("amount")}
                className="text-xs h-7 px-2"
              >
                金額順
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm text-gray-700">
            過去{weeks}週間の購入食材
            {!loading && (
              <span className="ml-2 text-gray-400 font-normal">（上位{top20.length}品）</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : top20.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">データがありません</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {top20.map((item, idx) => {
                const barWidth = Math.round((item.count / maxCount) * 100);
                const colorClass = CATEGORY_COLORS[item.category] ?? "bg-gray-100 text-gray-700";
                const displayPrice =
                  item.total_actual > 0 ? item.total_actual : item.total_estimated;
                return (
                  <div key={item.name} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-5 text-right shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {item.name}
                          </span>
                          <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${colorClass}`}>
                            {item.category}
                          </Badge>
                        </div>
                        {/* Frequency bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/60 rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">{item.count}回</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {displayPrice > 0 ? (
                          <span className="text-xs font-medium text-gray-700">
                            {formatCurrency(Math.round(displayPrice))}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
