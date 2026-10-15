import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/guards";
import { mutatePrinting, readPrinting } from "@/lib/printing/repository";
import { approveProof, price, quoteService, refundAvailable,isBangladeshPhone,normalizePhone,leadDays,transition, type Address, type PrintOrder } from "@/lib/printing/domain";
import { failure, number, text, writeGuard,PrintingPriceConflict } from "@/lib/printing/http";
import { mockPayment } from "@/lib/printing/providers";
import {notifyPrintingAdmin} from "@/lib/printing/side-effects";

function customerOrder(order: PrintOrder) {
  const visible = structuredClone(order);
  delete visible.internalNotes; delete visible.partnerId; delete visible.designerId; delete visible.adjustments;
  delete visible.qualityChecks;
  delete visible.productionJobs;
  visible.history.forEach(event=>{delete event.internalNote;});
  visible.refundTotal=order.financial.total-refundAvailable(order);
  return visible;
}
export async function GET() {
  const user = await requireMember(); if (!user) return NextResponse.json({ error: "Please log in to view your print orders." }, { status: 401 });
  try { const data = await readPrinting(); return NextResponse.json({ orders: data.orders.filter(o => o.userId === user.id).sort((a,b)=>b.createdAt-a.createdAt).map(customerOrder), notifications: data.notifications.filter(n => n.recipient === user.id),templates:data.templates.filter(t=>t.userId===user.id) },{headers:{"Cache-Control":"private, no-store"}}); } catch (error) { return failure(error); }
}
export async function POST(req: NextRequest) {
  const user = await requireMember(); if (!user) return NextResponse.json({ error: "Please log in before saving an order." }, { status: 401 });
  const blocked = writeGuard(req, user.id); if (blocked) return blocked;
  try {
    const body = await req.json() as Record<string, unknown>;
    const id = text(body.id ?? "", 100); const serviceId = text(body.serviceId, 100); const quantity = number(body.quantity, 100000); const quoteId = text(body.quoteId ?? "", 100);
    const selections: Record<string, string> = {};
    if (!body.selections || typeof body.selections !== "object" || Array.isArray(body.selections)) throw new Error("Choose service options.");
    for (const [key, value] of Object.entries(body.selections)) selections[text(key, 100)] = text(value, 100);
    const addressInput = body.address as Record<string, unknown> | undefined;
    const address = Object.fromEntries(["name", "phone", "division", "district", "thana", "area", "details", "instruction"].map(key => [key, text(addressInput?.[key] ?? "", 500)])) as Address;
    address.phone=normalizePhone(address.phone);
    const designHelp = text(body.designHelp ?? "", 100); const uploadId = text(body.uploadId ?? "", 100); const notes = text(body.notes ?? "");
    if(body.method!==undefined&&body.method!=="cod"&&body.method!=="mock")throw new Error("Choose an available payment method.");
    const method = body.method === "cod" ? "cod" : "mock"; const submit = body.submit === true;
    const order = await mutatePrinting(data => {
      if (!data.config.enabled || !data.config.demo) throw new Error("Only configured demo ordering is available.");
      const quote = quoteId ? data.quotes.find(q => q.id === quoteId && q.userId === user.id && q.state === "accepted" && !q.orderId) : undefined;
      if (quoteId && (!quote || !quote.expiresAt || quote.expiresAt <= Date.now() || quote.quantity !== quantity)) throw new Error("The accepted quote is expired, already ordered or has a different quantity.");
      const template = quote ? data.services.find(s => s.categoryId === quote.categoryId) : undefined;
      const service = quote && template ? quoteService(quote, template) : data.services.find(s => s.id === serviceId && s.published && data.categories.some(c => c.id === s.categoryId && !c.hidden && !c.archived));
      if (!service || service.pricing === "quote") throw new Error("Please request a quote for this service.");
      if (method === "mock" && !data.config.onlinePayment) throw new Error("Demo online payment is disabled.");
      const financial = quote ? { base: quote.lines.reduce((sum,l)=>sum+l.amount,0), options:0,design:0,delivery:0,cod:0,discount:0,tax:0,total:quote.lines.reduce((sum,l)=>sum+l.amount,0),currency:"BDT" as const } : price(service, quantity, selections, data.config, designHelp, method);
      if (quote && method !== "mock") throw new Error("Quoted demo orders currently use demo online payment.");
      number(financial.total);
      if(submit&&number(body.expectedTotal)!==financial.total)throw new PrintingPriceConflict("The price has changed. Review the updated summary before submitting again.");
      if (uploadId && !data.uploads.some(u => u.id === uploadId && u.owner === user.id)) throw new Error("Artwork does not belong to this account.");
      if (submit) {
        if (!designHelp && !uploadId) throw new Error("Upload artwork or choose design help.");
        if (!address.name || !isBangladeshPhone(address.phone) || !address.division || !address.district || !address.thana || !address.area || !address.details) throw new Error("Enter a valid Bangladesh phone number and complete delivery details.");
        if (!data.config.nationwide && address.district.toLowerCase() !== "dhaka") throw new Error("Delivery currently serves Dhaka only.");
      }
      const existing = id ? data.orders.find(o => o.id === id && o.userId === user.id) : undefined;
      if (id && (!existing || existing.state !== "draft")) throw new Error("This draft cannot be edited.");
      const now = Date.now();
      const record: PrintOrder = { id: existing?.id ?? `PR-${crypto.randomUUID()}`, userId: user.id, service: structuredClone(service), quantity, selections, designHelp, notes, uploadId, address, state: "draft", payment: method === "cod" ? "cod_confirmation" : "pending", method, financial, createdAt: existing?.createdAt ?? now, updatedAt: now, history: existing?.history ?? [], proofs: [], demo: true };
      if (submit) transition(record, "submitted", user.id, "Customer submitted demo order");
      if(method==="cod")record.paymentHistory=[{from:"pending",to:"cod_confirmation",actor:user.id,at:now,reason:"Customer selected COD; eligibility and collection remain pending"}];
      if (quote) { record.quoteId=quote.id; if(submit)quote.orderId=record.id; }
      if(designHelp)record.designService=structuredClone(data.config.designServices.find(d=>d.id===designHelp));
      record.productionDays=leadDays(service,selections,data.config,designHelp);record.deliveryDays=quote?.deliveryDays?structuredClone(quote.deliveryDays):{minimum:data.config.deliveryMinDays,maximum:data.config.deliveryMaxDays};
      if (existing) data.orders[data.orders.indexOf(existing)] = record; else data.orders.push(record);
      data.audit.push({ actor: user.id, action: submit ? "order.submitted" : "draft.saved", at: now, recordId: record.id });
      if (submit) data.notifications.push({ id: crypto.randomUUID(), recipient: user.id, channel: "in_app", template: method === "cod" ? "cod.confirmation_required" : "order.received", status: "delivered", retries: 0, providerReference: "", failureReason: "", at: now, orderId: record.id });
      return customerOrder(record);
    });
    if (submit) await notifyPrintingAdmin({ type: "order.placed", title: "Demo print order submitted", detail: order.id, userId: user.id });
    return NextResponse.json({ order });
  } catch (error) { return failure(error); }
}
export async function PATCH(req: NextRequest) {
  const user = await requireMember(); if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const blocked = writeGuard(req, user.id); if (blocked) return blocked;
  try {
    const body = await req.json() as Record<string, unknown>; const id = text(body.id, 100); const action = text(body.action, 100);
    if(action==="template"){
      const template=await mutatePrinting(data=>{const order=data.orders.find(o=>o.id===id&&o.userId===user.id);if(!order||order.quoteId||!data.config.enabled)throw new Error("Save templates from a standard service order. Custom quotes need a new quote request.");if(data.templates.filter(t=>t.userId===user.id).length>=50)throw new Error("Template limit reached.");const record={id:crypto.randomUUID(),userId:user.id,name:text(body.name??`${order.service.name.en} · ${order.quantity} units`,200),serviceId:order.service.id,quantity:order.quantity,selections:structuredClone(order.selections),designHelp:order.designHelp,notes:order.notes,createdAt:Date.now()};data.templates.push(record);data.audit.push({actor:user.id,action:"template.saved",at:Date.now(),recordId:record.id});return record;});
      return NextResponse.json({template});
    }
    let payment:Awaited<ReturnType<typeof mockPayment.createPayment>>|null=null;
    if(action==="pay"){
      const data=await readPrinting();const pending=data.orders.find(o=>o.id===id&&o.userId===user.id);
      if(!pending||!data.config.enabled||!data.config.demo||!data.config.onlinePayment||pending.method!=="mock"||!["pending","payment_failed"].includes(pending.payment)||["draft","cancelled"].includes(pending.state))throw new Error("Demo payment is unavailable.");
      payment=await mockPayment.createPayment({orderId:id,amount:pending.financial.total,simulateFailure:data.config.mockPaymentFailure});
    }
    const order = await mutatePrinting(data => {
      if (!data.config.enabled || !data.config.demo) throw new Error("Demo ordering is unavailable.");
      const order = data.orders.find(o => o.id === id && o.userId === user.id); if (!order) throw new Error("Order not found.");
      if(action==="replace_artwork"){
        if(!["artwork_review","changes_requested"].includes(order.state))throw new Error("Artwork can be revised during review or after requesting changes.");
        const uploadId=text(body.uploadId,100);if(!data.uploads.some(u=>u.id===uploadId&&u.owner===user.id))throw new Error("Artwork does not belong to this account.");
        order.artworkVersions??=[];if(order.uploadId)order.artworkVersions.push({uploadId:order.uploadId,actor:user.id,at:Date.now()});order.uploadId=uploadId;order.artworkRevision=(order.artworkRevision??1)+1;
        if(order.state==="changes_requested")transition(order,"artwork_review",user.id,"Revised artwork uploaded");else order.history.push({from:order.state,to:order.state,actor:user.id,at:Date.now(),reason:"Revised artwork uploaded",message:"A new artwork revision is awaiting review."});
      } else if (action === "approve" || action === "changes") approveProof(order, user.id, text(body.proofId, 100), action === "approve", text(body.reason ?? "Customer requested changes"));
      else if (action === "pay") {
        if (!data.config.onlinePayment || order.method !== "mock" || !["pending","payment_failed"].includes(order.payment) || ["draft", "cancelled"].includes(order.state)) throw new Error("Demo payment is unavailable.");
        order.paymentHistory??=[];order.paymentHistory.push({from:order.payment,to:payment!.state,actor:user.id,at:Date.now(),reason:payment!.state==="payment_failed"?"Demo payment failed; no charge was made":"Customer completed demo payment; no real money collected",reference:payment!.reference});
        order.payment = payment!.state;
      } else if (action === "cancel") transition(order, "cancelled", user.id, "Customer cancellation request");
      else if (action === "return") {const reason=text(body.reason ?? "Customer requested review");transition(order, "return_requested", user.id,reason);order.returnRequest={id:crypto.randomUUID(),userId:user.id,at:Date.now(),reason,state:"requested"};}
      else throw new Error("Unsupported customer action.");
      data.notifications.push({id:crypto.randomUUID(),recipient:user.id,channel:"in_app",template:action==="pay"?(order.payment==="payment_failed"?"payment.failed":"payment.demo_completed"):`order.${order.state}`,status:"delivered",retries:0,providerReference:"",failureReason:"",at:Date.now(),orderId:id});
      data.audit.push({ actor: user.id, action: `order.${action}`, at: Date.now(), recordId: id });
      return customerOrder(order);
    });
    await notifyPrintingAdmin({type:"system",title:`Print order update: ${action.replaceAll("_"," ")}`,detail:id,userId:user.id});
    return NextResponse.json({ order });
  } catch (error) { return failure(error); }
}
