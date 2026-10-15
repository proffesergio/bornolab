import { price, transition, approveProof, type PrintData, type Localized, type PrintOption, type PrintOrder, type OrderState } from "./domain";
const local = (en: string, bn: string): Localized => ({ en, bn });
const names = [
  ["business-cards", "Business cards", "বিজনেস কার্ড"], ["flyers", "Flyers & leaflets", "লিফলেট"], ["posters", "Posters & wall prints", "পোস্টার"],
  ["brochures", "Brochures & catalogs", "ব্রোশিওর"], ["invitations", "Invitations & stationery", "আমন্ত্রণপত্র"], ["stickers", "Stickers & labels", "স্টিকার"],
  ["t-shirts", "T-shirts & oversized tees", "টি শার্ট"], ["totes-caps", "Tote bags & caps", "ব্যাগ ও ক্যাপ"], ["gifts", "Mugs & personalized gifts", "মগ ও উপহার"],
  ["notebooks", "Notebooks & journals", "নোটবুক"], ["packaging", "Packaging & paper bags", "প্যাকেজিং"], ["academic", "Certificates & academic printing", "সনদ ও শিক্ষাসামগ্রী"],
  ["banners", "Banners & signage", "ব্যানার"], ["menus", "Menus & restaurant printing", "মেনু"], ["corporate", "Corporate & event merchandise", "কর্পোরেট উপহার"], ["custom", "Custom print request", "কাস্টম প্রিন্ট"],
];
function options(category: number): PrintOption[] {
  const merch=category>=6&&category<=8;
  const sizes=[['90 × 54 mm','90 × 90 mm'],['A5','A4'],['A3','A2'],['A5 folded','A4 folded'],['A6','A5'],['50 mm','80 mm'],['M / L','XL / XXL'],['Standard tote / cap','Large tote'],['325 ml','450 ml'],['A5','A4'],['Custom — confirmed in quote','Custom large'],['A4','A3'],['3 × 6 ft','4 × 8 ft'],['A5','A4'],['Standard package','Large package'],['Custom size','Custom large']][category];
  const materials=[['350 gsm matte card','400 gsm textured card'],['130 gsm art paper','170 gsm art paper'],['170 gsm art paper','250 gsm art paper'],['130 gsm art paper','170 gsm art paper'],['250 gsm ivory card','300 gsm textured card'],['Paper sticker','Vinyl sticker'],['180 gsm cotton','220 gsm cotton'],['Cotton canvas','Heavy canvas'],['Ceramic','Premium ceramic'],['80 gsm ruled paper','100 gsm uncoated paper'],['Kraft paper / board','Coated board'],['100 gsm paper','250 gsm certificate card'],['PVC flex','Fabric'],['250 gsm art paper','350 gsm card'],['Material confirmed in quote','Premium materials'],['Material confirmed in quote','Custom material']][category];
  return [
    { id: "size", type:"select",label: local("Size", "আকার"), required: true, help: local("Confirm final dimensions with your proof.", "প্রুফে চূড়ান্ত আকার দেখুন।"), values: [
      { id: "standard", label: local(sizes[0], `সাধারণ · ${sizes[0]}`), price: 0, days: 0, available: true }, { id: "large", label: local(sizes[1], `বড় · ${sizes[1]}`), price: merch ? 5000 : 200, days: 1, available: true },
    ] },
    { id: "material", type:"radio",label: local("Material", "উপকরণ"), required: true, help: local("Material samples are confirmed during review.", "রিভিউয়ের সময় উপকরণ নিশ্চিত করা হবে।"), values: [
      { id: "standard", label: local(materials[0], `সাধারণ · ${materials[0]}`), price: 0, days: 0, available: true },
      { id: "premium", label: local(materials[1], `প্রিমিয়াম · ${materials[1]}`), price: merch ? 8000 : 300, days: 1, available: true },
    ] },
    { id: "sides", type:"radio",label: local("Print & finish", "প্রিন্ট ও ফিনিশ"), required: true, help: local("Full colour; final colour may vary from screens.", "স্ক্রিনের রং থেকে প্রিন্টের রং ভিন্ন হতে পারে।"), values: [
      { id: "single", label: local("One side, no lamination", "এক পাশে"), price: 0, days: 0, available: true }, { id: "double", label: local("Two sides / extra placement", "দুই পাশে"), price: 200, days: 1, available: true }, { id: "laminated", label: local("Matte lamination", "ম্যাট ল্যামিনেশন"), price: 400, days: 1, available: !merch },
    ] },
    ...(category===6?[{id:"color",type:"swatch" as const,label:local("Garment colour","পোশাকের রং"),required:true,help:local("Confirm stock and print contrast with your proof.","প্রুফের সময় রং ও স্টক নিশ্চিত করুন।"),values:[{id:"white",label:local("White","সাদা"),color:"#ffffff",price:0,days:0,available:true},{id:"black",label:local("Black","কালো"),color:"#171717",price:0,days:0,available:true},{id:"navy",label:local("Navy","নেভি"),color:"#1e3a8a",price:0,days:1,available:true}]}]:[]),
  ];
}
export function seedPrinting(): PrintData {
  const data: PrintData = {
    config: { enabled: true, demo: true, onlinePayment: true, cod: true, quotes: true, designHelp: true, nationwide: true, bangla: true, creators: false, partnerDashboard: false, courier: false, liveNotifications: false,mockPaymentFailure:false, delivery: 12000, codFee: 2000, codMaximum: 500000, taxBps: 0, support: "/contact", retentionDays:90,deliveryMinDays:2,deliveryMaxDays:4, metrics:["orders_today","orders_month","artwork","proofs","production","qc_failed","quotes","revenue"],designServices: [
      { id: "format", name: local("Basic formatting", "বেসিক ফরম্যাটিং"), price: 30000, days: 1, revisions: 1 },
      { id: "prepare", name: local("Print-ready preparation", "প্রিন্ট ফাইল প্রস্তুতি"), price: 60000, days: 2, revisions: 2 },
      { id: "custom", name: local("Business card / flyer design", "কার্ড / ফ্লায়ার ডিজাইন"), price: 120000, days: 3, revisions: 2 },
    ] },
    categories: names.map(([id, en, bn], position) => ({ id, name: local(en, bn), position, hidden: false, archived: false })),
    services: [...names.map(([id, en, bn], i) => ({ id, en, bn, i })),
      { id: "premium-business-cards", en: "Premium business cards", bn: "প্রিমিয়াম বিজনেস কার্ড", i: 0 },
      { id: "oversized-tees", en: "Oversized tees", bn: "ওভারসাইজ টি শার্ট", i: 6 },
      { id: "paper-bags", en: "Branded paper bags", bn: "ব্র্যান্ডেড কাগজের ব্যাগ", i: 10 },
      { id: "academic-bundles", en: "Academic print bundles", bn: "শিক্ষাসামগ্রী প্রিন্ট প্যাকেজ", i: 11 },
    ].map(({ id, en, bn, i }) => ({ id, categoryId: names[i][0], name: local(en, bn), description: local("Choose your options and send your artwork. BornoLab reviews your file and prepares a proof before printing.", "অপশন বেছে ফাইল পাঠান। প্রিন্টের আগে বর্ণল্যাব ফাইল রিভিউ করে প্রুফ তৈরি করবে।"), published: true, featured: i < 3 || i === 6,
      pricing: ([10, 14, 15].includes(i) ? "quote" : "options") as "quote" | "options", unitPrice: i >= 6 && i <= 9 ? 35000 : 800,
      minimum: i >= 6 && i <= 9 ? 1 : 50, days: i >= 6 ? 5 : 3, tiers: [{ minimum: 500, unitPrice: i >= 6 && i <= 9 ? 30000 : 650 }], options: options(i), proofRequired: true,
      keywords: `${en} ${bn} business student wedding event school cotton paper Dhaka Bangladesh`, fileTypes: ["pdf", "png", "jpg", "jpeg"], maxBytes: 10 * 1024 * 1024,
      image: `/printing/previews/${names[i][0]}.svg`, policy: local("Ask for cancellation before production begins. Custom printed goods require review for returns, refunds or replacements. Demo orders incur no charge.", "উৎপাদনের আগে বাতিলের অনুরোধ করুন। রিটার্ন ও রিফান্ড রিভিউ সাপেক্ষে। ডেমো অর্ডারে টাকা নেওয়া হয় না।"),
      gallery:[],faq:[{question:local("Does an uploaded file mean it is print-ready?","আপলোড করা ফাইল কি প্রিন্টের জন্য প্রস্তুত?"),answer:local("No. A team member must review it, and the latest required proof must be approved before production.","ফাইল রিভিউ ও সর্বশেষ প্রুফের অনুমোদন প্রয়োজন।")},{question:local("Can I request design help?","ডিজাইনের সাহায্য পাওয়া যাবে?"),answer:local("Choose design help when configuring your order. The fee, estimated days and included revisions are shown before submission.","অর্ডারের সময় ডিজাইন সেবা বেছে নিন। মূল্য, সময় ও সংশোধনের সংখ্যা দেখানো হবে।")}],
    })), orders: [], quotes: [], uploads: [], audit: [], notifications: [], tickets:[], templates:[],
    partners: [0,1].map(i=>({id:`demo-partner-${i+1}`,name:`Sample Print Partner ${i+1}`,contact:"Fictional operations team",phone:"",email:"",address:"Demo location, Dhaka",areas:["Dhaka"],capabilities:["Digital printing","Finishing"],materials:["Paper"],sizes:["A4","A3"],capacity:1000,days:3,express:false,state:"active",notes:"Fictional demo partner; no contact or courier integration.",demo:true})),
    designers: [0,1,2].map(i=>({id:`demo-designer-${i+1}`,name:`Sample Designer ${i+1}`,state:"approved",capabilities:["Formatting","Print preparation"],demo:true})),
  };
  const sampleTime=Date.UTC(2026,9,1);
  const states:OrderState[]=["submitted","artwork_review","proof_ready","proof_approved","production","qc_failed","refund_pending","refunded","replacement","delivered"];
  data.uploads.push({id:"demo-artwork",owner:"demo-customer",name:"demo-proof.png",mime:"image/png",bytes:68,content:"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ9kAAAAASUVORK5CYII=",createdAt:sampleTime,status:"needs_review",rights:true,aiUse:false,license:"Fictional demo sample only",moderation:"pending",takedown:false});
  for(let i=0;i<states.length;i++){
    const service=data.services[i%3];const selections={size:"standard",material:"standard",sides:"single"};
    const record:PrintOrder={id:`PR-DEMO-${String(i+1).padStart(3,"0")}`,userId:`demo-customer-${i+1}`,service:structuredClone(service),quantity:50,selections,designHelp:"",notes:"Fictional seed record — no real customer, payment or production.",uploadId:"demo-artwork",address:{name:`Demo Customer ${i+1}`,phone:"",division:"Dhaka",district:"Dhaka",thana:"Demo thana",area:"Demo locality",details:"Fictional address",instruction:"Do not fulfill"},state:"draft",payment:i===0?"cod_confirmation":"demo_paid",method:i===0?"cod":"mock",financial:price(service,50,selections,data.config,"",i===0?"cod":"mock"),createdAt:sampleTime+i*86400000,updatedAt:sampleTime+i*86400000,history:[],proofs:[],demo:true,adjustments:[]};
    const target=states[i];transition(record,"submitted","demo-customer","Fictional demo submission");
    const sequence:OrderState[]=["artwork_review","proof_ready","proof_approved","queued","production","quality_check",...(["qc_failed","refund_pending","refunded","replacement"].includes(target)?["qc_failed" as const]:["ready_dispatch" as const,"dispatched" as const,"in_transit" as const,"delivered" as const])];
    if(target!=="submitted")for(const next of sequence){
      if(next==="proof_ready")record.proofs.push({id:`demo-proof-${i}`,version:1,uploadId:"demo-artwork",createdAt:record.createdAt+1000});
      if(next==="proof_approved")approveProof(record,record.userId,record.proofs[0].id,true,"");else transition(record,next,"demo-operator","Fictional demo progress");
      if(next===target||next==="qc_failed")break;
    }
    if(["refund_pending","refunded"].includes(target))transition(record,"refund_pending","demo-operator","Demo QC refund review");
    if(target==="refunded"){record.adjustments!.push({id:"demo-refund",actor:"demo-operator",at:record.createdAt+10000,kind:"refund",amount:record.financial.total,reason:"Fictional refund — no money moved"});transition(record,"refunded","demo-operator","Fictional full refund");}
    if(target==="replacement")transition(record,"replacement","demo-operator","Fictional replacement after QC failure");
    if(target==="delivered")record.shipment={provider:"mock",tracking:`DEMO-${record.id}`,events:[{at:record.createdAt+10000,status:"delivered"}]};
    record.history.forEach((h,index)=>{h.at=record.createdAt+(index+1)*1000;});record.updatedAt=record.history.at(-1)?.at??record.createdAt;
    if(record.proofs[0]?.approvedAt)record.proofs[0].approvedAt=record.createdAt+3000;
    data.orders.push(record);
  }
  data.quotes=[0,1,2].map(i=>({id:`PQ-DEMO-${i+1}`,userId:`demo-quote-customer-${i+1}`,categoryId:["corporate","packaging","academic"][i],quantity:[500,1000,300][i],dimensions:"Custom dimensions to confirm",material:"Paper",finishing:"Matte",location:"Fictional Dhaka locality",requiredDate:"",budget:"",notes:"Fictional demo quote; no real contact details.",state:i===1?"offered":"requested",lines:i===1?[{label:"Demo packaging offer",amount:1500000}]:[],expiresAt:Date.UTC(2027,0,1),days:5,createdAt:sampleTime}));
  return data;
}
