import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/guards";
import { requireAdmin } from "@/app/api/admin/me/route";
import { mutatePrinting, readPrinting } from "@/lib/printing/repository";
import { validateArtwork } from "@/lib/printing/domain";
import { failure, writeGuard } from "@/lib/printing/http";
import {signFile,verifyFile} from "@/lib/printing/file-links";
import {demoScanner} from "@/lib/printing/scanning";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const user = await requireMember();
  const adminUpload = req.headers.get("x-printing-admin") === "true";
  const admin = adminUpload || !user ? await requireAdmin(req) : null;
  if ((adminUpload || !user) && admin instanceof NextResponse) return admin;
  const owner = adminUpload || !user ? String(admin) : user.id; const blocked = writeGuard(req, owner); if (blocked) return blocked;
  try {
    if (Number(req.headers.get("content-length") ?? 0) > 11 * 1024 * 1024) throw new Error("Upload exceeds 10 MB.");
    const form = await req.formData(); const file = form.get("file");
    if (!(file instanceof File) || file.size > 10 * 1024 * 1024) throw new Error("Select an artwork file up to 10 MB.");
    const serviceId = String(form.get("serviceId") ?? ""); const rights = form.get("rights") === "true";
    if (!rights) throw new Error("Confirm you own or have permission to use this artwork.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const scan=await demoScanner.scan({bytes,mime:file.type,name:file.name});if(scan.state==="rejected")throw new Error("Artwork did not pass the file safety check.");
    const scanState=scan.state;
    const upload = await mutatePrinting(data => {
      if (!data.config.enabled || !data.config.demo) throw new Error("Private upload is available in configured demo mode only.");
      const existingOrder=data.orders.find(o=>o.id===form.get("orderId")&&(!user||adminUpload||o.userId===user.id));
      if(existingOrder&&user&&!adminUpload&&!["draft","submitted","artwork_review","changes_requested"].includes(existingOrder.state))throw new Error("Request artwork changes before uploading a revision.");
      const service = existingOrder?.service??data.services.find(s => s.id === serviceId && (s.published || !user || adminUpload)); if (!service) throw new Error("Service not found.");
      validateArtwork(file.name, file.type, bytes, service);
      if (data.uploads.filter(u => u.owner === owner).length >= 20) throw new Error("Upload limit reached. Contact support to remove old artwork.");
      const record = { id: crypto.randomUUID(), owner, name: file.name.replace(/[^a-zA-Z0-9.\u0980-\u09ff_-]/g, "_").slice(0, 100), mime: file.type, bytes: file.size, content: Buffer.from(bytes).toString("base64"), createdAt: Date.now(), status: "needs_review" as const, rights, aiUse: form.get("aiUse") === "true", license: "Customer-authorized printing only", moderation: "pending" as const, takedown: false };
      data.uploads.push({...record,scanState}); data.audit.push({ actor: owner, action: "artwork.uploaded", at: Date.now(), recordId: record.id });
      return { id: record.id, name: record.name, bytes: record.bytes, status: record.status };
    });
    return NextResponse.json({ upload });
  } catch (error) { return failure(error); }
}
export async function GET(req: NextRequest) {
  const user = await requireMember(); const admin = await requireAdmin(req);
  if (!user && admin instanceof NextResponse) return admin;
  try {
    const data = await readPrinting(); const id = req.nextUrl.searchParams.get("id"); const file = data.uploads.find(u => u.id === id);
    const allowedProof = data.orders.some(o => o.userId === user?.id && (o.finalFile===id || o.proofs.some(p => p.uploadId === id) || o.designVersions?.some(v=>v.uploadId===id)));
    if (!file || (admin instanceof NextResponse && (file.takedown || (file.owner !== user?.id && !allowedProof)))) return NextResponse.json({ error: "File not found." }, { status: 404 });
    const actor=admin instanceof NextResponse?user!.id:admin;
    if(req.nextUrl.searchParams.get("link")==="1"){
      const expires=Date.now()+5*60000;const signature=signFile(file.id,actor,expires);
      return NextResponse.json({url:`/api/printing/uploads?id=${encodeURIComponent(file.id)}&expires=${expires}&signature=${signature}`},{headers:{"Cache-Control":"private, no-store"}});
    }
    if(!verifyFile(file.id,actor,Number(req.nextUrl.searchParams.get("expires")),req.nextUrl.searchParams.get("signature")??""))return NextResponse.json({error:"This private file link has expired. Request a new link."},{status:403});
    return new NextResponse(Buffer.from(file.content, "base64"), { headers: { "Content-Type": file.mime, "Content-Disposition": `attachment; filename="artwork.${file.mime === "application/pdf" ? "pdf" : file.mime === "image/png" ? "png" : "jpg"}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox" } });
  } catch (error) { return failure(error); }
}
