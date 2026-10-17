import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "../me/route";
import { writeGuard } from "@/lib/printing/http";
import { readPrinting } from "@/lib/printing/repository";
import { readMediaIndex, writeMedia } from "@/lib/media-repository";
import { MEDIA_MAX_BYTES, mediaMetadata, mediaUsage, type MediaAsset } from "@/lib/media";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const actor = await requireAdmin(req); if (actor instanceof NextResponse) return actor;
  try {
    const [index, printing] = await Promise.all([readMediaIndex(), readPrinting()]);
    return NextResponse.json({ assets: index.assets, categories:printing.categories.map(c=>({id:c.id,title:c.name.en})), services:printing.services.map(s=>({id:s.id,title:s.name.en})), audit: index.audit.slice(-30).reverse(), usage: Object.fromEntries(index.assets.map(a => [a.id, mediaUsage(a, printing.categories, printing.services,printing.orders)])), storage: "Durable PostgreSQL", maxBytes: MEDIA_MAX_BYTES }, {headers:{"Cache-Control":"private, no-store"}});
  } catch { return NextResponse.json({error:"Media storage is unavailable. Please retry."},{status:503}); }
}
export async function POST(req: NextRequest) {
  const actor = await requireAdmin(req); if (actor instanceof NextResponse) return actor;
  const blocked = writeGuard(req, actor); if (blocked) return blocked;
  if (Number(req.headers.get("content-length")) > MEDIA_MAX_BYTES + 65536) return NextResponse.json({error:"Choose an image up to 2 MB."},{status:413});
  try {
    const form = await req.formData(), file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > MEDIA_MAX_BYTES || !["image/png","image/jpeg","image/webp"].includes(file.type)) throw new Error("Choose a PNG, JPEG or WebP image up to 2 MB.");
    const source = Buffer.from(await file.arrayBuffer());
    // Decode and re-encode: reject invalid images, cap dimensions and strip embedded metadata.
    const image = sharp(source, {limitInputPixels:16_000_000, animated:false});
    const meta = await image.metadata();
    if (!["png","jpeg","webp"].includes(meta.format ?? "") || (meta.pages ?? 1) > 1) throw new Error("Choose a still PNG, JPEG or WebP image.");
    const {data,info} = await image.rotate().resize({width:2000,height:2000,fit:"inside",withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true});
    if (data.length > MEDIA_MAX_BYTES) throw new Error("Image is too large. Export a smaller mockup.");
    const metadata = mediaMetadata(JSON.parse(String(form.get("metadata") ?? "{}")));
    const id = crypto.randomUUID(), now = Date.now();
    const asset: MediaAsset = { ...metadata, id, url:`/api/media/${id}`, mime:"image/webp", bytes:data.length, width:info.width, height:info.height, createdAt:now, updatedAt:now };
    await writeMedia(asset, actor, data.toString("base64"));
    return NextResponse.json({asset},{status:201,headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    const message = error instanceof Error && !('code' in error) && !/password|postgres|connect|ECONN|ENOTFOUND/i.test(error.message) ? error.message : "Upload could not be saved. Check storage and retry.";
    return NextResponse.json({error:message},{status:400});
  }
}
export async function PATCH(req: NextRequest) {
  const actor = await requireAdmin(req); if (actor instanceof NextResponse) return actor;
  const blocked = writeGuard(req, actor); if (blocked) return blocked;
  try {
    const body = await req.json(), metadata = mediaMetadata(body), index = await readMediaIndex();
    const previous = index.assets.find(a => a.id === body.id);
    if (!previous) return NextResponse.json({error:"Media not found."},{status:404});
    if(body.expectedUpdatedAt!==undefined&&body.expectedUpdatedAt!==previous.updatedAt)throw new Error("Media changed. Reload before saving.");
    if (!metadata.published && previous.published) {
      const printing = await readPrinting();
      if (mediaUsage(previous, printing.categories, printing.services,printing.orders).length) throw new Error("This image is in use. Replace its category/service references before unpublishing.");
    }
    const asset = {...previous,...metadata,updatedAt:Math.max(Date.now(),previous.updatedAt+1)}; await writeMedia(asset, actor,undefined,previous.updatedAt);
    return NextResponse.json({asset});
  } catch { return NextResponse.json({error:"Could not update media. Referenced images must stay published; check storage and fields."},{status:400}); }
}
