import { NextResponse } from "next/server";
import { readPrinting } from "@/lib/printing/repository";
export async function GET(){const data=await readPrinting().catch(()=>null);return NextResponse.json({enabled:data?.config.enabled??false});}
