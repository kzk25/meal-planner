"use client";
export const runtime = 'edge';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/lib/types";
import { Settings, User, DollarSign, Bot, Bell, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const ACTIVITY_LABELS: Record<string, string> = {
  low: "低い（デスクワーク中心）",
  medium: "普通（軽い運動あり）",
  high: "高い（運動習慣あり）",
};
const GOAL_LABELS: Record<string, string> = {
  maintain: "現状維持",
  lose: "体重を減らす",
  gain: "体重を増やす（筋肉）",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      setProfile(data);
      setForm(data ?? {});
      setLoading(false);
    });
  }, []);

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      toast.success("設定を保存しました");
    } else {
      toast.error("保存に失敗しました");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          設定
        </h1>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          保存
        </Button>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            プロフィール
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">年齢</label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.age ?? ""}
                onChange={(e) => set("age", Number(e.target.value))}
                placeholder="25"
                className="h-11"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">性別</label>
              <select
                className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.gender ?? ""}
                onChange={(e) => set("gender", e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">身長 (cm)</label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.height_cm ?? ""}
                onChange={(e) => set("height_cm", Number(e.target.value))}
                placeholder="170"
                className="h-11"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">体重 (kg)</label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.weight_kg ?? ""}
                onChange={(e) => set("weight_kg", Number(e.target.value))}
                placeholder="65"
                className="h-11"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">活動レベル</label>
            <select
              className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={form.activity_level ?? "medium"}
              onChange={(e) => set("activity_level", e.target.value)}
            >
              {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">目標</label>
            <select
              className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={form.goal ?? "maintain"}
              onChange={(e) => set("goal", e.target.value)}
            >
              {Object.entries(GOAL_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Meal settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            食費・献立設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">1食あたりの目標金額（円）</label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.meal_budget_per_meal ?? ""}
                onChange={(e) => set("meal_budget_per_meal", Number(e.target.value))}
                placeholder="500"
                className="h-11"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">1日あたりの目標金額（円）</label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.meal_budget_per_day ?? ""}
                onChange={(e) => set("meal_budget_per_day", Number(e.target.value))}
                placeholder="1500"
                className="h-11"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">デフォルト人数</label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={8}
              value={form.default_servings ?? 1}
              onChange={(e) => set("default_servings", Number(e.target.value))}
              className="h-11"
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-700">副菜を含める</span>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${form.include_side_dish ? "bg-primary" : "bg-gray-200"}`}
              onClick={() => set("include_side_dish", !form.include_side_dish)}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.include_side_dish ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-700">汁物を含める</span>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${form.include_soup ? "bg-primary" : "bg-gray-200"}`}
              onClick={() => set("include_soup", !form.include_soup)}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.include_soup ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* AI settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            AI設定（任意）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-500">APIキーを設定しなくても、Claude Code経由でAI機能を使用できます。</p>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Claude APIキー（任意）</label>
            <Input
              type="password"
              value={form.claude_api_key ?? ""}
              onChange={(e) => set("claude_api_key", e.target.value)}
              placeholder="sk-ant-..."
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notion settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="text-base">📝</span>
            Notion連携（任意）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notion APIキー</label>
            <Input
              type="password"
              value={form.notion_api_key ?? ""}
              onChange={(e) => set("notion_api_key", e.target.value)}
              placeholder="secret_..."
              className="h-11"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">データベースID</label>
            <Input
              value={form.notion_database_id ?? ""}
              onChange={(e) => set("notion_database_id", e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rice reminder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            お米リマインド
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">購入量 (kg)</label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.rice_purchase_kg ?? ""}
                onChange={(e) => set("rice_purchase_kg", Number(e.target.value))}
                placeholder="5"
                className="h-11"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">前回購入日</label>
              <Input
                type="date"
                value={form.rice_last_purchased_at ?? ""}
                onChange={(e) => set("rice_last_purchased_at", e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">残り何日前に通知するか</label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.rice_notify_days_before ?? 3}
              onChange={(e) => set("rice_notify_days_before", Number(e.target.value))}
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      <div className="pb-4">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          設定を保存する
        </Button>
      </div>
    </div>
  );
}
