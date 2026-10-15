import { requireMember } from "@/lib/guards";
import { redirect,notFound } from "next/navigation";
import { readPrinting } from "@/lib/printing/repository";
import { quoteService,quoteValid } from "@/lib/printing/domain";
import { PrintConfigurator } from "@/components/printing/configurator";
export const metadata={title:"Accepted Printing Quote | BornoLab",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params;const user=await requireMember();if(!user)redirect(`/login?next=/printing/quote/${id}`);const data=await readPrinting();const quote=data.quotes.find(q=>q.id===id&&q.userId===user.id&&q.state==="accepted"&&!q.orderId&&q.expiresAt&&quoteValid(q));const template=data.services.find(s=>s.categoryId===quote?.categoryId);if(!quote||!template||!data.config.enabled)notFound();return <PrintConfigurator service={quoteService(quote,template)} config={{...data.config,deliveryMinDays:quote.deliveryDays?.minimum??data.config.deliveryMinDays,deliveryMaxDays:quote.deliveryDays?.maximum??data.config.deliveryMaxDays,cod:false,designHelp:false}} quote={{id:quote.id,uploadId:quote.uploadId,total:quote.lines.reduce((sum,l)=>sum+l.amount,0),lines:quote.lines}}/>; }
