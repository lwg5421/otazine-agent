import { NextRequest, NextResponse } from "next/server";

// ANN 도메인만 허용 — 임의 URL을 릴레이하는 오픈 프록시가 되지 않도록 제한
const ALLOWED_PREFIX = "https://www.animenewsnetwork.com/";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
