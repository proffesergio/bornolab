import { NextRequest, NextResponse } from "next/server";
import { readMediaIndex, readMediaFile } from "@/lib/media-repository";
import { requireAdmin } from "@/app/api/admin/me/route";
export const runtime = "nodejs";
export async function GET(req: NextRequest, {params}:{params:Promise<{id:string}>}) {
  const {id} = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new NextResponse(null,{status:404});
  try {
    const asset = (await readMediaIndex()).assets.find(a => a.id === id);
    if (!asset) return new NextResponse(null,{status:404});
    if (!asset.published && await requireAdmin(req) instanceof NextResponse) return new NextResponse(null,{status:404});
    const content = await readMediaFile(id); if (!content) return new NextResponse(null,{status:404});
    return new NextResponse(Buffer.from(content,"base64"), {headers:{"Content-Type":asset.mime,"Content-Length":String(asset.bytes),"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox"}});
  } catch { return new NextResponse(null,{status:503}); }
}
