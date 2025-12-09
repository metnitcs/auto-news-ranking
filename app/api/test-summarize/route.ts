import { NextRequest, NextResponse } from "next/server";
import { getPrompt } from "@/lib/promptEngine";
import { callLLM } from "@/lib/llm";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { raw } = await req.json();

    if (!raw || typeof raw !== "string") {
      return NextResponse.json(
        { error: "ต้องส่งฟิลด์ 'raw' เป็น string ของเนื้อหาข่าวดิบ" },
        { status: 400 }
      );
    }

    // Prepare prompt with default tone
    const promptConfig = getPrompt("summarizer", {
      raw_content: raw,
      tone_description: "ภาษากลาง สุภาพ อธิบายเข้าใจง่าย ไม่ใส่อารมณ์"
    });

    // Call LLM
    const responseText = await callLLM({
      ...promptConfig,
      jsonMode: true
    });

    // Parse JSON safely
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleanJson);

    return NextResponse.json(json);

  } catch (err: any) {
    console.error("test-summarize error", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเรียก AI", detail: String(err) },
      { status: 500 }
      // Note: In Next.js, 500 status might show a generic error page if not handled well in frontend, 
      // but for API it returns JSON.
    );
  }
}
