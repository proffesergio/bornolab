import { readPrinting } from "@/lib/printing/repository";
import { PrintQuotes } from "@/components/printing/quotes";
import { notFound,redirect } from "next/navigation";
import {requireMember} from "@/lib/guards";
export const dynamic="force-dynamic";
export const metadata={title:"Printing Quotes | BornoLab",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{category?:string}>}){const query=await searchParams;const user=await requireMember();if(!user){const next=query.category?`/printing/quote?category=${encodeURIComponent(query.category.slice(0,100))}`:"/printing/quote";redirect(`/login?next=${encodeURIComponent(next)}`);}const data=await readPrinting();if(!data.config.enabled||!data.config.quotes)notFound();return <PrintQuotes initialCategory={typeof query.category==="string"?query.category:undefined} categories={data.categories.filter(c=>!c.hidden&&!c.archived).sort((a,b)=>a.position-b.position)}/>;}
