import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureSchema } from "@/lib/db";

export async function GET() {
  try {
    await ensureSchema();
    const rows = await prisma.pipelineItem.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ data: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();
    const row = await prisma.pipelineItem.create({
      data: {
        id:        body.id,
        news:      body.news,
        status:    body.status,
        startedAt: body.startedAt,
      },
    });
    return NextResponse.json({ data: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
