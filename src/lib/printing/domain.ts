export type Localized = { en: string; bn: string };
export type PrintCategory = { id: string; name: Localized; position: number; hidden: boolean; archived: boolean; image?:string; imageAlt?:string };
export type PrintOption = { id: string; type:"select"|"radio"|"swatch";label: Localized; required: boolean; help: Localized; values: { id: string; label: Localized; price: number; days: number; available: boolean;color?:string }[] };
export type PrintService = {
  id: string; categoryId: string; name: Localized; description: Localized; published: boolean; featured: boolean;
  pricing: "fixed" | "options" | "quote"; unitPrice: number; minimum: number; days: number;
  tiers: { minimum: number; unitPrice: number }[]; options: PrintOption[]; proofRequired: boolean;
  keywords: string; fileTypes: string[]; maxBytes: number; image: string; policy: Localized;
  gallery?:string[];faq?:{question:Localized;answer:Localized}[];
  imageAlt?:string; galleryAlt?:Record<string,string>; designSelection?:boolean;
};
export const STATES = ["draft", "submitted", "artwork_review", "proof_ready", "changes_requested", "proof_approved", "queued", "production", "quality_check", "qc_failed", "ready_dispatch", "dispatched", "in_transit", "delivered", "completed", "delayed", "out_of_stock", "delivery_failed", "return_to_sender", "cancelled", "return_requested", "refund_pending", "refunded", "replacement", "disputed"] as const;
export type OrderState = typeof STATES[number];
export type PrintPaymentState="pending"|"payment_failed"|"demo_paid"|"cod_confirmation"|"cod_confirmed"|"cod_collected";
export type FinancialSnapshot = { base: number; options: number; design: number; delivery: number; cod: number; discount: number; tax: number; total: number; currency: "BDT" };
export type Address = { name: string; phone: string; division: string; district: string; thana: string; area: string; details: string; instruction: string };
export function normalizePhone(value:string):string{return value.replace(/[\u09e6-\u09ef]/g,digit=>String(digit.charCodeAt(0)-0x09e6)).replace(/[\s-]/g,"");}
export function isBangladeshPhone(value:string):boolean{return /^(?:\+?88)?01[3-9]\d{8}$/.test(normalizePhone(value));}
export type Proof = { id: string; version: number; uploadId: string; createdAt: number; approvedAt?: number; approvedBy?: string; changes?: string;artworkRevision?:number };
export type Transition = { from: OrderState; to: OrderState; actor: string; at: number; reason: string; message: string; internalNote?: string; evidence?: string };
export const JOB_STATES=["assigned","accepted","artwork_check","printing","finishing","quality_check","packed","handed_to_courier","completed","delayed","rework","cancelled"] as const;
export type ProductionJob={id:string;partnerId:string;state:typeof JOB_STATES[number];createdAt:number;history:{from:typeof JOB_STATES[number];to:typeof JOB_STATES[number];actor:string;at:number;reason:string}[]};
export function moveJob(job:ProductionJob,next:ProductionJob["state"],actor:string,reason:string):void {
  const permitted:Partial<Record<ProductionJob["state"],ProductionJob["state"][]>>={assigned:["accepted","cancelled"],accepted:["artwork_check","cancelled"],artwork_check:["printing","cancelled"],printing:["finishing","delayed"],finishing:["quality_check"],quality_check:["packed","rework"],rework:["printing"],packed:["handed_to_courier"],handed_to_courier:["completed"],delayed:["printing","cancelled"]};
  if(!permitted[job.state]?.includes(next)||!reason.trim())throw new Error("Invalid production-job transition or missing reason.");
  job.history.push({from:job.state,to:next,actor,at:Date.now(),reason});job.state=next;
}
export type PrintOrder = {
  selectedDesign?:{image:string;label:string};
  id: string; userId: string; service: PrintService; quantity: number; selections: Record<string, string>;
  designHelp: string; notes: string; uploadId: string; address: Address; state: OrderState;
  payment: PrintPaymentState;
  paymentHistory?:{from:PrintPaymentState;to:PrintPaymentState;actor:string;at:number;reason:string;reference?:string}[];
  refundTotal?:number;
  method: "mock" | "cod"; financial: FinancialSnapshot; createdAt: number; updatedAt: number;
  history: Transition[]; proofs: Proof[]; demo: true; shipment?: { tracking: string; provider: "mock"; events: { at: number; status: string }[] };
  partnerId?: string; designerId?: string; internalNotes?: { actor: string; at: number; text: string }[];
  qualityChecks?: { id: string; actor: string; at: number; passed: boolean; note: string; evidence: string }[];
  adjustments?: { id: string; actor: string; at: number; kind: "refund" | "production_cost" | "packaging_cost" | "courier_cost" | "replacement_cost" | "designer_fee" | "reversal"; amount: number; reason: string; reversalOf?:string }[];
  quoteId?: string;
  designService?:PrintConfig["designServices"][number];
  designVersions?:{id:string;uploadId:string;actor:string;at:number;notes:string}[];finalFile?:string;
  productionJobs?:ProductionJob[];
  artworkRevision?:number;artworkVersions?:{uploadId:string;actor:string;at:number}[];
  returnRequest?:{id:string;userId:string;at:number;reason:string;state:"requested"|"reviewed"};
  productionDays?:number;deliveryDays?:{minimum:number;maximum:number};
};
export type ProductionPartner = { id: string; name: string; contact: string; phone: string; email: string; address: string; areas: string[]; capabilities: string[]; materials: string[]; sizes: string[]; capacity: number; days: number; express: boolean; state: "under_review" | "approved" | "active" | "suspended" | "archived"; notes: string; demo: true };
export type DesignerProfile = { id: string; name: string; state: "under_review" | "approved" | "suspended"; capabilities: string[]; demo: true;userId?:string };
export type CreatorDesign={id:string;ownerId:string;sourceUploadId:string;previewUploadId:string;title:Localized;description:Localized;tags:string[];categoryId:string;createdAt:number;rightsDeclaration:string;aiUse:boolean;moderation:"submitted"|"changes_requested"|"approved"|"rejected";takedown:"none"|"requested"|"removed";licenseTerms:string;usagePermission:"printing_only"|"commercial_printing";published:false};
export type CreatorRoyaltyRule={id:string;designerId:string;serviceId:string;basisPoints:number;flatPaisa:number;enabled:false};
export const METRICS={orders_today:"Orders today",orders_month:"Orders this month",revenue:"Received value (demo)",contribution:"Contribution (demo)",artwork:"Artwork reviews",proofs:"Proofs awaiting approval",production:"In production",delayed:"Delayed orders",qc_failed:"QC failures",delivery_failed:"Delivery failures",cod_refusal:"COD refusal rate",refunds:"Refunds",replacements:"Replacements",quotes:"Quote requests",customers:"Active customers (demo)",designers:"Approved designers",partners:"Active partners"} as const;
export type MetricKey=keyof typeof METRICS;
export type SupportTicket = { id:string; orderId:string; userId:string; state:"open"|"resolved"; createdAt:number; messages:{actor:string;at:number;message:string}[] };
export type PrintTemplate={id:string;userId:string;name:string;serviceId:string;quantity:number;selections:Record<string,string>;designHelp:string;notes:string;createdAt:number};
export type QuoteState="requested"|"offered"|"accepted"|"declined"|"expired"|"cancelled";
export type QuoteRequest = { id: string; userId: string; categoryId: string; quantity: number; dimensions: string; material: string; finishing: string; location: string; requiredDate: string; budget: string; notes: string; state: QuoteState; lines: { label: string; amount: number }[]; expiresAt?: number; days?: number; deliveryDays?:{minimum:number;maximum:number};orderId?: string; createdAt: number;contactName?:string;phone?:string;uploadId?:string;version?:number;offers?:{version:number;lines:{label:string;amount:number}[];days:number;deliveryDays?:{minimum:number;maximum:number};expiresAt:number;sentBy:string;sentAt:number}[];history?:{from:QuoteState;to:QuoteState;actor:string;at:number;reason:string}[];messages?:{actor:string;at:number;message:string}[] };
export type DesignUpload = { id: string; owner: string; name: string; mime: string; bytes: number; content: string; createdAt: number; status: "needs_review"; rights: boolean; aiUse: boolean; license: string; moderation: "pending"; takedown: boolean;scanState?:"clean"|"unscanned" };
export type PrintConfig = {
  enabled: boolean; demo: boolean; onlinePayment: boolean; cod: boolean; quotes: boolean; designHelp: boolean;
  nationwide: boolean; bangla: boolean; creators: boolean; partnerDashboard: boolean; courier: boolean; liveNotifications: boolean;mockPaymentFailure:boolean;
  delivery: number; codFee: number; codMaximum: number; taxBps: number; support: string; retentionDays:number;metrics:MetricKey[];deliveryMinDays:number;deliveryMaxDays:number;
  designServices: { id: string; name: Localized; price: number; days: number; revisions: number }[];
};
export type PrintData = { catalogVersion?:number; config: PrintConfig; categories: PrintCategory[]; services: PrintService[]; orders: PrintOrder[]; quotes: QuoteRequest[]; uploads: DesignUpload[]; partners: ProductionPartner[]; designers: DesignerProfile[]; tickets:SupportTicket[]; templates:PrintTemplate[]; audit: { actor: string; action: string; at: number; recordId: string }[]; notifications: { id: string; recipient: string; channel: "in_app"; template: string; status: "delivered"; retries: number; providerReference: string; failureReason: string; at: number; orderId: string;read?:boolean }[] };

