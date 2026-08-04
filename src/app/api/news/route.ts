import { NextRequest, NextResponse } from "next/server";
import { fetchAnimeNews } from "@/lib/news";

export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  try {
    const data = await fetchAnimeNews(page);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
