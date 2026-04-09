"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { FridgeItem } from "@/lib/types";
import { Refrigerator, Plus, Loader2, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

const QUICK_ITEMS = ["卵", "豆腐", "牛乳", "玉ねぎ", "にんじん", "キャベツ", "豚肉", "鶏もも肉"];
const CATEGORIES = ["野菜", "肉・魚", "乳製品・卵", "その他"];

function getExpiryBadge(expiryDate: string | null): { label: string; className: string } | null {
  if (!expiryDate) return null;
  const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "期限切れ", className: "bg-red-100 text-red-700" };
  if (days === 0) return { label: "今日まで", className: "bg-red-100 text-red-700" };
  if (days <= 2) return { label: `あと${days}日`, className: "bg-yellow-100 text-yellow-700" };
  return { label: `あと${days}日`, className: "bg-green-100 text-green-700" };
}

export default function FridgePage() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newCategory, setNewCategory] = useState("その他");
  const [adding, setAdding] = useState(false);

  const fetchItems = () => {
    fetch("/api/fridge").then((r) => r.json()).then((d) => {
      setItems(d ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchItems(); }, []);

  async function handleAdd(name?: string) {
    const itemName = name ?? newName.trim();
    if (!itemName) return;
    setAdding(true);
    await fetch("/api/fridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: itemName,
        amount: newAmount ? Number(newAmount) : null,
        unit: newUnit || null,
        expiry_date: newExpiry || null,
        category: newCategory,
      }),
    });
    setNewName(""); setNewAmount(""); setNewUnit(""); setNewExpiry("");
    toast.success(`${itemName}を追加しました`);
    fetchItems();
    setAdding(false);
  }

  async function handleFinish(item: FridgeItem) {
    await fetch(`/api/fridge/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_finished: true }),
    });
    toast.success("使い切りました");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function handleDelete(item: FridgeItem) {
    await fetch(`/api/fridge/${item.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  const grouped = CATEGORIES.map((cat) => ({
    cat,
    items: items.filter((i) => i.category === cat || (!CATEGORIES.slice(0, -1).includes(i.category) && cat === "その他")),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Refrigerator className="w-5 h-5 text-primary" />
        冷蔵庫の中身
      </h1>

      {/* Quick add */}
      <Card>
        <CardHeader><CardTitle className="text-sm">定番食材をクイック追加</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {QUICK_ITEMS.map((name) => (
              <button
                key={name}
                onClick={() => handleAdd(name)}
                className="text-sm px-3 py-1.5 rounded-full border border-gray-200 hover:border-primary hover:text-primary transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual add */}
      <Card>
        <CardHeader><CardTitle className="text-sm">食材を追加</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="食材名" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} className="flex-1" />
            <Input placeholder="量" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-20" type="number" inputMode="numeric" />
            <Input placeholder="単位" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-16" />
          </div>
          <div className="flex gap-2">
            <Input type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} className="flex-1" />
            <select className="h-12 rounded-lg border border-gray-200 px-2 text-sm bg-white" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button onClick={() => handleAdd()} disabled={!newName.trim() || adding}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">登録されている食材がありません</div>
      ) : (
        grouped.map(({ cat, items: catItems }) => (
          <Card key={cat}>
            <CardHeader className="py-2 px-4"><CardTitle className="text-sm">{cat}</CardTitle></CardHeader>
            <CardContent className="px-2 pb-2">
              {catItems.map((item) => {
                const expiry = getExpiryBadge(item.expiry_date);
                return (
                  <div key={item.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-800">{item.name}</span>
                      {item.amount && <span className="text-xs text-gray-400 ml-1">{item.amount}{item.unit}</span>}
                      {expiry && <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${expiry.className}`}>{expiry.label}</span>}
                    </div>
                    <button onClick={() => handleFinish(item)} className="p-1.5 rounded-full hover:bg-green-50 text-gray-400 hover:text-green-600" title="使い切り">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500" title="削除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