export function refundAvailable(order: PrintOrder): number { const adjustments=order.adjustments??[];return Math.max(0,order.financial.total-adjustments.filter(a=>a.kind==="refund"&&!adjustments.some(r=>r.kind==="reversal"&&r.reversalOf===a.id)).reduce((sum,a)=>sum+a.amount,0)); }
export function contribution(order: PrintOrder): number { return order.financial.total - (order.adjustments??[]).reduce((sum,a)=>sum+(a.kind==="reversal"?-a.amount:a.amount),0); }
export function dashboardMetrics(data:PrintData,now:number):Record<MetricKey,string|number>{
  const placed=data.orders.filter(o=>o.state!=="draft");const paid=placed.filter(o=>["demo_paid","cod_collected"].includes(o.payment));const day=(at:number)=>new Date(at+6*3600000).toISOString().slice(0,10);const count=(state:OrderState)=>placed.filter(o=>o.state===state).length;
  const cod=placed.filter(o=>o.method==="cod"&&o.shipment);const refusals=cod.filter(o=>["delivery_failed","return_to_sender"].includes(o.state)).length;
  return {orders_today:placed.filter(o=>day(o.createdAt)===day(now)).length,orders_month:placed.filter(o=>day(o.createdAt).slice(0,7)===day(now).slice(0,7)).length,revenue:money(paid.reduce((sum,o)=>sum+refundAvailable(o),0)),contribution:money(paid.reduce((sum,o)=>sum+contribution(o),0)),artwork:count("artwork_review"),proofs:count("proof_ready"),production:count("production"),delayed:count("delayed"),qc_failed:count("qc_failed"),delivery_failed:count("delivery_failed"),cod_refusal:cod.length?`${Math.round(refusals*100/cod.length)}%`:"Not yet measured",refunds:count("refund_pending")+count("refunded"),replacements:count("replacement"),quotes:data.quotes.filter(q=>q.state==="requested").length,customers:new Set(placed.filter(o=>!["cancelled","completed","refunded"].includes(o.state)).map(o=>o.userId)).size,designers:data.designers.filter(d=>d.state==="approved").length,partners:data.partners.filter(p=>p.state==="active").length};
}
export function quoteService(quote: QuoteRequest, template: PrintService): PrintService {
  return { ...template, id: `quote-${quote.id}`, name: { en: `Quoted ${template.name.en}`, bn: template.name.bn }, pricing: "fixed", unitPrice: 0, minimum: quote.quantity, days: quote.days ?? template.days, tiers: [], options: [], description: { en: "Your accepted quote includes the agreed printing, design and delivery. Review the quote line items before submitting.", bn: "অনুমোদিত কোট অনুযায়ী অর্ডার।" } };
}
export function quoteValid(quote: QuoteRequest): boolean { return Boolean(quote.expiresAt && quote.expiresAt > Date.now()); }

