import { PrintingStorefront } from "@/components/printing/storefront";
import { readPrinting } from "@/lib/printing/repository";
import { SectionTitle } from "@/components/ui";
import {getSiteConfig} from "@/lib/site-config";
import type {Metadata} from "next";
export const dynamic = "force-dynamic";
export async function generateMetadata():Promise<Metadata>{const config=await getSiteConfig();const override=config.seoPages?.["/printing"];const title=override?.title||"Printing Services | BornoLab";const description=override?.description||"Customize business cards, gifts, academic printing and packaging with BornoLab.";const canonical=override?.canonical||"/printing";const image=override?.ogImage||"/logo.png";return {title,description,alternates:{canonical},openGraph:{title,description,url:canonical,type:"website",siteName:"BornoLab",locale:"bn_BD",images:[image]},twitter:{card:"summary_large_image",title,description,images:[image]},robots:override?.noindex?{index:false,follow:false}:undefined};}
export default async function Page() {
  const data = await readPrinting().catch(() => null);
  if (!data) return <SectionTitle kicker="BornoLab" title="Printing Services is being prepared" desc="Please contact us for assistance. Printing storage is not yet available."/>;
  return <PrintingStorefront config={data.config} categories={data.categories} services={data.services}/>;
}
