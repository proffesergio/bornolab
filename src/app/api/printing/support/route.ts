import {NextRequest,NextResponse} from "next/server";
import {requireMember} from "@/lib/guards";
import {readPrinting,mutatePrinting} from "@/lib/printing/repository";
import {failure,text,writeGuard} from "@/lib/printing/http";
import {notifyPrintingAdmin} from "@/lib/printing/side-effects";
export async function GET(){const user=await requireMember();if(!user)return NextResponse.json({error:"Login required."},{status:401});try{return NextResponse.json({tickets:(await readPrinting()).tickets.filter(t=>t.userId===user.id)},{headers:{"Cache-Control":"no-store"}});}catch(error){return failure(error);}}
export async function POST(req:NextRequest){
  const user=await requireMember();if(!user)return NextResponse.json({error:"Login required."},{status:401});const blocked=writeGuard(req,user.id);if(blocked)return blocked;
  try{const body=await req.json() as Record<string,unknown>;const orderId=text(body.orderId,100);const message=text(body.message,1000);if(!message)throw new Error("Tell us how we can help.");const ticket=await mutatePrinting(data=>{if(!data.config.enabled||!data.orders.some(o=>o.id===orderId&&o.userId===user.id))throw new Error("Order not found.");let ticket=data.tickets.find(t=>t.orderId===orderId&&t.userId===user.id&&t.state==="open");if(!ticket){ticket={id:crypto.randomUUID(),orderId,userId:user.id,state:"open",createdAt:Date.now(),messages:[]};data.tickets.push(ticket);}ticket.messages.push({actor:user.id,at:Date.now(),message});data.audit.push({actor:user.id,action:"support.requested",at:Date.now(),recordId:orderId});return ticket;});await notifyPrintingAdmin({type:"system",title:"Printing support requested",detail:orderId,userId:user.id});return NextResponse.json({ticket});}catch(error){return failure(error);}
}
