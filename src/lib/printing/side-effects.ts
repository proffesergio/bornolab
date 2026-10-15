import {pushNotification} from "@/lib/notifications";
import {logAudit} from "@/lib/users";
import {mutatePrinting} from "@/lib/printing/repository";
async function recordMirrorFailure(recordId:string,kind:string){
  await mutatePrinting(data=>{data.audit.push({actor:"system",action:`printing.${kind}_mirror_failed`,at:Date.now(),recordId});});
}
/** The primary printing record/audit is already committed. Record secondary feed failures explicitly. */
export async function notifyPrintingAdmin(input:Parameters<typeof pushNotification>[0]):Promise<void>{
  try{await pushNotification({...input,title:input.title.startsWith("Demo")?input.title:`Demo · ${input.title}`});}catch{await recordMirrorFailure(input.detail??"printing","notification");}
}
export async function mirrorPrintingAudit(actor:string,action:string,recordId:string):Promise<void>{
  try{await logAudit(actor,action,recordId);}catch{await recordMirrorFailure(recordId,"audit");}
}
