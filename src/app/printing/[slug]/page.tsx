import { notFound } from "next/navigation";
import { readPrinting } from "@/lib/printing/repository";
import { PrintConfigurator } from "@/components/printing/configurator";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {GlassCard} from "@/components/ui";
import {getSiteConfig} from "@/lib/site-config";
import {resolvePageSeo} from "@/lib/seo-pages";
export const dynamic = "force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
  const {slug}=await params;const [data,config]=await Promise.all([readPrinting(),getSiteConfig()]); const service=data.services.find(s=>s.id===slug && s.published);const override=config.seoPages?.[`/printing/${slug}`];const resolved=resolvePageSeo(`/printing/${slug}`,config);
  const title=override?.title||(service?`${service.name.en} | BornoLab Printing`:"Printing | BornoLab");const description=override?.description||service?.description.en;const canonical=override?.canonical||`/printing/${slug}`;const image=resolved.ogImage||"/logo.png";
  return {title,description,alternates:{canonical},openGraph:{title,description,url:canonical,type:"website",siteName:"BornoLab",locale:"bn_BD",images:[image]},twitter:{card:"summary_large_image",title,description,images:[image]},robots:resolved.noindex?{index:false,follow:false}:undefined};
}
export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const data=await readPrinting(); const service=data.services.find(s=>s.id===slug&&s.published&&data.categories.some(c=>c.id===s.categoryId&&!c.hidden&&!c.archived));if(!service||!data.config.enabled)notFound();
  const related=data.services.filter(s=>s.published&&s.id!==service.id&&data.categories.some(c=>c.id===s.categoryId&&!c.hidden&&!c.archived)).sort((a,b)=>Number(b.categoryId===service.categoryId)-Number(a.categoryId===service.categoryId)).slice(0,3);
  return <div><PrintConfigurator service={service} config={data.config}/>{Boolean(service.gallery?.length)&&<section className="mt-8"><h2 className="mb-4 text-xl font-bold">Gallery & mockups</h2><div className="grid gap-3 sm:grid-cols-2">{service.gallery?.map((image,i)=><Image key={image+i} src={image} width={800} height={520} alt={`${service.name.en} gallery image ${i+1}`} className="w-full rounded-xl"/>)}</div></section>}
    <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Questions about this service</h2>{service.faq?.map((item,i)=><details key={i} className="glass mb-3 rounded-xl p-4"><summary className="cursor-pointer font-semibold">{item.question.en}</summary><p className="mt-3 text-sm text-slate-500">{item.answer.en}</p></details>)}<p className="mt-3 text-sm text-slate-500">{service.policy.en}</p></section>
    <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Related printing services</h2><div className="grid gap-3 sm:grid-cols-3">{related.map(s=><GlassCard key={s.id}><h3 className="font-bold">{s.name.en}</h3><p className="my-3 text-xs text-slate-500">Typically {s.days} production days · customizable</p><Link className="text-sm text-cyan-700 underline dark:text-cyan-300" href={`/printing/${s.id}`}>Explore service →</Link></GlassCard>)}</div></section>
  </div>;
}
