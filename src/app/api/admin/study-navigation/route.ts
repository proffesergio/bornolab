import {NextRequest,NextResponse} from "next/server";
import {requireAdmin} from "../me/route";
import {writeGuard} from "@/lib/printing/http";
import {readStudyNavigation,saveStudyNavigation} from "@/lib/study-navigation-store";
import {validateStudyNavigation} from "@/lib/study-navigation";
export async function GET(req:NextRequest){const actor=await requireAdmin(req);if(actor instanceof NextResponse)return actor;try{return NextResponse.json(await readStudyNavigation(),{headers:{"Cache-Control":"private, no-store"}});}catch{return NextResponse.json({error:"Learning settings are unavailable."},{status:503});}}
export async function PUT(req:NextRequest){
  const actor=await requireAdmin(req);if(actor instanceof NextResponse)return actor;const blocked=writeGuard(req,actor);if(blocked)return blocked;
  try{const body=await req.json();if(!Number.isSafeInteger(body.version)||body.version<0)throw new Error("Invalid settings version.");const navigation=validateStudyNavigation(body.navigation);return NextResponse.json(await saveStudyNavigation(navigation,body.version,actor));}
  catch(e){const message=e instanceof Error&&!('code' in e)?e.message:"Could not save learning settings.";return NextResponse.json({error:message},{status:400});}
}
