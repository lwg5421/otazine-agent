import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { title, excerpt, categories, date, url } = await req.json();

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: `당신은 OTAZIN 애니메이션 매거진의 전문 기자입니다.
원문 영어 기사를 바탕으로 한국 독자를 위한 고품질 한국어 기사를 작성합니다.

작성 규칙:
- 제목: 흥미롭고 클릭하고 싶은 한국어 제목 (원문 번역 X, 재창조)
- 분량: 400~600자
- 구조: 제목 → 리드문(2줄) → 본문(3~4단락) → 마무리(1줄)
- 톤: 전문적이지만 친근한 애니 매거진 스타일
- 원문 사실에만 충실하되 한국 독자 감각에 맞게 재구성
- 마크다운 없이 일반 텍스트로 작성
- 출력 형식:
  [제목]
  제목 내용
  
  [본문]
  본문 내용`,
      messages: [{
        role: "user",
        content: `다음 원문 뉴스를 한국어 기사로 재작성해주세요.

원문 제목: ${title}
카테고리: ${categories ?? "일반"}
날짜: ${date}
원문 내용: ${excerpt ?? "내용 없음"}
원문 URL: ${url}`,
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    return NextResponse.json({ draft: text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
