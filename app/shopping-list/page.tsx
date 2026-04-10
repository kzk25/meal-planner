"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getWeekStartDate, formatWeekStartDate, addDays } from "@/lib/utils";
import type { ShoppingItem } from "@/lib/types";
import { ShoppingCart, ChevronLeft, ChevronRight, Check, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["野菜・果物", "肉・魚", "乳製品・卵", "乾物・穀物", "調味料", "その他"];

function getCategoryEmoji(cat: string) {
  const map: Record<string, string> = {
    "野菜・果物": "🥦",
    "肉・魚": "🥩",
    "乳製品・卵": "🥚",
    "乾物・穀物": "🌾",
    "調味料": "🧂",
    "その他": "📦",
  };
  return map[cat] ?? "📦";
}

export default function ShoppingListPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStartDate());
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addName, setAddName] = useState("");
  const [adding, setAdding] = useState(false);

  const weekStr = formatWeekStartDate(currentWeekStart);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/shopping-list?week=${weekStr}`);
    const data = await res.json();
    setItems(data ?? []);
    setLoading(false);
  }, [weekStr]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleCheck(item: ShoppingItem) {
    const res = await fetch(`/api/shopping-list/${item.id}/check`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_purchased: !item.is_purchased }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_purchased: !i.is_purchased } : i));
    }
  }

  async function handleAdd() {
    if (!addName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/shopping-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_start_date: weekStr,
        ingredient_name: addName.trim(),
        category: "その他",
      }),
    });
    if (res.ok) {
      setAddName("");
      toast.success("追加しました");
      fetchItems();
    }
    setAdding(false);
  }

  async function handleGenerate() {
    const res = await fetch("/api/shopping-list/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_start_date: weekStr }),
    });
    if (res.ok) { toast.success("買い物リストを生成しました"); fetchItems(); }
    else toast.error("生成に失敗しました");
  }

  const grouped = CATEGORIES.map((cat) => ({
    cat,
    items: items.filter((i) => i.category === cat || (!CATEGORIES.includes(i.category) && cat === "その他")),
  })).filter((g) => g.items.length > 0);

  const purchased = items.filter((i) => i.is_purchased).length;
  const total = items.length;
  const totalCost = items.reduce((s, i) => s + (i.estimated_price ?? 0), 0);
  const actualCost = items.filter((i) => i.is_purchased).reduce((s, i) => s + (i.actual_price ?? i.estimated_price ?? 0), 0);

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          買い物リスト
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart((d) => addDays(d, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-gray-500 min-w-[80px] text-center">
            {currentWeekStart.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}週
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart((d) => addDays(d, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-gray-700">{purchased}/{total} 購入済み</span>
            <span className="text-gray-500">{formatCurrency(totalCost)}（概算）</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: total > 0 ? `${(purchased / total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="default" size="sm" onClick={handleGenerate}>
          献立から生成
        </Button>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="食材を追加..."
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={handleAdd} disabled={!addName.trim() || adding}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">買い物リストが空です</p>
            <p className="text-xs mt-1">「献立から生成」ボタンで自動生成できます</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ cat, items: catItems }) => (
            <Card key={cat}>
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <span>{getCategoryEmoji(cat)}</span>
                  {cat}
                  <Badge variant="default" className="ml-auto text-[10px]">
                    {catItems.filter((i) => i.is_purchased).length}/{catItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                {catItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCheck(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      item.is_purchased ? "opacity-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.is_purchased ? "bg-primary border-primary" : "border-gray-300"
                    }`}>
                      {item.is_purchased && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`flex-1 text-sm ${item.is_purchased ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {item.ingredient_name}
                      {item.total_amount && (
                        <span className="text-gray-400 ml-1">{item.total_amount}{item.unit}</span>
                      )}
                    </span>
                    {item.estimated_price && (
                      <span className="text-xs text-gray-400">{formatCurrency(item.estimated_price)}</span>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
