import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/guards";
import { mutatePrinting, readPrinting } from "@/lib/printing/repository";
import { failure, number, text, writeGuard } from "@/lib/printing/http";
import {notifyPrintingAdmin} from "@/lib/printing/side-effects";
export async function GET() {
  const user = await requireMember(); if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
  try { return NextResponse.json({ quotes: (await readPrinting()).quotes.filter(q => q.userId === user.id).sort((a,b)=>b.createdAt-a.createdAt) },{headers:{"Cache-Control":"private, no-store"}}); } catch (error) { return failure(error); }
}
export async function POST(req: NextRequest) {
  const user = await requireMember(); if (!user) return NextResponse.json({ error: "Log in to request a quote." }, { status: 401 });
  const blocked = writeGuard(req, user.id); if (blocked) return blocked;
  try {
    const body = await req.json() as Record<string, unknown>;
    const quote = await mutatePrinting(data => {
      if (!data.config.enabled || !data.config.quotes || !data.config.demo) throw new Error("Quote requests are unavailable.");
      const categoryId = text(body.categoryId, 100); if (!data.categories.some(c => c.id === categoryId && !c.hidden && !c.archived)) throw new Error("Choose a category.");
      const quantity = number(body.quantity, 100000); if (!quantity) throw new Error("Enter quantity.");
      const uploadId=text(body.uploadId??"",100);if(uploadId&&!data.uploads.some(u=>u.id===uploadId&&u.owner===user.id))throw new Error("Artwork does not belong to this account.");
      const fields = Object.fromEntries(["dimensions", "material", "finishing", "location", "requiredDate", "budget", "notes"].map(k => [k, text(body[k] ?? "", 1000)]));
      const quote = { id: `PQ-${crypto.randomUUID()}`, userId: user.id, categoryId, quantity, dimensions: fields.dimensions, material: fields.material, finishing: fields.finishing, location: fields.location, requiredDate: fields.requiredDate, budget: fields.budget, notes: fields.notes, state: "requested" as const, lines: [], createdAt: Date.now() };
      const record={...quote,contactName:text(body.contactName??user.name??"",200),phone:text(body.phone??"",30),uploadId};
      data.quotes.push(record); data.audit.push({ actor: user.id, action: "quote.requested", at: Date.now(), recordId: quote.id }); return record;
    });
    await notifyPrintingAdmin({ type: "system", title: "Demo printing quote requested", detail: quote.id, userId: user.id });
    return NextResponse.json({ quote });
  } catch (error) { return failure(error); }
}
export async function PATCH(req: NextRequest) {
  const user = await requireMember(); if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const blocked = writeGuard(req, user.id); if (blocked) return blocked;
  try {
    const body = await req.json() as Record<string, unknown>;
    const quote = await mutatePrinting(data => {
      const quote = data.quotes.find(q => q.id === body.id && q.userId === user.id);
      if(body.message!==undefined){
        if(!data.config.enabled||!data.config.quotes||!quote||quote.orderId||["cancelled","declined","expired"].includes(quote.state))throw new Error("This quote conversation is closed. Use order support for converted quotes.");
        const message=text(body.message,1000);if(!message)throw new Error("Enter your reply.");quote.messages??=[];quote.messages.push({actor:user.id,at:Date.now(),message});data.audit.push({actor:user.id,action:"quote.reply",at:Date.now(),recordId:quote.id});return quote;
      }
      if (!data.config.enabled || !data.config.quotes || !quote || quote.state !== "offered" || !quote.expiresAt || quote.expiresAt <= Date.now()) throw new Error("This quote is unavailable or has expired.");
      if (!["accepted", "declined"].includes(String(body.state))) throw new Error("Choose accept or decline.");
      if((quote.version??0)!==number(body.version??0,10000))throw new Error("This quote has been revised. Refresh and review the new offer before responding.");
      const previous=quote.state;quote.state = body.state as "accepted" | "declined";quote.history??=[];quote.history.push({from:previous,to:quote.state,actor:user.id,at:Date.now(),reason:`Customer ${quote.state} offer version ${quote.version??0}`});
      data.audit.push({ actor: user.id, action: `quote.${quote.state}`, at: Date.now(), recordId: quote.id }); return quote;
    });await notifyPrintingAdmin({type:"system",title:body.message?"Customer replied to a printing quote":`Printing quote ${quote.state}`,detail:quote.id,userId:user.id});return NextResponse.json({ quote });
  } catch (error) { return failure(error); }
}
