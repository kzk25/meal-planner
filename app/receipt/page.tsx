"use client";
export const runtime = 'edge';
import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, ScanLine, Plus, Loader2, CheckSquare, Square, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { getWeekStartDate, formatWeekStartDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface OcrItem {
  name: string;
  price: number;
  quantity?: number;
}

interface CheckableItem extends OcrItem {
  checked: boolean;
}

export default function ReceiptPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<CheckableItem[]>([]);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    setImageFile(file);
    setItems([]);
    setOcrError(null);
    setApiKeyMissing(false);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFileSelect(file);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  async function handleOcr() {
    if (!imageFile) return;
    setScanning(true);
    setOcrError(null);
    setApiKeyMissing(false);
    setItems([]);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch("/api/receipt/ocr", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok || json.error) {
        const errMsg: string = json.error ?? "OCRに失敗しました";
        if (errMsg.includes("ANTHROPIC_API_KEY")) {
          setApiKeyMissing(true);
        } else {
          setOcrError(errMsg);
        }
        return;
      }

      const ocrItems: OcrItem[] = json.items ?? [];
      setItems(ocrItems.map((item) => ({ ...item, checked: true })));
      toast.success(`${ocrItems.length}件の商品を読み取りました`);
    } catch {
      setOcrError("通信エラーが発生しました");
    } finally {
      setScanning(false);
    }
  }

  function toggleItem(idx: number) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item))
    );
  }

  function toggleAll(checked: boolean) {
    setItems((prev) => prev.map((item) => ({ ...item, checked })));
  }

  async function handleAddToShoppingList() {
    const selected = items.filter((i) => i.checked);
    if (selected.length === 0) {
      toast.error("追加する商品を選択してください");
      return;
    }
    setAdding(true);
    const weekStart = formatWeekStartDate(getWeekStartDate());
    try {
      const results = await Promise.allSettled(
        selected.map((item) =>
          fetch("/api/shopping-list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              week_start_date: weekStart,
              ingredient_name: item.name,
              total_amount: item.quantity ?? 1,
              unit: item.quantity ? "個" : null,
              category: "その他",
              estimated_price: item.price > 0 ? item.price : null,
              actual_price: item.price > 0 ? item.price : null,
              is_purchased: false,
              add_to_fridge: false,
            }),
          })
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;
      if (failed > 0) {
        toast.error(`${failed}件の追加に失敗しました`);
      } else {
        toast.success(`${succeeded}件を買い物リストに追加しました`);
        setItems([]);
        setImagePreview(null);
        setImageFile(null);
      }
    } catch {
      toast.error("追加に失敗しました");
    } finally {
      setAdding(false);
    }
  }

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-800">レシート読み込み</h1>

      {/* API key notice */}
      {apiKeyMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p>
            設定画面でAnthropic APIキーを設定するとOCR機能が使えます。
          </p>
          <Link href="/settings" className="mt-1 inline-block text-amber-700 font-medium underline">
            設定画面へ
          </Link>
        </div>
      )}

      {/* Drop zone */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : imagePreview
                ? "border-gray-200"
                : "border-gray-200 hover:border-primary hover:bg-gray-50 cursor-pointer"
            }`}
          >
            {imagePreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="レシートプレビュー"
                  className="w-full max-h-64 object-contain rounded-xl"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                    setImageFile(null);
                    setItems([]);
                    setOcrError(null);
                    setApiKeyMissing(false);
                  }}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow text-gray-600 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">ファイルをドラッグ&ドロップ</p>
                <p className="text-xs text-gray-400 mt-1">または</p>
                <span className="mt-2 inline-block text-primary text-sm font-medium">
                  ファイルを選択
                </span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/heic"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />
          {imagePreview && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                別の画像を選択
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleOcr}
                disabled={!imageFile || scanning}
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    読み取り中…
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4 mr-1" />
                    OCR読み取り
                  </>
                )}
              </Button>
            </div>
          )}
          {!imagePreview && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              画像を選択
            </Button>
          )}
        </CardContent>
      </Card>

      {/* OCR error */}
      {ocrError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {ocrError}
        </div>
      )}

      {/* OCR results */}
      {items.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>読み取り結果（{items.length}件）</span>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAll(true)}
                  className="text-xs text-primary hover:underline"
                >
                  全選択
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => toggleAll(false)}
                  className="text-xs text-gray-400 hover:underline"
                >
                  全解除
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleItem(idx)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                >
                  {item.checked ? (
                    <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                  <span className={`flex-1 text-sm ${item.checked ? "text-gray-800" : "text-gray-400"}`}>
                    {item.name}
                    {item.quantity && item.quantity > 1 && (
                      <Badge className="ml-2 text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600">
                        x{item.quantity}
                      </Badge>
                    )}
                  </span>
                  <span className={`text-sm font-medium ${item.checked ? "text-gray-700" : "text-gray-300"}`}>
                    {item.price > 0 ? formatCurrency(item.price) : "-"}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <Button
                className="w-full"
                onClick={handleAddToShoppingList}
                disabled={checkedCount === 0 || adding}
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    追加中…
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    買い物リストに追加（{checkedCount}件）
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secondary method */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-gray-600">Claude Code経由でレシートを読み取る場合:</p>
          <code className="block bg-gray-800 text-green-400 rounded p-3 text-xs font-mono whitespace-pre-wrap break-all">
            npx ts-node scripts/ocr-receipt.ts --image ./receipts/receipt.jpg
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
