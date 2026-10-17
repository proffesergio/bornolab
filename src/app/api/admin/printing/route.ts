import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../me/route";
import { readPrinting, mutatePrinting } from "@/lib/printing/repository";
import { refundAvailable, transition, moveJob, JOB_STATES, STATES, METRICS, type MetricKey, type OrderState, type PrintCategory, type PrintService, type ProductionJob } from "@/lib/printing/domain";
import { failure, number, text, writeGuard } from "@/lib/printing/http";
import {mirrorPrintingAudit} from "@/lib/printing/side-effects";
import {readMediaIndex} from "@/lib/media-repository";
import {mockShipping} from "@/lib/printing/providers";
export async function GET(req: NextRequest) {
  const actor = await requireAdmin(req); if (actor instanceof NextResponse) return actor;
  if(req.nextUrl.searchParams.get("export")==="orders"){
    try{await mutatePrinting(data=>{data.audit.push({actor,action:"printing.orders_exported",at:Date.now(),recordId:"orders"});});const data=await readPrinting();await mirrorPrintingAudit(actor,"printing.orders_exported","demo orders");return NextResponse.json({demo:true,orders:data.orders},{headers:{"Cache-Control":"private, no-store","Content-Disposition":"attachment; filename=bornolab-demo-print-orders.json"}});}catch(error){return failure(error);}
  }
  try { const data = await readPrinting(); return NextResponse.json({ ...data, uploads: data.uploads.map(file => ({id:file.id,owner:file.owner,name:file.name,mime:file.mime,bytes:file.bytes,createdAt:file.createdAt,status:file.status,rights:file.rights,aiUse:file.aiUse,license:file.license,moderation:file.moderation,takedown:file.takedown})) }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return failure(error); }
}
function localized(value: unknown): void {
  if (!value || typeof value !== "object") throw new Error("English and Bangla content required.");
  const item = value as Record<string, unknown>; if(!text(item.en, 3000))throw new Error("English content is required.");text(item.bn, 3000);
}
export async function PATCH(req: NextRequest) {
  const actor = await requireAdmin(req); if (actor instanceof NextResponse) return actor;
  const blocked = writeGuard(req, actor); if (blocked) return blocked;
  try {
    const body = await req.json() as Record<string, unknown>; const action = text(body.action, 100); const id = text(body.id ?? "", 100);
    const shipment=action==="state"&&body.state==="dispatched"?await mockShipping.createShipment({orderId:id}):null;
    if(action==="catalog") {
      const records=[...(Array.isArray(body.categories)?body.categories:[]),...(Array.isArray(body.services)?body.services:[])];
      const paths=records.flatMap(record=>[record.image,...(Array.isArray(record.gallery)?record.gallery:[])]).filter((v):v is string=>typeof v==="string"&&v.startsWith("/api/media/"));
      if(paths.length){const assets=(await readMediaIndex()).assets;if(paths.some(url=>!assets.some(asset=>asset.url===url&&asset.published)))throw new Error("Publish each chosen image in the media library before saving the catalog.");}
    }
    await mutatePrinting(data => {
      if (action === "catalog") {
        if(body.expectedCatalogVersion!==undefined&&body.expectedCatalogVersion!==(data.catalogVersion??0))throw new Error("The catalog changed in another session. Reload before saving to avoid overwriting it.");
        if (!Array.isArray(body.services) || !Array.isArray(body.categories) || body.services.length > 200 || body.categories.length > 100) throw new Error("Invalid catalog.");
        const categories = body.categories as PrintCategory[]; const services = body.services as PrintService[];
        const ids = new Set<string>();
        for (const category of categories) {
          if (!/^[a-z0-9-]+$/.test(text(category.id, 100)) || ids.has(category.id)) throw new Error("Category IDs must be unique slugs."); ids.add(category.id);
          if(category.image&&(!/^\/[a-zA-Z0-9/_\-.]+$/.test(text(category.image,500))||category.image.startsWith("//")))throw new Error("Choose a local or managed category image.");
          if(category.imageAlt!==undefined)text(category.imageAlt,300);
          localized(category.name); number(category.position, 1000); if (typeof category.hidden !== "boolean" || typeof category.archived !== "boolean") throw new Error("Invalid category visibility.");
        }
        ids.clear();
        for (const service of services) {
          if (!/^[a-z0-9-]+$/.test(text(service.id, 100)) || ids.has(service.id)) throw new Error("Service IDs must be unique slugs."); ids.add(service.id);
          if (!categories.some(c => c.id === service.categoryId)) throw new Error("Service category not found.");
          localized(service.name); localized(service.description); localized(service.policy);
          number(service.unitPrice); number(service.minimum, 100000); number(service.days, 365); number(service.maxBytes, 10485760);
          if (!service.minimum || !["fixed", "options", "quote"].includes(service.pricing) || typeof service.published !== "boolean" || typeof service.proofRequired !== "boolean" || typeof service.featured !== "boolean") throw new Error("Invalid service configuration.");
          if (!Array.isArray(service.options) || service.options.length > 20 || !Array.isArray(service.tiers) || !Array.isArray(service.fileTypes)) throw new Error("Invalid options or file requirements.");
          if(!service.maxBytes||!service.fileTypes.length||service.fileTypes.some(ext=>!["pdf","png","jpg","jpeg"].includes(ext)))throw new Error("Choose supported file types and a positive upload limit.");
          for (const tier of service.tiers) { number(tier.minimum, 100000); number(tier.unitPrice); }
          const optionIds=new Set<string>();
          for (const option of service.options) {
            if(!["select","radio","swatch"].includes(option.type))throw new Error("Choose a select, radio or swatch option type.");
            text(option.id, 100); localized(option.label); localized(option.help); if (typeof option.required !== "boolean" || !Array.isArray(option.values) || option.values.length > 50) throw new Error("Invalid option values.");
            if(!option.id||optionIds.has(option.id))throw new Error("Option IDs must be unique.");optionIds.add(option.id);const valueIds=new Set<string>();
            for (const value of option.values) { text(value.id, 100);if(!value.id||valueIds.has(value.id))throw new Error("Option value IDs must be unique.");valueIds.add(value.id); localized(value.label); number(value.price); number(value.days, 365); if (typeof value.available !== "boolean") throw new Error("Invalid option availability.");if(value.color&&!/^#[a-f0-9]{6}$/i.test(value.color))throw new Error("Use a six-digit hex colour."); }
            if(option.required&&!option.values.some(v=>v.available))throw new Error("Required options need an available value.");
          }
          if(service.imageAlt!==undefined)text(service.imageAlt,300);
          if(service.designSelection!==undefined&&typeof service.designSelection!=="boolean")throw new Error("Invalid design selection setting.");
          if(service.galleryAlt!==undefined){if(!service.galleryAlt||typeof service.galleryAlt!=="object"||Array.isArray(service.galleryAlt)||Object.keys(service.galleryAlt).length>100)throw new Error("Invalid gallery descriptions.");Object.values(service.galleryAlt).forEach(value=>text(value,300));}
          text(service.keywords, 2000); if (!/^\/[a-zA-Z0-9/_\-.]+$/.test(text(service.image, 500))||service.image.startsWith("//")) throw new Error("Use a local image path.");
          if(service.gallery){if(!Array.isArray(service.gallery)||service.gallery.length>8)throw new Error("Use up to eight gallery images.");for(const image of service.gallery)if(!/^\/[a-zA-Z0-9/_\-.]+$/.test(text(image,500))||image.startsWith("//"))throw new Error("Use local gallery image paths.");}
          if(service.faq){if(!Array.isArray(service.faq)||service.faq.length>20)throw new Error("Use up to twenty service FAQs.");for(const item of service.faq){localized(item.question);localized(item.answer);}}
        }
        data.categories = categories; data.services = services; data.catalogVersion=(data.catalogVersion??0)+1;
      } else if (action === "partners") {
        if(!Array.isArray(body.partners)||!Array.isArray(body.designers)||body.partners.length>100||body.designers.length>100)throw new Error("Invalid partners or designers.");
        for(const partner of body.partners){text(partner.id,100);text(partner.name,200);text(partner.contact,200);text(partner.phone,30);text(partner.email,200);text(partner.address,1000);text(partner.notes);number(partner.capacity,1000000);number(partner.days,365);if(!["under_review","approved","active","suspended","archived"].includes(partner.state)||typeof partner.express!=="boolean"||partner.demo!==true)throw new Error("Invalid partner state.");for(const key of ["areas","capabilities","materials","sizes"]){if(!Array.isArray(partner[key])||partner[key].length>50)throw new Error("Invalid partner capabilities.");partner[key].forEach((value:unknown)=>text(value,200));}}
        for(const designer of body.designers){text(designer.id,100);text(designer.name,200);if(!["under_review","approved","suspended"].includes(designer.state)||designer.demo!==true||!Array.isArray(designer.capabilities))throw new Error("Invalid designer.");designer.capabilities.forEach((value:unknown)=>text(value,200));}
        data.partners=body.partners;data.designers=body.designers;
      } else if (action === "support") {
        const ticket=data.tickets.find(t=>t.id===id);if(!ticket)throw new Error("Support ticket not found.");const message=text(body.message);if(!message)throw new Error("Reply required.");ticket.messages.push({actor,at:Date.now(),message});if(body.resolved===true)ticket.state="resolved";
        data.notifications.push({id:crypto.randomUUID(),recipient:ticket.userId,channel:"in_app",template:"support.reply",status:"delivered",retries:0,providerReference:"",failureReason:"",at:Date.now(),orderId:ticket.orderId});
      } else if (action === "settings") {
        const config = body.config as Record<string, unknown>; if (!config) throw new Error("Settings required.");
        for (const key of ["enabled", "onlinePayment", "cod", "quotes", "designHelp", "nationwide", "bangla","mockPaymentFailure"] as const) { if (typeof config[key] !== "boolean") throw new Error("Invalid feature flag."); data.config[key] = config[key]; }
        for(const key of ["demo","creators","partnerDashboard","courier","liveNotifications"] as const)if(config[key]!==undefined&&config[key]!==data.config[key])throw new Error("Live providers, publishing and delegated dashboards cannot be enabled in this demo release.");
        for (const key of ["delivery", "codFee", "codMaximum", "taxBps"] as const) data.config[key] = number(config[key], key === "taxBps" ? 10000 : 100000000);
        data.config.retentionDays=number(config.retentionDays,3650);if(data.config.retentionDays<1)throw new Error("Retention must be at least one day.");
        data.config.deliveryMinDays=number(config.deliveryMinDays,365);data.config.deliveryMaxDays=number(config.deliveryMaxDays,365);if(data.config.deliveryMaxDays<data.config.deliveryMinDays)throw new Error("The delivery window maximum must not be below its minimum.");
        if(!Array.isArray(config.designServices)||config.designServices.length>20)throw new Error("Invalid design-help services.");
        const designs=config.designServices as typeof data.config.designServices;for(const design of designs){text(design.id,100);localized(design.name);number(design.price);number(design.days,365);number(design.revisions,20);}data.config.designServices=designs;
        if(!Array.isArray(config.metrics)||config.metrics.some(key=>typeof key!=="string"||!Object.hasOwn(METRICS,key)))throw new Error("Choose valid dashboard metrics.");data.config.metrics=[...new Set(config.metrics)] as MetricKey[];
        // Real providers and unmoderated publishing cannot be enabled by a UI toggle.
      } else if (action === "quote_message" || action === "quote_status") {
        const quote=data.quotes.find(q=>q.id===id);if(!quote||quote.orderId||["cancelled","declined","expired"].includes(quote.state))throw new Error("This quote is closed or converted to an order.");
        if(action==="quote_message"){
          const message=text(body.message);if(!message)throw new Error("Enter a question or message.");quote.messages??=[];quote.messages.push({actor,at:Date.now(),message});
          data.notifications.push({id:crypto.randomUUID(),recipient:quote.userId,channel:"in_app",template:"quote.question",status:"delivered",retries:0,providerReference:"",failureReason:"",at:Date.now(),orderId:quote.id});
        }else{
          const next=text(body.state,100);const reason=text(body.reason);if(!["cancelled","declined","expired"].includes(next)||!reason||next!=="cancelled"&&quote.state!=="offered")throw new Error("Choose an allowed quote outcome and enter a reason.");
          quote.history??=[];quote.history.push({from:quote.state,to:next as "cancelled"|"declined"|"expired",actor,at:Date.now(),reason});quote.state=next as "cancelled"|"declined"|"expired";
          data.notifications.push({id:crypto.randomUUID(),recipient:quote.userId,channel:"in_app",template:`quote.${quote.state}`,status:"delivered",retries:0,providerReference:"",failureReason:"",at:Date.now(),orderId:quote.id});
        }
      } else if (action === "quote") {
        const quote = data.quotes.find(q => q.id === id); if (!quote || !["requested", "offered"].includes(quote.state)) throw new Error("Quote cannot be revised.");
        if (!Array.isArray(body.lines) || !body.lines.length) throw new Error("Add quote line items.");
        quote.lines = body.lines.slice(0, 50).map(line => ({ label: text(line.label, 200), amount: number(line.amount) })); quote.expiresAt = number(body.expiresAt, Number.MAX_SAFE_INTEGER); quote.days = number(body.days, 365);
        number(quote.lines.reduce((sum,line)=>sum+line.amount,0));
        const deliveryMin=number(body.deliveryMin??data.config.deliveryMinDays,365);const deliveryMax=number(body.deliveryMax??data.config.deliveryMaxDays,365);if(deliveryMax<deliveryMin)throw new Error("Invalid quote delivery window.");quote.deliveryDays={minimum:deliveryMin,maximum:deliveryMax};
        if (quote.expiresAt <= Date.now()) throw new Error("Expiration must be in the future.");quote.history??=[];quote.history.push({from:quote.state,to:"offered",actor,at:Date.now(),reason:"Administrator sent a new offer version"});quote.state = "offered";
        quote.version=(quote.version??0)+1;quote.offers??=[];quote.offers.push({version:quote.version,lines:structuredClone(quote.lines),days:quote.days,deliveryDays:structuredClone(quote.deliveryDays),expiresAt:quote.expiresAt,sentBy:actor,sentAt:Date.now()});
        data.notifications.push({id:crypto.randomUUID(),recipient:quote.userId,channel:"in_app",template:"quote.offered",status:"delivered",retries:0,providerReference:"",failureReason:"",at:Date.now(),orderId:quote.id});
      } else {
        const order = data.orders.find(o => o.id === id); if (!order) throw new Error("Order not found.");
        if (action === "design_version" || action === "final_file") {
          const uploadId=text(body.uploadId,100);if(!data.uploads.some(u=>u.id===uploadId&&u.owner===actor))throw new Error("Upload an admin-owned design file first.");
          if(action==="final_file"){
            if(!order.proofs.at(-1)?.approvedAt||order.proofs.at(-1)?.uploadId!==uploadId||(order.proofs.at(-1)?.artworkRevision??1)!==(order.artworkRevision??1))throw new Error("Final delivery must use the customer-approved proof for the current artwork. Send a new proof if the file has changed.");order.finalFile=uploadId;
          }else{
            if(!order.designService)throw new Error("This order does not include design help.");order.designVersions??=[];
            if(order.designVersions.length>order.designService.revisions)throw new Error("Included design revisions are used. Arrange a new quote before additional work.");
            order.designVersions.push({id:crypto.randomUUID(),uploadId,actor,at:Date.now(),notes:text(body.note??"Design version delivered")});
          }
        } else if (action === "reversal") {
          const original=order.adjustments?.find(a=>a.id===body.adjustmentId&&a.kind!=="reversal");const reason=text(body.reason);
          if(!original||!reason||order.adjustments?.some(a=>a.reversalOf===original.id))throw new Error("Choose an unreversed adjustment and a reason.");
          order.adjustments!.push({id:crypto.randomUUID(),actor,at:Date.now(),kind:"reversal",amount:original.amount,reason,reversalOf:original.id});
          if(original.kind==="refund"&&order.state==="refunded")transition(order,"refund_pending",actor,"Refund accounting correction requires review");
        } else if (action === "note") {
          order.internalNotes ??= []; order.internalNotes.push({ actor, at: Date.now(), text: text(body.note) });
        } else if (action === "assign") {
          const partnerId = text(body.partnerId ?? "", 100); const designerId = text(body.designerId ?? "", 100);
          if (partnerId && !data.partners.some(p => p.id === partnerId && p.state === "active")) throw new Error("Choose an active production partner.");
          if (designerId && !data.designers.some(d => d.id === designerId && d.state === "approved")) throw new Error("Choose an approved designer.");
          if(partnerId&&partnerId!==order.partnerId){order.productionJobs??=[];order.productionJobs.push({id:crypto.randomUUID(),partnerId,state:"assigned",createdAt:Date.now(),history:[]});}
          order.partnerId = partnerId; order.designerId = designerId;
        } else if(action==="job"){
          const job=order.productionJobs?.at(-1);if(!job||!JOB_STATES.includes(body.state as ProductionJob["state"]))throw new Error("Choose an assigned production job and valid state.");
          const next=body.state as ProductionJob["state"];const reason=text(body.reason);
          if(["draft","cancelled","refund_pending","refunded"].includes(order.state)&&next!=="cancelled")throw new Error("This order is not available for production work.");
          if(next==="printing")transition(order,"production",actor,reason);
          if(next==="quality_check")transition(order,"quality_check",actor,reason);
          if(next==="packed"&&order.state!=="ready_dispatch")throw new Error("Record a passing quality check before packing.");
          if(next==="handed_to_courier"&&order.state!=="dispatched")throw new Error("Create the demo shipment before courier handoff.");
          if(next==="completed"&&!["delivered","completed"].includes(order.state))throw new Error("Delivery must be recorded before completing the job.");
          moveJob(job,next,actor,reason);
        } else if (action === "quality") {
          if(typeof body.passed!=="boolean")throw new Error("Record an explicit pass or fail result.");
          const passed = body.passed === true; const note = text(body.note); const evidence = text(body.evidence ?? "", 100);
          if (evidence && !data.uploads.some(u=>u.id===evidence&&u.owner===actor)) throw new Error("QC evidence must be an admin upload.");
          transition(order, passed ? "ready_dispatch" : "qc_failed", actor, note);
          order.qualityChecks ??= []; order.qualityChecks.push({ id: crypto.randomUUID(), actor, at: Date.now(), passed, note, evidence });
        } else if (action === "adjustment") {
          const kind = text(body.kind, 100); const amount = number(body.amount); const reason = text(body.reason);
          if (!["refund","production_cost","packaging_cost","courier_cost","replacement_cost","designer_fee"].includes(kind) || !amount || !reason) throw new Error("Choose adjustment type, positive amount and reason.");
          if (kind === "refund") {
            if (!["demo_paid","cod_collected"].includes(order.payment) || !["refund_pending","refunded"].includes(order.state) || amount > refundAvailable(order)) throw new Error("Refund exceeds the available paid amount or needs review first.");
          }
          order.adjustments ??= []; order.adjustments.push({id:crypto.randomUUID(),actor,at:Date.now(),kind:kind as "refund"|"production_cost"|"packaging_cost"|"courier_cost"|"replacement_cost"|"designer_fee",amount,reason});
          if (kind === "refund" && refundAvailable(order) === 0 && order.state === "refund_pending") transition(order,"refunded",actor,reason);
        } else if (action === "cod") {
          if (order.payment !== "cod_confirmation" || ["draft","cancelled"].includes(order.state)) throw new Error("COD confirmation is unavailable.");
          order.paymentHistory??=[];order.paymentHistory.push({from:order.payment,to:"cod_confirmed",actor,at:Date.now(),reason:"Administrator confirmed COD eligibility; no payment received"});order.payment = "cod_confirmed";
        } else if (action === "collect_cod") {
          if (order.payment !== "cod_confirmed" || !["delivered", "completed"].includes(order.state)) throw new Error("Record COD collection after delivery.");
          order.paymentHistory??=[];order.paymentHistory.push({from:order.payment,to:"cod_collected",actor,at:Date.now(),reason:"Administrator recorded simulated COD collection",reference:order.shipment?.tracking});order.payment = "cod_collected";
        } else if (action === "proof") {
          const uploadId = text(body.uploadId, 100); if (!data.uploads.some(u => u.id === uploadId && u.owner === actor)) throw new Error("Upload an admin-owned proof first.");
          transition(order, "proof_ready", actor, "New proof sent for customer review");
          order.proofs.push({ id: crypto.randomUUID(), version: order.proofs.length + 1, uploadId, createdAt: Date.now(),artworkRevision:order.artworkRevision??1 });
        } else if (action === "state") {
          if (!STATES.includes(body.state as OrderState)) throw new Error("Invalid order state.");
          if (["submitted","proof_ready", "proof_approved"].includes(String(body.state))) throw new Error("Use validated customer submission, proof upload and customer approval actions.");
          if (["ready_dispatch", "qc_failed"].includes(String(body.state))) throw new Error("Record a quality check result.");
          if (body.state === "refunded") throw new Error("Record an append-only refund adjustment.");
          transition(order, body.state as OrderState, actor, text(body.reason), text(body.message ?? ""));
          if(order.returnRequest&&["refund_pending","replacement"].includes(order.state))order.returnRequest.state="reviewed";
          if (order.state === "dispatched"&&shipment) order.shipment = { tracking: shipment.tracking, provider: shipment.provider, events: [{ at: Date.now(), status: "dispatched" }] };
          if (order.shipment && ["in_transit", "delivered", "delivery_failed", "return_to_sender"].includes(order.state)) order.shipment.events.push({ at: Date.now(), status: order.state });
        } else throw new Error("Unsupported admin action.");
        const templates:Record<string,string>={cod:"cod.confirmed",collect_cod:"cod.collected",proof:"proof.ready",design_version:"design.version",final_file:"design.final"};
        const customerEvent=templates[action]??(action==="job"?`job.${order.productionJobs?.at(-1)?.state}`:["state","quality"].includes(action)||action==="adjustment"&&body.kind==="refund"||action==="reversal"&&order.adjustments?.find(a=>a.id===body.adjustmentId)?.kind==="refund"?`order.${order.state}`:"");
        if(customerEvent)data.notifications.push({ id: crypto.randomUUID(), recipient: order.userId, channel: "in_app", template: customerEvent, status: "delivered", retries: 0, providerReference: "", failureReason: "", at: Date.now(), orderId: id });
      }
      data.audit.push({ actor, action: `printing.${action}`, at: Date.now(), recordId: id });
    });
    await mirrorPrintingAudit(actor, `printing.${action}`, id);
    return NextResponse.json({ ok: true });
  } catch (error) { return failure(error); }
}
