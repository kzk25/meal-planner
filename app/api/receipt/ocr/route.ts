import { NextRequest } from "next/server";

interface OcrItem {
  name: string;
  price: number;
  quantity?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnthropicClient = any;

async function loadAnthropic(): Promise<AnthropicClient | null> {
  try {
    // Dynamic import so that missing package doesn't break compilation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@anthropic-ai/sdk");
    const Anthropic = mod.default ?? mod;
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY が設定されていません" },
      { status: 400 }
    );
  }

  const client = await loadAnthropic();
  if (!client) {
    return Response.json(
      {
        error:
          "@anthropic-ai/sdk がインストールされていません。npm install @anthropic-ai/sdk を実行してください。",
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return Response.json({ error: "画像ファイルが見つかりません" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mediaType = file.type || "image/jpeg";

  try {
    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: "このレシート画像から購入品目と金額を読み取ってJSON形式で返してください。形式: [{name: string, price: number, quantity?: number}]",
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return Response.json({ error: "レスポンスの解析に失敗しました" }, { status: 500 });
    }

    const text: string = content.text;
    // Extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return Response.json({ items: [], raw: text });
    }

    const items: OcrItem[] = JSON.parse(jsonMatch[0]);
    return Response.json({ items });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "OCR処理中にエラーが発生しました";
    return Response.json({ error: errMsg }, { status: 500 });
  }
}
