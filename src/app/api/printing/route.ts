import { NextResponse } from "next/server";
import { readPrinting } from "@/lib/printing/repository";
export async function GET() {
  try {
    const { config, categories, services } = await readPrinting();
    if (!config.enabled) return NextResponse.json({ error: "Printing Services is currently unavailable." }, { status: 503 });
    const visible = categories.filter(c => !c.hidden && !c.archived).sort((a, b) => a.position - b.position);
    return NextResponse.json({ config, categories: visible, services: services.filter(s => s.published && visible.some(c => c.id === s.categoryId)) });
  } catch { return NextResponse.json({ error: "Printing storage is unavailable. Please contact support." }, { status: 503 }); }
}
