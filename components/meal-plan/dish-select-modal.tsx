"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Dish } from "@/lib/types";
import { Search, X, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  onSelect: (dish: Dish) => void;
  onClose: () => void;
  label: string;
}

export function DishSelectModal({ onSelect, onClose, label }: Props) {
  const [search, setSearch] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDishName, setNewDishName] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/dishes?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setDishes(data ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleCreateDish() {
    if (!newDishName.trim()) return;
    const res = await fetch("/api/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDishName.trim(), category: "その他", dish_type: "main" }),
    });
    const dish = await res.json();
    onSelect(dish);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">料理を選択 — {label}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="料理名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
            </div>
          ) : dishes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {search ? `"${search}" が見つかりません` : "料理がまだ登録されていません"}
            </div>
          ) : (
            dishes.map((dish) => (
              <button
                key={dish.id}
                onClick={() => onSelect(dish)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-left transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-800 text-sm">{dish.name}</div>
                  <div className="flex gap-1 mt-0.5">
                    {dish.category && <Badge className="text-[10px]">{dish.category}</Badge>}
                    {dish.calories && <span className="text-[11px] text-gray-500">{Math.round(dish.calories)}kcal</span>}
                  </div>
                </div>
                {dish.estimated_price_per_serving && (
                  <span className="text-xs text-gray-400">{formatCurrency(dish.estimated_price_per_serving)}</span>
                )}
              </button>
            ))
          )}
        </div>
        <div className="p-3 border-t border-gray-100">
          <div className="flex gap-2">
            <Input
              placeholder="新しい料理名を入力..."
              value={newDishName}
              onChange={(e) => setNewDishName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateDish()}
            />
            <Button onClick={handleCreateDish} disabled={!newDishName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
