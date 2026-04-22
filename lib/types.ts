export interface Dish {
  id: number;
  name: string;
  category: string;
  dish_type: "main" | "side" | "soup";
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  fiber: number | null;
  salt: number | null;
  estimated_price_per_serving: number | null;
  cooking_time_minutes: number | null;
  is_favorite: boolean;
  source_url: string | null;
  source_site: string | null;
  recipe_url: string | null;
  created_at: string;
}

export interface Ingredient {
  id: number;
  dish_id: number;
  name: string;
  amount: number | null;
  unit: string | null;
  estimated_price: number | null;
}

export interface MealPlan {
  id: number;
  week_start_date: string;
  day_of_week: string;
  meal_type: string;
  dish_id: number | null;
  servings: number;
  is_prepcook: boolean;
  dish?: Dish | null;
}

export interface ShoppingItem {
  id: number;
  week_start_date: string;
  ingredient_name: string;
  total_amount: number | null;
  unit: string | null;
  category: string;
  estimated_price: number | null;
  actual_price: number | null;
  is_purchased: boolean;
  purchased_at: string | null;
  add_to_fridge: boolean;
}

export interface MealRecord {
  id: number;
  recorded_date: string;
  meal_type: string;
  dish_id: number | null;
  dish_name: string | null;
  servings: number;
  note: string | null;
  source: string;
  created_at: string;
  dish?: Dish | null;
}

export interface StreakStats {
  id: number;
  current_streak: number;
  longest_streak: number;
  last_recorded_date: string | null;
  total_recorded_days: number;
}

export interface UserProfile {
  id: number;
  gender: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string;
  goal: string;
  meal_budget_per_meal: number;
  meal_budget_per_day: number;
  default_servings: number;
  preferred_categories: string[];
  allergies: string | null;
  include_side_dish: boolean;
  include_soup: boolean;
  claude_api_key: string | null;
  notion_api_key: string | null;
  notion_database_id: string | null;
  rice_purchase_kg: number | null;
  rice_daily_consumption_go: number;
  rice_last_purchased_at: string | null;
  rice_notify_days_before: number;
  streak_min_meals_per_day: number;
}

export interface FridgeItem {
  id: number;
  name: string;
  amount: number | null;
  unit: string | null;
  category: string;
  expiry_date: string | null;
  is_finished: boolean;
  added_from: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyNutrition {
  total_calories: number;
  avg_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_fiber: number;
  total_salt: number;
  days_with_data: number;
}
