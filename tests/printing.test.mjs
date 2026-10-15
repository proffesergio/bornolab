import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync,mkdtempSync,rmSync,existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import {runInNewContext} from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(file, overrides = {}, cache = new Map()) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute);
  const compiledModule = { exports: {} }; cache.set(absolute, compiledModule.exports);
  const output = ts.transpileModule(readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const dependency = name => {
    if (name in overrides) return overrides[name];
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`, overrides, cache);
    if (name.startsWith(".")) return load(path.resolve(path.dirname(absolute), `${name}.ts`), overrides, cache);
    return require(name);
  };
  new Function("require", "module", "exports", "process", output)(dependency, compiledModule, compiledModule.exports, overrides.__process ?? process);
  cache.set(absolute, compiledModule.exports); return compiledModule.exports;
}
const domain = load("src/lib/printing/domain.ts");
const { seedPrinting } = load("src/lib/printing/seed.ts");
const seed = seedPrinting(); const service = seed.services[0];
const selections = {size:"standard", material:"standard", sides:"single"};
function order(state = "artwork_review") { return {id:"test",userId:"customer",service:structuredClone(service),quantity:50,selections,financial:domain.price(service,50,selections,seed.config),state,payment:"pending",history:[],proofs:[],createdAt:1,updatedAt:1,method:"mock",demo:true,address:{}}; }

test("integer pricing includes tiers, options, design, delivery, VAT and COD",()=>{
  assert.equal(seed.categories.length,16); assert.equal(seed.services.length,20);
  assert.equal(seed.orders.length,10);assert.equal(seed.partners.length,2);assert.equal(seed.designers.length,3);
  assert.equal(domain.price(service,50,selections,seed.config).total,52000);
  assert.equal(domain.price(service,500,selections,seed.config).base,325000);
  assert.equal(domain.price(service,50,{...selections,sides:"double"},seed.config,"format").total,92000);
  assert.equal(domain.price(service,50,selections,{...seed.config,taxBps:500},"","cod").total,56000);
  assert.throws(()=>domain.price(service,50.5,selections,seed.config));
  assert.throws(()=>domain.price(service,49,selections,seed.config));
  assert.throws(()=>domain.price(service,50,{...selections,size:"fake"},seed.config));
  assert.throws(()=>domain.price(service,50,selections,{...seed.config,cod:false},"","cod"));
  assert.throws(()=>domain.price(service,50,selections,{...seed.config,codMaximum:1},"","cod"));
});
test("Bangladesh phone validation supports Bangla digits and valid country prefixes",()=>{
  assert.equal(domain.isBangladeshPhone("01700000000"),true);assert.equal(domain.isBangladeshPhone("+8801700000000"),true);assert.equal(domain.isBangladeshPhone("০১৭০০০০০০০০"),true);assert.equal(domain.isBangladeshPhone("+801700000000"),false);assert.equal(domain.isBangladeshPhone("01200000000"),false);
});
test("production requires confirmed payment and current proof approval",()=>{
  const o=order();assert.throws(()=>domain.transition(o,"production","admin","skip"));
  assert.throws(()=>domain.transition(o,"queued","admin","queue"));
  o.payment="cod_confirmed";assert.throws(()=>domain.transition(o,"queued","admin","queue"));
  domain.transition(o,"proof_ready","admin","proof");o.proofs.push({id:"v1",version:1,uploadId:"file",createdAt:1});
  assert.throws(()=>domain.approveProof(o,"another","v1",true,""));
  assert.throws(()=>domain.approveProof(o,"customer","stale",true,""));
  domain.approveProof(o,"customer","v1",true,"");assert.equal(o.proofs[0].approvedBy,"customer");
  domain.transition(o,"queued","admin","approved");domain.transition(o,"production","admin","start");
  assert.equal(o.history.at(-1).from,"queued");assert.equal(o.history.at(-1).actor,"admin");
});
test("new proof invalidates previous approval; changes need a reason",()=>{
  const o=order("proof_ready");o.payment="demo_paid";o.proofs=[{id:"v1",version:1,uploadId:"one",createdAt:1}];
  assert.throws(()=>domain.approveProof(o,"customer","v1",false,""));
  domain.approveProof(o,"customer","v1",true,"");domain.transition(o,"proof_ready","admin","revision");o.proofs.push({id:"v2",version:2,uploadId:"two",createdAt:2});
  assert.throws(()=>domain.transition(o,"queued","admin","queue"));
  o.artworkRevision=2;assert.throws(()=>domain.approveProof(o,"customer","v2",true,""));
  o.proofs[1].artworkRevision=2;domain.approveProof(o,"customer","v2",true,"");
  o.artworkRevision=3;assert.throws(()=>domain.transition(o,"queued","admin","queue stale artwork proof"));
  o.artworkRevision=2;domain.transition(o,"queued","admin","Current artwork approved");
});
test("production jobs require acceptance, artwork check, finishing and QC in order",()=>{
  const job={id:"job",partnerId:"partner",state:"assigned",createdAt:1,history:[]};
  assert.throws(()=>domain.moveJob(job,"printing","admin","skip"));
  for(const state of ["accepted","artwork_check","printing","finishing","quality_check","packed","handed_to_courier","completed"])domain.moveJob(job,state,"admin","Demo job progress");
  assert.equal(job.state,"completed");assert.equal(job.history.length,8);assert.equal(job.history[0].from,"assigned");
});
test("artwork validates size, extension, MIME and signatures",()=>{
  domain.validateArtwork("art.pdf","application/pdf",new TextEncoder().encode("%PDF-1.7"),service);
  assert.throws(()=>domain.validateArtwork("evil.svg","image/svg+xml",new TextEncoder().encode("<script/>"),service));
  assert.throws(()=>domain.validateArtwork("art.pdf","application/pdf",new TextEncoder().encode("not PDF"),service));
  assert.throws(()=>domain.validateArtwork("art.png","application/pdf",new Uint8Array([137,80,78,71,13,10,26,10]),service));
  assert.throws(()=>domain.validateArtwork("art.pdf","application/pdf",new Uint8Array(11*1024*1024),service));
  const png=Buffer.from(seed.uploads[0].content,"base64");domain.validateArtwork("proof.png","image/png",png,service);const oversized=Buffer.from(png);oversized.writeUInt32BE(100000,16);assert.throws(()=>domain.validateArtwork("oversized.png","image/png",oversized,service),/dimensions/);
  assert.throws(()=>domain.validateArtwork("broken.jpg","image/jpeg",new Uint8Array([255,216,255,217]),service),/dimensions/);
});
test("refund and contribution use append-only adjustments",()=>{
  const o=order();o.adjustments=[{id:"refund",kind:"refund",amount:10000},{id:"cost",kind:"replacement_cost",amount:5000}];
  assert.equal(domain.refundAvailable(o),42000);assert.equal(domain.contribution(o),37000);assert.equal(o.financial.total,52000);
  o.adjustments.push({id:"reversal",kind:"reversal",amount:10000,reversalOf:"refund"});assert.equal(domain.refundAvailable(o),52000);assert.equal(domain.contribution(o),47000);
});
test("signed private links reject tampering, expired links and a different session",()=>{
  const {signFile,verifyFile}=load("src/lib/printing/file-links.ts");const expires=Date.now()+60000;const signature=signFile("file","customer",expires);
  assert.equal(verifyFile("file","customer",expires,signature),true);
  assert.equal(verifyFile("file","other",expires,signature),false);
  assert.equal(verifyFile("other","customer",expires,signature),false);
  assert.equal(verifyFile("file","customer",Date.now()-1,signature),false);
  assert.equal(verifyFile("file","customer",expires,"invalid"),false);
});
test("local repository serializes concurrent writes and fails closed in production",async()=>{
  const directory=mkdtempSync(path.join(process.cwd(),"tests",".printing-store-"));
  try{
    const processView={...process,env:{...process.env,NODE_ENV:"test"},cwd:()=>directory};
    const repository=load("src/lib/printing/repository.ts",{"../db":{isDbConfigured:()=>false},__process:processView});
    await Promise.all(Array.from({length:10},(_,i)=>repository.mutatePrinting(data=>data.audit.push({actor:"test",action:"concurrent",at:i,recordId:String(i)}))));
    const persisted=await repository.readPrinting();assert.equal(persisted.audit.length,10);assert.equal(new Set(persisted.audit.map(a=>a.recordId)).size,10);assert.ok(existsSync(path.join(directory,"data","printing.json")));
    await assert.rejects(repository.mutatePrinting(data=>{data.config.delivery=1;throw new Error("Rejected transaction");}));assert.equal((await repository.readPrinting()).config.delivery,12000);
    const production=load("src/lib/printing/repository.ts",{"../db":{isDbConfigured:()=>false},__process:{...processView,env:{NODE_ENV:"production"}}});
    await assert.rejects(production.mutatePrinting(()=>{}),/durable/);await assert.rejects(production.readPrinting(),/not configured/);
  }finally{const relative=path.relative(path.join(process.cwd(),"tests"),directory);assert.ok(relative.startsWith(".printing-store-")&&!relative.includes(".."));rmSync(directory,{recursive:true,force:true});}
});
test("service worker never caches private printing or admin navigations",async()=>{
  const handlers={};let writes=0;
  const cache={addAll:async()=>{},put:async()=>{writes++;}};
  runInNewContext(readFileSync("public/sw.js","utf8"),{URL,Response,fetch:async()=>new Response("private data"),caches:{open:async()=>cache,match:async()=>new Response("offline")},self:{location:{origin:"http://localhost"},addEventListener:(type,handler)=>{handlers[type]=handler;}}});
  for(const pathname of ["/printing/orders","/printing/quote/id","/admin","/print-orders","/account"]){let result;handlers.fetch({request:{method:"GET",url:`http://localhost${pathname}`,mode:"navigate"},respondWith:promise=>{result=promise;}});assert.equal(await (await result).text(),"private data");}
  assert.equal(writes,0);
});
test("service-worker upgrade preserves Study cache while removing private cached pages",async()=>{
  const stores=new Map([["bornolab-sw-v1",new Map([["http://localhost/study/chapters/example",new Response("study content")],["http://localhost/printing/quote/example",new Response("private quote")],["http://localhost/admin",new Response("private admin")]])]]);const handlers={};let work;
  const caches={keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async key=>{if(!stores.has(key))stores.set(key,new Map());const store=stores.get(key);return {keys:async()=>[...store.keys()].map(url=>({url})),match:async req=>store.get(req.url)?.clone(),put:async(req,res)=>{store.set(req.url,res);}};}};
  runInNewContext(readFileSync("public/sw.js","utf8"),{URL,Response,caches,fetch:async()=>new Response("network"),self:{location:{origin:"http://localhost"},clients:{claim:async()=>{}},addEventListener:(type,handler)=>{handlers[type]=handler;}}});handlers.activate({waitUntil:promise=>{work=promise;}});await work;
  assert.equal(stores.has("bornolab-sw-v1"),false);const current=stores.get("bornolab-sw-v2");assert.equal(await current.get("http://localhost/study/chapters/example").text(),"study content");assert.equal(current.has("http://localhost/printing/quote/example"),false);assert.equal(current.has("http://localhost/admin"),false);
});
test("printing SEO reuses existing overrides and supports image/canonical removal",async()=>{
  const {DEFAULT_CONFIG}=load("src/lib/site-config-shared.ts");const {resolvePageSeo}=load("src/lib/seo-pages.ts");
  const config=structuredClone(DEFAULT_CONFIG);config.seoPages={"/printing":{title:"Print at BornoLab",ogImage:"/logo.png",noindex:true},"/printing/business-cards":{title:"Custom cards",canonical:"/printing/business-cards",ogImage:"/printing/card.png"}};
  assert.equal(resolvePageSeo("/printing/flyers",config).noindex,true);assert.equal(resolvePageSeo("/printing/business-cards",config).title,"Custom cards");assert.equal(resolvePageSeo("/printing/business-cards",config).ogImage,"/printing/card.png");
  let stored={tools:{study:false},seoPages:config.seoPages};
  const site=load("src/lib/site-config.ts",{"./store":{readJson:async()=>structuredClone(stored),writeJson:async(_name,value)=>{stored=structuredClone(value);}},__process:{...process,env:{}}});
  await site.updateSiteConfig({seoPages:{"/printing":{title:"Revised printing"}}});assert.equal(stored.seoPages["/printing"].ogImage,undefined);assert.equal(stored.seoPages["/printing/business-cards"],undefined);assert.equal(stored.tools.study,false);
});
test("dashboard metrics reflect stored records and honest empty states",()=>{
  const data=seedPrinting();data.orders=[];data.quotes=[];data.partners=[];data.designers=[];const metrics=domain.dashboardMetrics(data,Date.UTC(2026,9,15));
  assert.equal(metrics.orders_today,0);assert.equal(metrics.revenue,domain.money(0));assert.equal(metrics.customers,0);assert.equal(metrics.cod_refusal,"Not yet measured");
});

