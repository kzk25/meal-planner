"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatCurrency, getWeekStartDate, formatWeekStartDate, addDays,
  DAY_NAMES, DAY_LABELS, MEAL_TYPES, MEAL_LABELS, MEAL_ICONS, CATEGORY_COLORS,
  type DayName, type MealType,
} from "@/lib/utils";
import type { MealPlan, Dish } from "@/lib/types";
import { ChevronLeft, ChevronRight, Heart, RefreshCw, Plus, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { DishSelectModal } from "@/components/meal-plan/dish-select-modal";
import { RecipeModal } from "@/components/meal-plan/recipe-modal";

export default function MealPlanPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStartDate());
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ day: DayName; mealType: MealType } | null>(null);
  const [recipeModalDish, setRecipeModalDish] = useState<number | null>(null);

  const weekStartStr = formatWeekStartDate(currentWeekStart);

  const weekDates = DAY_NAMES.map((_, i) => addDays(currentWeekStart, i));

  const fetchMealPlan = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/meal-plan?week=${weekStartStr}`);
    const data = await res.json();
    setMealPlans(data ?? []);
    setLoading(false);
  }, [weekStartStr]);

  useEffect(() => { fetchMealPlan(); }, [fetchMealPlan]);

  function getMeal(day: DayName, mealType: MealType): MealPlan | undefined {
    return mealPlans.find((p) => p.day_of_week === day && p.meal_type === mealType);
  }

  async function handleToggleFavorite(dish: Dish) {
    await fetch(`/api/dishes/${dish.id}/favorite`, { method: "POST" });
    toast.success(dish.is_favorite ? "お気に入りを解除しました" : "お気に入りに追加しました");
    fetchMealPlan();
  }

  async function handleRemoveMeal(day: DayName, mealType: MealType) {
    const plan = getMeal(day, mealType);
    if (!plan?.id) return;
    await fetch(`/api/meal-plan/${plan.id}`, { method: "DELETE" });
    toast.success("献立を削除しました");
    fetchMealPlan();
  }

  async function handleSelectDish(dish: Dish) {
    if (!selectedCell) return;
    const { day, mealType } = selectedCell;
    await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_start_date: weekStartStr,
        day_of_week: day,
        meal_type: mealType,
        dish_id: dish.id,
        servings: 1,
      }),
    });
    toast.success("献立を設定しました");
    setSelectedCell(null);
    fetchMealPlan();
  }

  const prevWeek = () => setCurrentWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setCurrentWeekStart((d) => addDays(d, 7));
  const goToThisWeek = () => setCurrentWeekStart(getWeekStartDate());

  const isThisWeek = formatWeekStartDate(currentWeekStart) === formatWeekStartDate(getWeekStartDate());

  const totalCalories = mealPlans.reduce((sum, p) => sum + (p.dish?.calories ?? 0) * (p.servings ?? 1), 0);
  const totalCost = mealPlans.reduce((sum, p) => sum + (p.dish?.estimated_price_per_serving ?? 0) * (p.servings ?? 1), 0);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">週間献立</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
          <button onClick={goToThisWeek} className="text-sm font-medium text-gray-700 hover:text-primary min-w-[100px] text-center">
            {currentWeekStart.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}〜
            {addDays(currentWeekStart, 6).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
            {isThisWeek && <span className="ml-1 text-xs text-primary">（今週）</span>}
          </button>
          <Button variant="ghost" size="icon" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4 mb-4 p-3 bg-white rounded-xl border border-gray-100 text-sm">
        <span className="text-gray-500">週間合計:</span>
        <span className="font-medium">{Math.round(totalCalories).toLocaleString()} kcal</span>
        <span className="text-gray-300">|</span>
        <span className="font-medium">{formatCurrency(totalCost)}（概算）</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">{mealPlans.filter((p) => p.dish_id).length}/21食</span>
      </div>

      {/* Grid - horizontal scroll on SP */}
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="w-14" />
            {DAY_NAMES.map((day, i) => (
              <div key={day} className="text-center">
                <div className={`text-xs font-medium py-1 rounded-lg ${
                  formatWeekStartDate(weekDates[i]) === formatWeekStartDate(new Date()) ? "bg-primary text-white" : "text-gray-500"
                }`}>
                  {DAY_LABELS[day as DayName]}<br />
                  <span className="text-[10px] opacity-75">{weekDates[i].getDate()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Meal rows */}
          {MEAL_TYPES.map((mealType) => (
            <div key={mealType} className="grid grid-cols-8 gap-1 mb-1">
              <div className="flex flex-col items-center justify-center text-xs text-gray-500 py-2">
                <span>{MEAL_ICONS[mealType]}</span>
                <span>{MEAL_LABELS[mealType]}</span>
              </div>
              {DAY_NAMES.map((day) => {
                const plan = getMeal(day as DayName, mealType);
                const dish = plan?.dish;
                return (
                  <div key={day} className="relative">
                    {dish ? (
                      <div className="bg-white rounded-lg border border-gray-100 p-1.5 h-full min-h-[72px] shadow-sm hover:border-primary/30 transition-colors">
                        {plan?.is_prepcook && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 rounded px-1 mb-0.5 inline-block">🍱作り置き</span>
                        )}
                        <button
                          onClick={() => setRecipeModalDish(dish.id)}
                          className="text-xs font-medium text-gray-800 leading-tight line-clamp-2 mb-1 text-left hover:text-primary hover:underline w-full"
                        >
                          {dish.name}
                        </button>
                        {dish.category && (
                          <span className={`text-[9px] rounded px-1 ${CATEGORY_COLORS[dish.category] ?? CATEGORY_COLORS["その他"]}`}>
                            {dish.category}
                          </span>
                        )}
                        {dish.calories && (
                          <div className="text-[10px] text-gray-400 mt-0.5">{Math.round(dish.calories)}kcal</div>
                        )}
                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleToggleFavorite(dish)}
                            className="p-0.5 rounded hover:bg-gray-100"
                          >
                            <Heart className={`w-3 h-3 ${dish.is_favorite ? "fill-pink-500 text-pink-500" : "text-gray-400"}`} />
                          </button>
                        </div>
                        <button
                          onClick={() => setSelectedCell({ day: day as DayName, mealType })}
                          className="absolute bottom-1 right-1 p-0.5 rounded hover:bg-gray-100 opacity-0 hover:opacity-100"
                          title="変更"
                        >
                          <RefreshCw className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedCell({ day: day as DayName, mealType })}
                        className="w-full h-full min-h-[72px] bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                      >
                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-primary/50" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        <Button
          variant="default"
          size="sm"
          onClick={async () => {
            const res = await fetch("/api/shopping-list/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ week_start_date: weekStartStr }),
            });
            if (res.ok) toast.success("買い物リストを生成しました");
            else toast.error("生成に失敗しました");
          }}
        >
          <ShoppingCart className="w-4 h-4 mr-1" />
          買い物リストを生成
        </Button>
      </div>

      {/* Dish select modal */}
      {selectedCell && (
        <DishSelectModal
          onSelect={handleSelectDish}
          onClose={() => setSelectedCell(null)}
          label={`${DAY_LABELS[selectedCell.day]}曜 ${MEAL_LABELS[selectedCell.mealType]}`}
        />
      )}

      {/* Recipe detail modal */}
      {recipeModalDish && (
        <RecipeModal dishId={recipeModalDish} onClose={() => setRecipeModalDish(null)} />
      )}
    </div>
  );
}

