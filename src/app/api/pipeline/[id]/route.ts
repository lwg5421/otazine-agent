import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureSchema } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureSchema();
    const body = await req.json();
    const row = await prisma.pipelineItem.update({
      where: { id: params.id },
      data: {
        status:      body.status,
        draft:       body.draft,
        editedDraft: body.editedDraft,
        approved:    body.approved,
        score:       body.score,
        summary:     body.summary,
        confirmRaw:  body.confirmRaw,
        finishedAt:  body.finishedAt,
      },
    });
    return NextResponse.json({ data: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureSchema();
    await prisma.pipelineItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