class NextResponse extends Response { static json(value, init) { return new NextResponse(JSON.stringify(value), { ...init, headers: {"Content-Type":"application/json", ...init?.headers} }); } }
function harness() {
  let data=seedPrinting();data.orders=[];data.quotes=[];data.uploads=[];let member={id:"customer"};let admin=false;const audits=[];
  const overrides={
    "next/server":{NextResponse},
    "@/lib/guards":{requireMember:async()=>member},
    "@/app/api/admin/me/route":{requireAdmin:async()=>admin?"admin@example.invalid":NextResponse.json({error:"Unauthorized"},{status:401})},
    "../me/route":{requireAdmin:async()=>admin?"admin@example.invalid":NextResponse.json({error:"Unauthorized"},{status:401})},
    "@/lib/printing/repository":{readPrinting:async()=>structuredClone(data),mutatePrinting:async change=>{const next=structuredClone(data);const result=change(next);data=next;return result;}},
    "@/lib/notifications":{pushNotification:async()=>{}},"@/lib/users":{logAudit:async(...args)=>audits.push(args)},
  };
  const routes={orders:load("src/app/api/printing/orders/route.ts",overrides),uploads:load("src/app/api/printing/uploads/route.ts",overrides),quotes:load("src/app/api/printing/quotes/route.ts",overrides),support:load("src/app/api/printing/support/route.ts",overrides),notifications:load("src/app/api/printing/notifications/route.ts",overrides),admin:load("src/app/api/admin/printing/route.ts",overrides)};
  function request(body,method="POST",origin="http://localhost") {const req=new Request("http://localhost/api/test",{method,headers:{"Content-Type":"application/json",Origin:origin},body:JSON.stringify(body)});req.nextUrl=new URL(req.url);return req;}
  return {routes,request,get data(){return data;},get audits(){return audits;},setMember(value){member=value;},setAdmin(value){admin=value;}};
}
test("integration: auth, private artwork, submit, demo pay, proof, QC and shipment",async()=>{
  const h=harness();h.setMember(null);assert.equal((await h.routes.orders.GET()).status,401);assert.equal((await h.routes.admin.GET(h.request({},"POST"))).status,401);h.setMember({id:"customer"});
  assert.equal((await h.routes.orders.POST(h.request({},"POST","https://evil.invalid"))).status,403);
  const form=new FormData();form.append("serviceId","business-cards");form.append("rights","true");form.append("file",new File(["%PDF-1.7\n"],"art.pdf",{type:"application/pdf"}));
  const uploadReq=new Request("http://localhost/api/printing/uploads",{method:"POST",body:form});uploadReq.nextUrl=new URL(uploadReq.url);
  const ur=await h.routes.uploads.POST(uploadReq);assert.equal(ur.status,200);const {upload}=await ur.json();
  const signedRequest=new Request(`http://localhost/api/printing/uploads?id=${upload.id}&link=1`);signedRequest.nextUrl=new URL(signedRequest.url);const signed=await (await h.routes.uploads.GET(signedRequest)).json();const download=new Request(`http://localhost${signed.url}`);download.nextUrl=new URL(download.url);const fileResponse=await h.routes.uploads.GET(download);assert.equal(fileResponse.status,200);assert.equal(fileResponse.headers.get("cache-control"),"private, no-store");
  const r=await h.routes.orders.POST(h.request({serviceId:"business-cards",quantity:50,selections,uploadId:upload.id,address:{name:"Fictional Customer",phone:"01700000000",division:"Dhaka",district:"Dhaka",thana:"Sample thana",area:"Sample area",details:"Sample building"},method:"mock",submit:true,expectedTotal:52000}));assert.equal(r.status,200);const {order:o}=await r.json();
  assert.equal(o.state,"submitted");assert.equal(o.payment,"pending");
  assert.equal((await h.routes.orders.PATCH(h.request({id:o.id,action:"pay"},"PATCH"))).status,200);
  h.setMember({id:"intruder"});const get=new Request(`http://localhost/api/printing/uploads?id=${upload.id}`);get.nextUrl=new URL(get.url);assert.equal((await h.routes.uploads.GET(get)).status,404);
  h.setAdmin(true);h.setMember(null);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state:"artwork_review",reason:"File reviewed"},"PATCH"))).status,200);
  const pf=new FormData();pf.append("serviceId","business-cards");pf.append("rights","true");pf.append("file",new File(["%PDF-1.7\n"],"proof.pdf",{type:"application/pdf"}));const pr=new Request("http://localhost/api/test",{method:"POST",body:pf});pr.nextUrl=new URL(pr.url);const {upload:proof}=await (await h.routes.uploads.POST(pr)).json();
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"proof",uploadId:proof.id},"PATCH"))).status,200);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state:"queued",reason:"Queue"},"PATCH"))).status,400);
  h.setMember({id:"customer"});const proofId=h.data.orders[0].proofs[0].id;assert.equal((await h.routes.orders.PATCH(h.request({id:o.id,action:"changes",proofId,reason:"Revise sample text"},"PATCH"))).status,200);
  const revisedForm=new FormData();revisedForm.append("orderId",o.id);revisedForm.append("serviceId","business-cards");revisedForm.append("rights","true");revisedForm.append("file",new File(["%PDF-1.7\nrevision"],"revision.pdf",{type:"application/pdf"}));const revisedRequest=new Request("http://localhost/api/test",{method:"POST",body:revisedForm});revisedRequest.nextUrl=new URL(revisedRequest.url);const {upload:revised}=await (await h.routes.uploads.POST(revisedRequest)).json();
  assert.equal((await h.routes.orders.PATCH(h.request({id:o.id,action:"replace_artwork",uploadId:revised.id},"PATCH"))).status,200);assert.equal(h.data.orders[0].artworkRevision,2);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"proof",uploadId:proof.id},"PATCH"))).status,200);const currentProof=h.data.orders[0].proofs.at(-1);
  assert.equal((await h.routes.orders.PATCH(h.request({id:o.id,action:"approve",proofId},"PATCH"))).status,400);
  assert.equal((await h.routes.orders.PATCH(h.request({id:o.id,action:"approve",proofId:currentProof.id},"PATCH"))).status,200);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"assign",partnerId:"demo-partner-1"},"PATCH"))).status,200);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state:"queued",reason:"Queue"},"PATCH"))).status,200);
  for(const state of ["accepted","artwork_check","printing","finishing","quality_check"]){assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"job",state,reason:"Demo production job"},"PATCH"))).status,200);}
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"quality",passed:true,note:"Checked"},"PATCH"))).status,200);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state:"dispatched",reason:"Demo dispatch"},"PATCH"))).status,200);
  assert.equal(h.data.orders[0].shipment.provider,"mock");assert.ok(h.audits.length>0);
});
test("integration: catalog publication, quote offer and authenticated acceptance",async()=>{
  const h=harness();h.setAdmin(true);
  const catalog={categories:h.data.categories,services:h.data.services};catalog.services[0].published=false;
  assert.equal((await h.routes.admin.PATCH(h.request({action:"catalog",...catalog},"PATCH"))).status,200);assert.equal(h.data.services[0].published,false);
  const r=await h.routes.quotes.POST(h.request({categoryId:"custom",quantity:100,notes:"Fictional packaging request"}));assert.equal(r.status,200);const {quote}=await r.json();
  assert.equal((await h.routes.admin.PATCH(h.request({action:"quote",id:quote.id,lines:[{label:"Custom package",amount:100000}],days:5,expiresAt:Date.now()+86400000},"PATCH"))).status,200);
  assert.equal((await h.routes.quotes.PATCH(h.request({id:quote.id,state:"accepted",version:0},"PATCH"))).status,400);
  assert.equal((await h.routes.quotes.PATCH(h.request({id:quote.id,state:"accepted",version:1},"PATCH"))).status,200);
  assert.equal(h.data.quotes[0].state,"accepted");assert.ok(h.data.audit.some(a=>a.action==="quote.accepted"));
  const form=new FormData();form.append("serviceId","custom");form.append("rights","true");form.append("file",new File(["%PDF-1.7\n"],"art.pdf",{type:"application/pdf"}));const ureq=new Request("http://localhost/api/test",{method:"POST",body:form});ureq.nextUrl=new URL(ureq.url);
  h.setAdmin(false);const {upload}=await (await h.routes.uploads.POST(ureq)).json();
  const orderBody={serviceId:`quote-${quote.id}`,quoteId:quote.id,quantity:100,selections:{},uploadId:upload.id,address:{name:"Fictional Quote Customer",phone:"01700000000",division:"Dhaka",district:"Dhaka",thana:"Demo thana",area:"Demo area",details:"Fictional building"},method:"mock",submit:true,expectedTotal:100000};
  const conversion=await h.routes.orders.POST(h.request(orderBody));assert.equal(conversion.status,200);const {order:converted}=await conversion.json();assert.equal(converted.financial.total,100000);assert.equal(h.data.quotes[0].orderId,converted.id);
  assert.equal((await h.routes.orders.POST(h.request(orderBody))).status,400);
});
test("integration: COD confirmation, collection, refund reversal and private support",async()=>{
  const h=harness();h.setAdmin(true);const services=h.data.services;services[0].proofRequired=false;
  assert.equal((await h.routes.admin.PATCH(h.request({action:"catalog",categories:h.data.categories,services},"PATCH"))).status,200);
  const response=await h.routes.orders.POST(h.request({serviceId:"business-cards",quantity:50,selections,designHelp:"format",address:{name:"Demo Customer",phone:"01700000000",division:"Dhaka",district:"Dhaka",thana:"Demo thana",area:"Demo area",details:"Fictional building"},method:"cod",submit:true,expectedTotal:84000}));
  assert.equal(response.status,200);const {order:o}=await response.json();assert.equal(o.payment,"cod_confirmation");
  assert.equal(o.productionDays,4);assert.deepEqual(o.deliveryDays,{minimum:2,maximum:4});
  assert.equal((await h.routes.orders.PATCH(h.request({id:o.id,action:"template"},"PATCH"))).status,200);assert.equal(h.data.templates.length,1);
  assert.equal((await h.routes.orders.PATCH(h.request({id:o.id,action:"pay"},"PATCH"))).status,400);
  await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state:"artwork_review",reason:"Review"},"PATCH"));
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state:"queued",reason:"Queue"},"PATCH"))).status,400);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"cod"},"PATCH"))).status,200);assert.equal(h.data.orders[0].payment,"cod_confirmed");
  assert.equal(h.data.orders[0].paymentHistory.at(-1).from,"cod_confirmation");assert.equal(h.data.orders[0].paymentHistory.at(-1).actor,"admin@example.invalid");
  for(const state of ["queued","production","quality_check"])assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state,reason:"Demo progress"},"PATCH"))).status,200);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"quality",passed:true,note:"QC passed"},"PATCH"))).status,200);
  for(const state of ["dispatched","in_transit","delivered"])assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state,reason:"Demo shipment"},"PATCH"))).status,200);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"collect_cod"},"PATCH"))).status,200);
  assert.equal((await h.routes.orders.PATCH(h.request({id:o.id,action:"return",reason:"Demo return review"},"PATCH"))).status,200);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state:"refund_pending",reason:"Approved review"},"PATCH"))).status,200);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"adjustment",kind:"refund",amount:o.financial.total,reason:"Demo full refund"},"PATCH"))).status,200);
  assert.equal(h.data.orders[0].state,"refunded");assert.equal(h.data.orders[0].financial.total,o.financial.total);
  assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"adjustment",kind:"refund",amount:1,reason:"Duplicate"},"PATCH"))).status,400);
  const adjustment=h.data.orders[0].adjustments[0];assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"reversal",adjustmentId:adjustment.id,reason:"Correct demo bookkeeping"},"PATCH"))).status,200);assert.equal(h.data.orders[0].state,"refund_pending");
  const support=await h.routes.support.POST(h.request({orderId:o.id,message:"Help with my fictional demo order"}));assert.equal(support.status,200);const {ticket}=await support.json();
  assert.equal((await h.routes.admin.PATCH(h.request({id:ticket.id,action:"support",message:"Demo support reply",resolved:true},"PATCH"))).status,200);
  h.setMember({id:"intruder"});assert.deepEqual((await (await h.routes.support.GET()).json()).tickets,[]);
  h.setMember({id:"customer"});const visible=(await (await h.routes.orders.GET()).json()).orders[0];assert.equal(visible.adjustments,undefined);assert.equal(visible.internalNotes,undefined);
});
test("integration: quote questions, customer replies, expiry and notification ownership",async()=>{
  const h=harness();h.setAdmin(true);const {quote}=await (await h.routes.quotes.POST(h.request({categoryId:"custom",quantity:100}))).json();
  assert.equal((await h.routes.admin.PATCH(h.request({action:"quote_message",id:quote.id,message:"Which dimensions do you need?"},"PATCH"))).status,200);
  assert.equal((await h.routes.quotes.PATCH(h.request({id:quote.id,message:"Please use A4."},"PATCH"))).status,200);assert.equal(h.data.quotes[0].messages.length,2);
  assert.equal((await h.routes.admin.PATCH(h.request({action:"quote",id:quote.id,lines:[{label:"Printing",amount:100000}],days:3,expiresAt:Date.now()+86400000},"PATCH"))).status,200);
  const feed=await (await h.routes.notifications.GET()).json();assert.equal(feed.unread,2);assert.ok(feed.notifications.every(n=>n.title.startsWith("Demo")));const notificationId=feed.notifications[0].id;
  h.setMember({id:"intruder"});assert.equal((await (await h.routes.notifications.GET()).json()).notifications.length,0);await h.routes.notifications.PATCH(h.request({ids:[notificationId]},"PATCH"));
  h.setMember({id:"customer"});assert.equal((await (await h.routes.notifications.GET()).json()).unread,2);await h.routes.notifications.PATCH(h.request({all:true},"PATCH"));assert.equal((await (await h.routes.notifications.GET()).json()).unread,0);
  assert.equal((await h.routes.admin.PATCH(h.request({action:"quote_status",id:quote.id,state:"expired",reason:"Demo offer closed"},"PATCH"))).status,200);assert.equal(h.data.quotes[0].history.at(-1).from,"offered");
  assert.equal((await h.routes.quotes.PATCH(h.request({id:quote.id,state:"accepted",version:1},"PATCH"))).status,400);assert.equal((await h.routes.quotes.PATCH(h.request({id:quote.id,message:"Late reply"},"PATCH"))).status,400);
});
test("secondary notification/audit failures are recorded without exposing provider errors",async()=>{
  const records=[];const sideEffects=load("src/lib/printing/side-effects.ts",{"@/lib/notifications":{pushNotification:async()=>{throw new Error("private provider error");}},"@/lib/users":{logAudit:async()=>{throw new Error("private provider error");}},"@/lib/printing/repository":{mutatePrinting:async change=>change({audit:records})}});
  await sideEffects.notifyPrintingAdmin({type:"system",title:"Demo notification",detail:"PR-test"});await sideEffects.mirrorPrintingAudit("admin","printing.test","PR-test");assert.equal(records.length,2);assert.equal(records[0].action,"printing.notification_mirror_failed");assert.equal(records[1].action,"printing.audit_mirror_failed");assert.ok(!JSON.stringify(records).includes("private provider error"));
});
test("checkout rejects stale totals; failed demo payment blocks production and can be retried",async()=>{
  const h=harness();h.setAdmin(true);const services=h.data.services;services[0].proofRequired=false;await h.routes.admin.PATCH(h.request({action:"catalog",categories:h.data.categories,services},"PATCH"));
  const body={serviceId:"business-cards",quantity:50,selections,designHelp:"format",address:{name:"Demo Customer",phone:"01700000000",division:"Dhaka",district:"Dhaka",thana:"Demo thana",area:"Demo area",details:"Fictional building"},method:"mock",submit:true,expectedTotal:1};
  const conflict=await h.routes.orders.POST(h.request(body));assert.equal(conflict.status,409);assert.equal((await conflict.json()).code,"price_changed");assert.equal(h.data.orders.length,0);
  const response=await h.routes.orders.POST(h.request({...body,expectedTotal:82000}));assert.equal(response.status,200);const {order:o}=await response.json();
  assert.equal((await h.routes.admin.PATCH(h.request({action:"settings",config:{...h.data.config,mockPaymentFailure:true}},"PATCH"))).status,200);
  const failed=await h.routes.orders.PATCH(h.request({id:o.id,action:"pay"},"PATCH"));assert.equal((await failed.json()).order.payment,"payment_failed");
  await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state:"artwork_review",reason:"Reviewed"},"PATCH"));assert.equal((await h.routes.admin.PATCH(h.request({id:o.id,action:"state",state:"queued",reason:"Queue"},"PATCH"))).status,400);
  await h.routes.admin.PATCH(h.request({action:"settings",config:{...h.data.config,mockPaymentFailure:false}},"PATCH"));const retry=await h.routes.orders.PATCH(h.request({id:o.id,action:"pay"},"PATCH"));assert.equal((await retry.json()).order.payment,"demo_paid");assert.equal(h.data.orders[0].paymentHistory.at(-1).from,"payment_failed");
  assert.equal((await h.routes.admin.PATCH(h.request({action:"settings",config:{...h.data.config,liveNotifications:true}},"PATCH"))).status,400);assert.equal(h.data.config.liveNotifications,false);
});
