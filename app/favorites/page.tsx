"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Dish } from "@/lib/types";
import { Heart, Loader2, Search } from "lucide-react";
import { CATEGORY_COLORS, formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function FavoritesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchFavorites = () => {
    fetch("/api/dishes?favorite=true").then((r) => r.json()).then((d) => {
      setDishes(d ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchFavorites(); }, []);

  async function handleUnfavorite(dish: Dish) {
    await fetch(`/api/dishes/${dish.id}/favorite`, { method: "POST" });
    toast.success("お気に入りを解除しました");
    fetchFavorites();
  }

  const filtered = dishes.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-pink-500" />
        <h1 className="text-xl font-bold text-gray-800">お気に入りレシピ</h1>
        <Badge className="ml-auto">{dishes.length}件</Badge>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-9" placeholder="料理名で検索..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Heart className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>{search ? "該当する料理がありません" : "まだお気に入りがありません"}</p>
          <p className="text-sm mt-1">献立ページの❤️ボタンで追加できます</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {filtered.map((dish) => (
            <Card key={dish.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 text-sm truncate">{dish.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dish.category && (
                        <span className={`text-[10px] rounded px-1.5 py-0.5 ${CATEGORY_COLORS[dish.category] ?? CATEGORY_COLORS["その他"]}`}>
                          {dish.category}
                        </span>
                      )}
                      {dish.calories && <span className="text-[10px] text-gray-500">{Math.round(dish.calories)}kcal</span>}
                      {dish.estimated_price_per_serving && (
                        <span className="text-[10px] text-gray-500">{formatCurrency(dish.estimated_price_per_serving)}/食</span>
                      )}
                    </div>
                    {dish.source_url && (
                      <a href={dish.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline mt-1 block">
                        元のレシピを見る
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnfavorite(dish)}
                    className="p-1.5 rounded-full hover:bg-gray-100 shrink-0"
                  >
                    <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
