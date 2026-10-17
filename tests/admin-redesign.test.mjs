import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {load} from './load-ts.mjs';
const require=createRequire(import.meta.url),sharp=require('sharp');
const navigation=load('src/lib/study-navigation.ts');
const catalog=load('src/lib/study-platform/catalog.ts');
const materials=load('src/lib/study-data.ts');
test('learning paths exclude hidden goals, unrelated subjects and hidden chapters without changing IDs',()=>{
 const nav=structuredClone(navigation.DEFAULT_STUDY_NAVIGATION),chapters=catalog.getChapters();const goal=nav.goals[0],subject=nav.subjects.find(s=>chapters.some(c=>c.subjectId===s.id));goal.subjectIds=[subject.id];const hidden=chapters.find(c=>c.subjectId===subject.id);nav.chapterOverrides[hidden.id]={title:'Custom title',enabled:false};
 let result=navigation.resolveStudyPath(nav,goal.id,subject.id,chapters);assert.equal(result.goal.id,goal.id);assert.ok(result.chapters.length>0);assert.ok(result.chapters.every(c=>c.subjectId===subject.id&&c.id!==hidden.id));
 nav.subjects.find(s=>s.id===subject.id).enabled=false;result=navigation.resolveStudyPath(nav,goal.id,subject.id,chapters);assert.equal(result.subject,undefined);assert.equal(result.chapters.length,0);
 goal.enabled=false;result=navigation.resolveStudyPath(nav,goal.id,subject.id,chapters);assert.equal(result.goal,undefined);assert.equal(result.subjects.length,0);
});
test('learning configuration rejects unknown relationships and duplicate identities',()=>{
 const nav=structuredClone(navigation.DEFAULT_STUDY_NAVIGATION);assert.deepEqual(navigation.validateStudyNavigation(nav),nav);nav.goals[0].subjectIds=['does-not-exist'];assert.throws(()=>navigation.validateStudyNavigation(nav),/existing subjects/);nav.goals[0].subjectIds=[];nav.goals.push({...nav.goals[0]});assert.throws(()=>navigation.validateStudyNavigation(nav),/unique IDs/);
});
test('Masters reference resources remain scoped to the Masters learning goal',()=>{
 const nav=navigation.DEFAULT_STUDY_NAVIGATION,source=materials.BUILT_IN_STUDY_MATERIALS;assert.ok(source.length>0);assert.equal(navigation.goalMaterials(source,undefined).length,0);assert.equal(navigation.goalMaterials(source,nav.goals.find(g=>g.id==='it-jobs')).length,0);assert.equal(navigation.goalMaterials(source,nav.goals.find(g=>g.id==='masters')).length,source.length);
});
test('selected printing designs are validated against the current service and snapshot their descriptions',()=>{
 const domain=load('src/lib/printing/domain.ts');const service=load('src/lib/printing/seed.ts').seedPrinting().services[0];service.designSelection=true;service.gallery=['/api/media/a'];service.galleryAlt={'/api/media/a':'Blue business card'};const snapshot=domain.selectPrintDesign(service,'/api/media/a');service.galleryAlt['/api/media/a']='Changed';assert.equal(snapshot.label,'Blue business card');assert.equal(domain.selectPrintDesign(service,''),undefined);assert.throws(()=>domain.selectPrintDesign(service,'https://attacker.invalid/file'));service.designSelection=false;assert.throws(()=>domain.selectPrintDesign(service,'/api/media/a'));
});
test('media upload → draft privacy → publication → reusable references, with real decoding and persistence',async()=>{
 const temporary=mkdtempSync(path.join(os.tmpdir(),'bornolab-media-'));let authenticated=true;const db={isDbConfigured:()=>false};const processOverride={...process,env:{...process.env,NODE_ENV:'test'},cwd:()=>temporary};
 const repo=load('src/lib/media-repository.ts',{'./db':db,__process:processOverride});const NextResponse=require('next/server').NextResponse;
 const guard=async()=>authenticated?'admin@example.invalid':NextResponse.json({error:'Unauthorized'},{status:401});
 const printing={categories:[],services:[]};const api=load('src/app/api/admin/showcase-media/route.ts',{'../me/route':{requireAdmin:guard},'@/lib/media-repository':repo,'@/lib/printing/repository':{readPrinting:async()=>printing}});
 const publicApi=load('src/app/api/media/[id]/route.ts',{'@/lib/media-repository':repo,'@/app/api/admin/me/route':{requireAdmin:guard}});
 function request(body,method='POST',origin='http://localhost'){const r=new Request('http://localhost/api/admin/showcase-media',{method,headers:{Origin:origin,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body instanceof FormData?body:JSON.stringify(body)});r.nextUrl=new URL(r.url);return r;}
 const metadata={title:'Category mockup',alt:'Blue design on a business card',tags:['card'],categoryIds:['cards'],serviceIds:[],published:false,archived:false};
 try{
   authenticated=false;assert.equal((await api.POST(request({}))).status,401);authenticated=true;assert.equal((await api.POST(request({},'POST','https://evil.invalid'))).status,403);
   let form=new FormData();form.append('file',new File(['not an image'],'mockup.png',{type:'image/png'}));form.append('metadata',JSON.stringify(metadata));assert.equal((await api.POST(request(form))).status,400);
   form=new FormData();const image=await sharp({create:{width:40,height:30,channels:3,background:'#227799'}}).png().toBuffer();form.append('file',new File([image],'mockup.png',{type:'image/png'}));form.append('metadata',JSON.stringify(metadata));const uploaded=await api.POST(request(form));assert.equal(uploaded.status,201);const {asset}=await uploaded.json();assert.equal(asset.mime,'image/webp');assert.ok(asset.bytes>0);assert.equal((await repo.readMediaIndex()).assets.length,1);
   const binaryRequest=new Request('http://localhost'+asset.url);binaryRequest.nextUrl=new URL(binaryRequest.url);authenticated=false;assert.equal((await publicApi.GET(binaryRequest,{params:Promise.resolve({id:asset.id})})).status,404);authenticated=true;const draft=await publicApi.GET(binaryRequest,{params:Promise.resolve({id:asset.id})});assert.equal(draft.status,200);assert.match(draft.headers.get('cache-control'),/no-store/);
   const publish=await api.PATCH(request({...metadata,id:asset.id,published:true},'PATCH'));assert.equal(publish.status,200);authenticated=false;const publicImage=await publicApi.GET(binaryRequest,{params:Promise.resolve({id:asset.id})});assert.equal(publicImage.status,200);assert.equal(publicImage.headers.get('content-type'),'image/webp');assert.equal((await sharp(Buffer.from(await publicImage.arrayBuffer())).metadata()).width,40);
   authenticated=true;printing.services=[{id:'cards',name:{en:'Cards'},image:asset.url}];const listing=await (await api.GET(request({}))).json();assert.deepEqual(listing.usage[asset.id],['Service: cards']);assert.ok(!JSON.stringify(listing).includes('content"'));assert.equal((await api.PATCH(request({...metadata,id:asset.id,published:false},'PATCH'))).status,400);
   const archive=await api.PATCH(request({...metadata,id:asset.id,published:true,archived:true},'PATCH'));assert.equal(archive.status,200);assert.equal((await repo.readMediaIndex()).assets.length,1);assert.equal((await repo.readMediaIndex()).audit.length,3);
 }finally{rmSync(temporary,{recursive:true,force:true});}
});
test('media repository serializes local writes and rejects ephemeral production storage',async()=>{
 const temporary=mkdtempSync(path.join(os.tmpdir(),'bornolab-media-'));const env={...process,env:{NODE_ENV:'test'},cwd:()=>temporary};const repo=load('src/lib/media-repository.ts',{'./db':{isDbConfigured:()=>false},__process:env});
 const base={title:'A',alt:'A',tags:[],categoryIds:[],serviceIds:[],published:false,archived:false,mime:'image/webp',bytes:10,width:1,height:1,createdAt:1,updatedAt:1};
 try{await Promise.all(Array.from({length:5},(_,i)=>repo.writeMedia({...base,id:String(i),url:'/api/media/'+i},'admin','a')));assert.equal((await repo.readMediaIndex()).assets.length,5);env.env.NODE_ENV='production';await assert.rejects(()=>repo.readMediaIndex(),/PostgreSQL/);await assert.rejects(()=>repo.writeMedia({...base,id:'prod'},'admin','a'),/PostgreSQL/);}finally{rmSync(temporary,{recursive:true,force:true});}
});
