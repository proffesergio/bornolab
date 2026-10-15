"use client";
import Link from "next/link";
import {GlassCard,SectionTitle} from "@/components/ui";
import {button} from "@/components/printing/storefront";
export default function PrintingError({retry}:{error:Error&{digest?:string};retry:()=>void}){
  return <GlassCard><SectionTitle kicker="Printing Services" title="Printing is temporarily unavailable" desc="Please try again, or contact BornoLab for help with your request."/><div className="flex flex-wrap gap-3"><button className={button} onClick={retry}>Try again</button><Link className="glass rounded-full px-5 py-3 text-sm" href="/contact">Contact support</Link><Link className="glass rounded-full px-5 py-3 text-sm" href="/">BornoLab home</Link></div></GlassCard>;
}
