"use client";
import { useState, useEffect } from "react";
import type { Dish, Ingredient } from "@/lib/types";
import { formatCurrency, CATEGORY_COLORS } from "@/lib/utils";
import { X, Clock, Heart, ChefHat, Loader2, UtensilsCrossed, ShoppingBasket, ExternalLink } from "lucide-react";

interface RecipeModalProps {
  dishId: number;
  onClose: () => void;
}

type DishWithIngredients = Dish & {
  ingredients: Ingredient[];
  cooking_steps?: string[];
};

const SITE_LABELS: Record<string, string> = {
  kurashiru: "クラシル",
  cookpad: "クックパッド",
  delish_kitchen: "デリッシュキッチン",
  nhk: "NHKきょうの料理",
  marucome: "マルコメ",
};

function getSiteLabel(site: string | null | undefined): string {
  if (!site) return "レシピサイト";
  return SITE_LABELS[site] ?? "レシピサイト";
}

type Tab = "recipe" | "ingredients" | "nutrition";

export function RecipeModal({ dishId, onClose }: RecipeModalProps) {
  const [dish, setDish] = useState<DishWithIngredients | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("recipe");

  useEffect(() => {
    setLoading(true);
    setActiveTab("recipe");
    fetch(`/api/dishes/${dishId}`)
      .then((res) => res.json())
      .then((data) => {
        setDish(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dishId]);

  async function handleToggleFavorite() {
    if (!dish) return;
    setFavoriteLoading(true);
    const res = await fetch(`/api/dishes/${dish.id}/favorite`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setDish((prev) => prev ? { ...prev, is_favorite: updated.is_favorite } : prev);
    }
    setFavoriteLoading(false);
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "recipe", label: "作り方", icon: <ChefHat className="w-3.5 h-3.5" /> },
    { id: "ingredients", label: "食材", icon: <ShoppingBasket className="w-3.5 h-3.5" /> },
    { id: "nutrition", label: "栄養", icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <ChefHat className="w-5 h-5 text-primary shrink-0" />
            <h2 className="font-bold text-gray-800 text-lg leading-tight truncate">
              {loading ? "読み込み中..." : (dish?.name ?? "レシピ詳細")}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 shrink-0 ml-2">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Meta badges */}
        {!loading && dish && (
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-1">
            {dish.category && (
              <span className={`text-xs rounded-full px-3 py-1 font-medium ${CATEGORY_COLORS[dish.category] ?? CATEGORY_COLORS["その他"]}`}>
                {dish.category}
              </span>
            )}
            {dish.cooking_time_minutes && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <Clock className="w-3.5 h-3.5" />
                {dish.cooking_time_minutes}分
              </span>
            )}
          </div>
        )}

        {/* Tabs */}
        {!loading && dish && (
          <div className="flex border-b border-gray-100 px-4 mt-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors mr-1
                  ${activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !dish ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              データを読み込めませんでした
            </div>
          ) : (
            <div className="p-4">

              {/* ── 作り方タブ ── */}
              {activeTab === "recipe" && (
                <div className="space-y-3">
                  {/* 参照元サイトリンク（recipe_url or source_url） */}
                  {(() => {
                    const url = dish.recipe_url ?? dish.source_url;
                    const label = getSiteLabel(dish.source_site);
                    if (!url) return null;
                    return (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center shrink-0">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{label}でレシピを確認する</p>
                          <p className="text-xs text-gray-400 truncate">{url}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-orange-400 shrink-0" />
                      </a>
                    );
                  })()}

                  {(!dish.cooking_steps || dish.cooking_steps.length === 0) ? (
                    <div className="text-center py-8 text-gray-400">
                      <ChefHat className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">参考サイトで詳しい手順を確認してください</p>
                    </div>
                  ) : (
                    <>
                      {/* 食材チラ見せ */}
                      {dish.ingredients.length > 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                          <p className="text-xs font-semibold text-amber-700 mb-1.5">
                            使う食材（{dish.ingredients.length}種）
                          </p>
                          <p className="text-xs text-amber-600 leading-relaxed">
                            {dish.ingredients
                              .map((i) => `${i.name}${i.amount ? ` ${i.amount}${i.unit ?? ""}` : ""}`)
                              .join("　")}
                          </p>
                        </div>
                      )}

                      {/* ステップリスト */}
                      <ol className="space-y-0">
                        {dish.cooking_steps.map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {i + 1}
                              </div>
                              {i < dish.cooking_steps!.length - 1 && (
                                <div className="w-0.5 bg-primary/20 flex-1 my-1" style={{ minHeight: "16px" }} />
                              )}
                            </div>
                            <div className={`flex-1 pt-0.5 ${i < dish.cooking_steps!.length - 1 ? "pb-4" : "pb-1"}`}>
                              <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                            </div>
                          </li>
                        ))}
                      </ol>

                      {/* 完成バナー */}
                      <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-xl text-center">
                        <p className="text-sm text-green-700 font-medium">🍽 完成！白米と一緒にどうぞ</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── 食材タブ ── */}
              {activeTab === "ingredients" && (
                <div className="space-y-3">
                  {dish.ingredients.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">食材データがありません</div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500">
                              <th className="text-left px-3 py-2.5 font-medium">食材名</th>
                              <th className="text-center px-3 py-2.5 font-medium">分量</th>
                              <th className="text-right px-3 py-2.5 font-medium">目安金額</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dish.ingredients.map((ing, i) => (
                              <tr key={ing.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                                <td className="px-3 py-2.5 text-gray-800">{ing.name}</td>
                                <td className="px-3 py-2.5 text-center text-gray-600">
                                  {ing.amount != null ? `${ing.amount}${ing.unit ?? ""}` : (ing.unit ?? "—")}
                                </td>
                                <td className="px-3 py-2.5 text-right text-gray-500">
                                  {ing.estimated_price != null ? `¥${ing.estimated_price}` : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {dish.estimated_price_per_serving != null && (
                        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                          <span className="text-sm text-gray-600 font-medium">推定コスト（1人前）</span>
                          <span className="text-base font-bold text-primary">
                            {formatCurrency(dish.estimated_price_per_serving)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── 栄養タブ ── */}
              {activeTab === "nutrition" && (
                <div className="space-y-3">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-primary">
                      {dish.calories != null ? Math.round(dish.calories) : "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">カロリー (kcal)　※白米180g含む</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "タンパク質", value: dish.protein, unit: "g", color: "bg-blue-50 border-blue-100 text-blue-700" },
                      { label: "脂質", value: dish.fat, unit: "g", color: "bg-yellow-50 border-yellow-100 text-yellow-700" },
                      { label: "炭水化物", value: dish.carbs, unit: "g", color: "bg-orange-50 border-orange-100 text-orange-700" },
                      { label: "食物繊維", value: dish.fiber, unit: "g", color: "bg-green-50 border-green-100 text-green-700" },
                      { label: "塩分", value: dish.salt, unit: "g", color: "bg-red-50 border-red-100 text-red-700" },
                    ].map(({ label, value, unit, color }) => (
                      <div key={label} className={`border rounded-xl p-3 text-center ${color}`}>
                        <div className="text-xl font-bold">
                          {value != null ? value.toFixed(1) : "—"}
                          <span className="text-xs font-normal ml-0.5">{unit}</span>
                        </div>
                        <div className="text-xs mt-0.5 opacity-70">{label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">※ 1人前あたり（4人前÷4）の値</p>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer with favorite button */}
        {!loading && dish && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-colors text-sm font-medium
                ${dish.is_favorite
                  ? "bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
            >
              {favoriteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className={`w-4 h-4 ${dish.is_favorite ? "fill-pink-500 text-pink-500" : ""}`} />
              )}
              {dish.is_favorite ? "お気に入り解除" : "お気に入りに追加"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
