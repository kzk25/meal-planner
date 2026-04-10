/**
 * 今週（2026/4/6〜4/12）の献立をDBに書き込む
 * 2人前・予算¥300/食・和食/洋食/中華・副菜あり・汁物なし
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { writeToDB } from "./generate-meal-plan";

const WEEK = "2026-04-05"; // アプリが使うUTC表記

const mealPlan = [
  {
    day: "monday",
    breakfast: {
      name: "目玉焼きトースト",
      category: "洋食", dish_type: "main",
      calories: 320, protein: 12, fat: 14, carbs: 38, fiber: 2, salt: 1.2,
      estimated_price_per_serving: 80, cooking_time_minutes: 8,
      ingredients: [
        { name: "食パン", amount: 2, unit: "枚", estimated_price: 30 },
        { name: "卵", amount: 1, unit: "個", estimated_price: 30 },
        { name: "バター", amount: 5, unit: "g", estimated_price: 10 },
      ],
    },
    lunch: {
      name: "ざるそば",
      category: "和食", dish_type: "main",
      calories: 380, protein: 14, fat: 2, carbs: 72, fiber: 3, salt: 2.5,
      estimated_price_per_serving: 180, cooking_time_minutes: 10,
      ingredients: [
        { name: "そば（乾麺）", amount: 100, unit: "g", estimated_price: 120 },
        { name: "めんつゆ", amount: 50, unit: "ml", estimated_price: 40 },
        { name: "ねぎ", amount: 20, unit: "g", estimated_price: 20 },
      ],
    },
    dinner: {
      name: "鶏の照り焼き",
      category: "和食", dish_type: "main",
      calories: 480, protein: 32, fat: 18, carbs: 30, fiber: 1, salt: 2.0,
      estimated_price_per_serving: 250, cooking_time_minutes: 20,
      ingredients: [
        { name: "鶏もも肉", amount: 200, unit: "g", estimated_price: 180 },
        { name: "醤油", amount: 20, unit: "ml", estimated_price: 10 },
        { name: "みりん", amount: 20, unit: "ml", estimated_price: 10 },
        { name: "砂糖", amount: 10, unit: "g", estimated_price: 5 },
        { name: "サラダ油", amount: 5, unit: "ml", estimated_price: 5 },
      ],
    },
  },
  {
    day: "tuesday",
    breakfast: {
      name: "バナナヨーグルト",
      category: "洋食", dish_type: "main",
      calories: 220, protein: 8, fat: 4, carbs: 38, fiber: 2, salt: 0.2,
      estimated_price_per_serving: 100, cooking_time_minutes: 3,
      ingredients: [
        { name: "バナナ", amount: 1, unit: "本", estimated_price: 50 },
        { name: "プレーンヨーグルト", amount: 150, unit: "g", estimated_price: 60 },
        { name: "はちみつ", amount: 10, unit: "g", estimated_price: 10 },
      ],
    },
    lunch: {
      name: "チャーハン",
      category: "中華", dish_type: "main",
      calories: 520, protein: 16, fat: 14, carbs: 76, fiber: 2, salt: 2.2,
      estimated_price_per_serving: 150, cooking_time_minutes: 15,
      ingredients: [
        { name: "ご飯", amount: 200, unit: "g", estimated_price: 40 },
        { name: "卵", amount: 1, unit: "個", estimated_price: 30 },
        { name: "ねぎ", amount: 30, unit: "g", estimated_price: 20 },
        { name: "ハム", amount: 40, unit: "g", estimated_price: 60 },
        { name: "醤油", amount: 10, unit: "ml", estimated_price: 5 },
        { name: "ごま油", amount: 5, unit: "ml", estimated_price: 10 },
      ],
    },
    dinner: {
      name: "肉じゃが",
      category: "和食", dish_type: "main",
      calories: 440, protein: 18, fat: 12, carbs: 58, fiber: 4, salt: 2.8,
      estimated_price_per_serving: 280, cooking_time_minutes: 35,
      ingredients: [
        { name: "牛こま肉", amount: 100, unit: "g", estimated_price: 150 },
        { name: "じゃがいも", amount: 200, unit: "g", estimated_price: 60 },
        { name: "玉ねぎ", amount: 100, unit: "g", estimated_price: 30 },
        { name: "にんじん", amount: 50, unit: "g", estimated_price: 20 },
        { name: "醤油", amount: 30, unit: "ml", estimated_price: 10 },
        { name: "みりん", amount: 20, unit: "ml", estimated_price: 10 },
      ],
    },
  },
  {
    day: "wednesday",
    breakfast: {
      name: "卵かけご飯",
      category: "和食", dish_type: "main",
      calories: 340, protein: 14, fat: 8, carbs: 52, fiber: 1, salt: 1.0,
      estimated_price_per_serving: 70, cooking_time_minutes: 5,
      ingredients: [
        { name: "ご飯", amount: 180, unit: "g", estimated_price: 36 },
        { name: "卵", amount: 1, unit: "個", estimated_price: 30 },
        { name: "醤油", amount: 5, unit: "ml", estimated_price: 3 },
      ],
    },
    lunch: {
      name: "豚キムチ炒め",
      category: "和食", dish_type: "main",
      calories: 460, protein: 22, fat: 20, carbs: 40, fiber: 3, salt: 2.4,
      estimated_price_per_serving: 270, cooking_time_minutes: 15,
      ingredients: [
        { name: "豚バラ肉", amount: 120, unit: "g", estimated_price: 160 },
        { name: "キムチ", amount: 100, unit: "g", estimated_price: 80 },
        { name: "ご飯", amount: 180, unit: "g", estimated_price: 36 },
        { name: "ごま油", amount: 5, unit: "ml", estimated_price: 10 },
      ],
    },
    dinner: {
      name: "鮭のムニエル",
      category: "洋食", dish_type: "main",
      calories: 420, protein: 30, fat: 16, carbs: 28, fiber: 2, salt: 1.8,
      estimated_price_per_serving: 280, cooking_time_minutes: 20,
      ingredients: [
        { name: "鮭切り身", amount: 150, unit: "g", estimated_price: 200 },
        { name: "薄力粉", amount: 15, unit: "g", estimated_price: 5 },
        { name: "バター", amount: 15, unit: "g", estimated_price: 30 },
        { name: "レモン", amount: 0.25, unit: "個", estimated_price: 30 },
        { name: "塩こしょう", amount: 2, unit: "g", estimated_price: 2 },
      ],
    },
  },
  {
    day: "thursday",
    breakfast: {
      name: "おにぎり（梅・昆布）",
      category: "和食", dish_type: "main",
      calories: 360, protein: 8, fat: 2, carbs: 74, fiber: 1, salt: 1.5,
      estimated_price_per_serving: 80, cooking_time_minutes: 10,
      ingredients: [
        { name: "ご飯", amount: 300, unit: "g", estimated_price: 60 },
        { name: "梅干し", amount: 1, unit: "個", estimated_price: 20 },
        { name: "昆布佃煮", amount: 20, unit: "g", estimated_price: 30 },
        { name: "焼き海苔", amount: 2, unit: "枚", estimated_price: 20 },
      ],
    },
    lunch: {
      name: "親子丼",
      category: "和食", dish_type: "main",
      calories: 560, protein: 26, fat: 14, carbs: 72, fiber: 2, salt: 2.6,
      estimated_price_per_serving: 200, cooking_time_minutes: 20,
      ingredients: [
        { name: "鶏もも肉", amount: 120, unit: "g", estimated_price: 110 },
        { name: "卵", amount: 2, unit: "個", estimated_price: 60 },
        { name: "玉ねぎ", amount: 80, unit: "g", estimated_price: 24 },
        { name: "ご飯", amount: 200, unit: "g", estimated_price: 40 },
        { name: "めんつゆ", amount: 40, unit: "ml", estimated_price: 30 },
      ],
    },
    dinner: {
      name: "ハンバーグ",
      category: "洋食", dish_type: "main",
      calories: 540, protein: 28, fat: 30, carbs: 28, fiber: 2, salt: 2.2,
      estimated_price_per_serving: 290, cooking_time_minutes: 30,
      ingredients: [
        { name: "合挽き肉", amount: 150, unit: "g", estimated_price: 180 },
        { name: "玉ねぎ", amount: 80, unit: "g", estimated_price: 24 },
        { name: "卵", amount: 0.5, unit: "個", estimated_price: 15 },
        { name: "パン粉", amount: 20, unit: "g", estimated_price: 10 },
        { name: "牛乳", amount: 30, unit: "ml", estimated_price: 10 },
        { name: "ケチャップ", amount: 20, unit: "ml", estimated_price: 10 },
        { name: "ウスターソース", amount: 15, unit: "ml", estimated_price: 8 },
      ],
    },
  },
  {
    day: "friday",
    breakfast: {
      name: "トースト&コーヒー",
      category: "洋食", dish_type: "main",
      calories: 280, protein: 8, fat: 8, carbs: 42, fiber: 2, salt: 0.8,
      estimated_price_per_serving: 70, cooking_time_minutes: 5,
      ingredients: [
        { name: "食パン", amount: 2, unit: "枚", estimated_price: 30 },
        { name: "バター", amount: 8, unit: "g", estimated_price: 15 },
        { name: "ジャム", amount: 20, unit: "g", estimated_price: 20 },
      ],
    },
    lunch: {
      name: "ナポリタン",
      category: "洋食", dish_type: "main",
      calories: 520, protein: 18, fat: 12, carbs: 78, fiber: 4, salt: 2.8,
      estimated_price_per_serving: 200, cooking_time_minutes: 20,
      ingredients: [
        { name: "スパゲッティ", amount: 100, unit: "g", estimated_price: 50 },
        { name: "ウインナー", amount: 60, unit: "g", estimated_price: 80 },
        { name: "玉ねぎ", amount: 80, unit: "g", estimated_price: 24 },
        { name: "ピーマン", amount: 40, unit: "g", estimated_price: 30 },
        { name: "ケチャップ", amount: 60, unit: "ml", estimated_price: 20 },
      ],
    },
    dinner: {
      name: "豚の生姜焼き",
      category: "和食", dish_type: "main",
      calories: 500, protein: 26, fat: 22, carbs: 42, fiber: 2, salt: 2.4,
      estimated_price_per_serving: 260, cooking_time_minutes: 15,
      ingredients: [
        { name: "豚ロース薄切り", amount: 150, unit: "g", estimated_price: 180 },
        { name: "生姜", amount: 15, unit: "g", estimated_price: 15 },
        { name: "醤油", amount: 20, unit: "ml", estimated_price: 8 },
        { name: "みりん", amount: 20, unit: "ml", estimated_price: 8 },
        { name: "酒", amount: 15, unit: "ml", estimated_price: 8 },
        { name: "ご飯", amount: 180, unit: "g", estimated_price: 36 },
      ],
    },
  },
  {
    day: "saturday",
    breakfast: {
      name: "パンケーキ",
      category: "洋食", dish_type: "main",
      calories: 420, protein: 10, fat: 16, carbs: 58, fiber: 1, salt: 0.8,
      estimated_price_per_serving: 120, cooking_time_minutes: 20,
      ingredients: [
        { name: "ホットケーキミックス", amount: 150, unit: "g", estimated_price: 60 },
        { name: "卵", amount: 1, unit: "個", estimated_price: 30 },
        { name: "牛乳", amount: 120, unit: "ml", estimated_price: 25 },
        { name: "バター", amount: 10, unit: "g", estimated_price: 20 },
        { name: "メープルシロップ", amount: 20, unit: "ml", estimated_price: 30 },
      ],
    },
    lunch: {
      name: "焼きそば",
      category: "和食", dish_type: "main",
      calories: 480, protein: 18, fat: 14, carbs: 66, fiber: 3, salt: 3.0,
      estimated_price_per_serving: 180, cooking_time_minutes: 15,
      ingredients: [
        { name: "中華麺（生）", amount: 150, unit: "g", estimated_price: 60 },
        { name: "豚バラ肉", amount: 80, unit: "g", estimated_price: 100 },
        { name: "キャベツ", amount: 100, unit: "g", estimated_price: 30 },
        { name: "もやし", amount: 100, unit: "g", estimated_price: 20 },
        { name: "焼きそばソース", amount: 30, unit: "ml", estimated_price: 20 },
      ],
    },
    dinner: {
      name: "鶏の唐揚げ",
      category: "和食", dish_type: "main",
      calories: 580, protein: 34, fat: 28, carbs: 38, fiber: 1, salt: 2.0,
      estimated_price_per_serving: 260, cooking_time_minutes: 30,
      ingredients: [
        { name: "鶏もも肉", amount: 200, unit: "g", estimated_price: 180 },
        { name: "醤油", amount: 20, unit: "ml", estimated_price: 8 },
        { name: "酒", amount: 15, unit: "ml", estimated_price: 8 },
        { name: "生姜", amount: 10, unit: "g", estimated_price: 10 },
        { name: "にんにく", amount: 5, unit: "g", estimated_price: 10 },
        { name: "片栗粉", amount: 30, unit: "g", estimated_price: 10 },
        { name: "揚げ油", amount: 200, unit: "ml", estimated_price: 40 },
      ],
    },
  },
  {
    day: "sunday",
    breakfast: {
      name: "フレンチトースト",
      category: "洋食", dish_type: "main",
      calories: 380, protein: 12, fat: 16, carbs: 46, fiber: 1, salt: 0.6,
      estimated_price_per_serving: 100, cooking_time_minutes: 15,
      ingredients: [
        { name: "食パン", amount: 2, unit: "枚", estimated_price: 30 },
        { name: "卵", amount: 1, unit: "個", estimated_price: 30 },
        { name: "牛乳", amount: 80, unit: "ml", estimated_price: 16 },
        { name: "砂糖", amount: 10, unit: "g", estimated_price: 5 },
        { name: "バター", amount: 10, unit: "g", estimated_price: 20 },
      ],
    },
    lunch: {
      name: "麻婆豆腐",
      category: "中華", dish_type: "main",
      calories: 420, protein: 20, fat: 18, carbs: 40, fiber: 2, salt: 2.6,
      estimated_price_per_serving: 200, cooking_time_minutes: 20,
      ingredients: [
        { name: "豆腐", amount: 200, unit: "g", estimated_price: 60 },
        { name: "豚ひき肉", amount: 80, unit: "g", estimated_price: 80 },
        { name: "豆板醤", amount: 10, unit: "g", estimated_price: 10 },
        { name: "甜麺醤", amount: 10, unit: "g", estimated_price: 10 },
        { name: "ねぎ", amount: 30, unit: "g", estimated_price: 20 },
        { name: "ご飯", amount: 180, unit: "g", estimated_price: 36 },
      ],
    },
    dinner: {
      name: "カレーライス",
      category: "洋食", dish_type: "main",
      calories: 620, protein: 22, fat: 16, carbs: 88, fiber: 5, salt: 3.0,
      estimated_price_per_serving: 290, cooking_time_minutes: 40,
      ingredients: [
        { name: "鶏もも肉", amount: 150, unit: "g", estimated_price: 130 },
        { name: "じゃがいも", amount: 150, unit: "g", estimated_price: 45 },
        { name: "にんじん", amount: 80, unit: "g", estimated_price: 30 },
        { name: "玉ねぎ", amount: 150, unit: "g", estimated_price: 45 },
        { name: "カレールー", amount: 40, unit: "g", estimated_price: 50 },
        { name: "ご飯", amount: 200, unit: "g", estimated_price: 40 },
      ],
    },
  },
];

writeToDB(WEEK, mealPlan).catch(console.error);
