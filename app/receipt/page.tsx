export default function ReceiptPage() {
  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">レシート読み込み</h1>
      <div className="bg-white rounded-xl p-6 space-y-4">
        <p className="text-sm text-gray-600">Claude Code経由でレシートを読み取る場合:</p>
        <code className="block bg-gray-800 text-green-400 rounded p-3 text-xs font-mono">
          npx ts-node scripts/ocr-receipt.ts --image ./receipts/receipt.jpg
        </code>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
          <p className="text-sm">ファイルをドラッグ&ドロップ</p>
          <p className="text-xs mt-1">または</p>
          <label className="mt-2 inline-block cursor-pointer text-primary text-sm font-medium">
            ファイルを選択
            <input type="file" accept="image/*,image/heic" capture="environment" className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