export function money(paisa: number): string { return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(paisa / 100); }
function integer(value: number, max = 100_000_000): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > max) throw new Error("Invalid quantity or price.");
  return value;
}
export function price(service: PrintService, quantity: number, selections: Record<string, string>, config: PrintConfig, designId = "", method = "mock"): FinancialSnapshot {
  integer(quantity, 100_000);
  if (quantity < service.minimum) throw new Error(`Minimum quantity is ${service.minimum}.`);
  let unit = service.unitPrice;
  for (const tier of [...service.tiers].sort((a, b) => a.minimum - b.minimum)) if (quantity >= tier.minimum) unit = tier.unitPrice;
  let options = 0;
  for (const option of service.options) {
    const selected = selections[option.id];
    if (!selected && !option.required) continue;
    const value = option.values.find(v => v.id === selected && v.available);
    if (!value) throw new Error(`Choose an available ${option.label.en.toLowerCase()}.`);
    options += integer(value.price) * quantity;
  }
  const designService = config.designServices.find(d => d.id === designId);
  if (designId && (!config.designHelp || !designService)) throw new Error("Design help is unavailable.");
  const base = integer(unit) * quantity;
  const design = designService?.price ?? 0;
  const subtotal = integer(base + options + design);
  const tax = Math.floor((subtotal * integer(config.taxBps, 10000) + 5000) / 10000);
  const cod = method === "cod" ? integer(config.codFee) : 0;
  const total = integer(subtotal + integer(config.delivery) + cod + tax);
  if (method === "cod" && (!config.cod || total > config.codMaximum)) throw new Error("Cash on delivery is unavailable for this order.");
  return { base, options, design, delivery: config.delivery, cod, discount: 0, tax, total, currency: "BDT" };
}
export function leadDays(service: PrintService, selections: Record<string, string>, config: PrintConfig, designId: string): number {
  return service.days + service.options.reduce((sum, o) => sum + (o.values.find(v => v.id === selections[o.id])?.days ?? 0), 0) + (config.designServices.find(d => d.id === designId)?.days ?? 0);
}
const NEXT: Partial<Record<OrderState, OrderState[]>> = {
  draft: ["submitted", "cancelled"], submitted: ["artwork_review", "out_of_stock", "cancelled"], artwork_review: ["proof_ready", "queued", "changes_requested", "out_of_stock", "cancelled"],
  proof_ready: ["proof_approved", "changes_requested", "cancelled"], changes_requested: ["artwork_review", "proof_ready", "cancelled"], proof_approved: ["queued", "proof_ready", "cancelled"],
  queued: ["production", "delayed", "out_of_stock", "cancelled"], production: ["quality_check", "delayed"], quality_check: ["ready_dispatch", "qc_failed"], qc_failed: ["replacement", "refund_pending"],
  replacement: ["production","artwork_review"], ready_dispatch: ["dispatched"], dispatched: ["in_transit", "delayed", "delivery_failed"], in_transit: ["delivered", "delayed", "delivery_failed"], delivered: ["completed", "return_requested", "disputed"], refunded:["refund_pending"],
  out_of_stock:["artwork_review","queued","cancelled","refund_pending"],delivery_failed:["in_transit","return_to_sender"],return_to_sender:["replacement","refund_pending","cancelled"],
  completed: ["return_requested", "disputed"], return_requested: ["refund_pending", "replacement"], disputed: ["refund_pending", "replacement"], refund_pending: ["refunded"], delayed: ["queued", "production", "in_transit", "cancelled"],
};
export function nextOrderStates(order:Pick<PrintOrder,"state">):OrderState[]{return [...(NEXT[order.state]??[])];}
export function transition(order: PrintOrder, next: OrderState, actor: string, reason: string, message = ""): void {
  if (!NEXT[order.state]?.includes(next)) throw new Error(`Cannot move from ${order.state} to ${next}.`);
  if (!reason.trim()) throw new Error("A reason is required.");
  if (["queued", "production"].includes(next)) {
    if (!["demo_paid", "cod_confirmed", "cod_collected"].includes(order.payment)) throw new Error("Payment or COD confirmation is required.");
    const latest = order.proofs.at(-1);
    if (order.service.proofRequired && (!latest?.approvedAt || !latest.approvedBy || (latest.artworkRevision??1)!==(order.artworkRevision??1))) throw new Error("The customer must approve the latest proof for the current artwork before production.");
  }
  order.history.push({ from: order.state, to: next, actor, at: Date.now(), reason, message });
  order.state = next; order.updatedAt = Date.now();
}
export function approveProof(order: PrintOrder, userId: string, proofId: string, approve: boolean, reason: string): void {
  if (order.userId !== userId) throw new Error("This order belongs to another account.");
  const proof = order.proofs.at(-1);
  if (order.state !== "proof_ready" || !proof || proof.id !== proofId || (proof.artworkRevision??1)!==(order.artworkRevision??1)) throw new Error("This proof has changed. Refresh before approving.");
  transition(order, approve ? "proof_approved" : "changes_requested", userId, approve ? "Customer approved proof" : reason);
  if (approve) { proof.approvedAt = Date.now(); proof.approvedBy = userId; } else proof.changes = reason;
}
export function validateArtwork(name: string, mime: string, bytes: Uint8Array, service: PrintService): void {
  const extension = name.split(".").at(-1)?.toLowerCase() ?? "";
  if (!service.fileTypes.includes(extension) || !["pdf", "png", "jpg", "jpeg"].includes(extension)) throw new Error("Use PDF, PNG or JPEG artwork for this service.");
  if (!bytes.length || bytes.length > service.maxBytes) throw new Error("The file is empty or exceeds the service upload limit.");
  const pdf = extension === "pdf" && mime === "application/pdf" && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  const png = extension === "png" && mime === "image/png" && [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v);
  const jpg = ["jpg", "jpeg"].includes(extension) && mime === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!pdf && !png && !jpg) throw new Error("File contents do not match the declared file type.");
  function dimensions(width:number,height:number){if(!width||!height||width>12000||height>12000||width*height>50_000_000)throw new Error("Image dimensions exceed the safe preview limit. Export a print-sized PDF or a smaller image.");}
  if(png){
    if(bytes.length<33||new TextDecoder().decode(bytes.slice(12,16))!=="IHDR")throw new Error("The PNG header is incomplete.");
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);dimensions(view.getUint32(16),view.getUint32(20));
  }
  if(jpg){
    let offset=2;let found=false;
    while(offset+1<bytes.length){
      if(bytes[offset++]!==255)continue;while(offset<bytes.length&&bytes[offset]===255)offset++;
      const marker=bytes[offset++];if(marker===0xda||marker===0xd9)break;if(marker===0||marker===1||marker===0xd8||marker>=0xd0&&marker<=0xd7)continue;
      if(offset+1>=bytes.length)break;const length=bytes[offset]*256+bytes[offset+1];if(length<2||offset+length>bytes.length)throw new Error("The JPEG header is incomplete.");
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
        if(length<8)throw new Error("The JPEG dimensions are incomplete.");dimensions(bytes[offset+5]*256+bytes[offset+6],bytes[offset+3]*256+bytes[offset+4]);found=true;
      }
      offset+=length;
    }
    if(!found)throw new Error("JPEG dimensions could not be verified. Export a fresh JPEG or PDF.");
  }
}

/** Resolve a current public design; callers snapshot this label/image in the order. */
export function selectPrintDesign(service: PrintService, image: string): {image:string;label:string}|undefined {
  if (!image) return undefined;
  if (!service.designSelection || !service.gallery?.includes(image)) throw new Error("This design is no longer available. Choose another reference.");
  return {image,label:service.galleryAlt?.[image] || service.name.en + " design " + (service.gallery.indexOf(image)+1)};
}
