import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { originalTitle, originalExcerpt, draft } = await req.json();

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: `당신은 OTAZIN 애니메이션 매거진의 편집장입니다.
작성된 기사를 엄격하게 검토하고 승인 또는 반려 결정을 내립니다.

검토 기준:
1. 사실 정확성 — 원문과 일치하는가
2. 한국어 품질 — 문장이 자연스러운가
3. 분량 — 400~600자 범위인가
4. 제목 매력도 — 클릭하고 싶은 제목인가
5. 톤 — 매거진 스타일에 맞는가

반드시 아래 형식으로만 응답하세요:
DECISION: APPROVED 또는 REJECTED
SCORE: 숫자/100
FEEDBACK:
- 사실 정확성: 평가 내용
- 한국어 품질: 평가 내용
- 분량: 평가 내용
- 제목 매력도: 평가 내용
- 톤: 평가 내용
SUMMARY: 한 문장 총평`,
      messages: [{
        role: "user",
        content: `원문 제목: ${originalTitle}
원문 내용: ${originalExcerpt ?? "없음"}

작성된 기사:
${draft}

위 기사를 검토하고 승인 여부를 결정해주세요.`,
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const approved = text.includes("DECISION: APPROVED");

    // 파싱
    const scoreMatch = text.match(/SCORE:\s*(\d+)/);
    const summaryMatch = text.match(/SUMMARY:\s*(.+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const summary = summaryMatch ? summaryMatch[1].trim() : "";

    return NextResponse.json({ approved, score, summary, raw: text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
