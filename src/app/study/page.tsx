import {Suspense} from "react";
import {StudyHub} from "@/components/study-hub";
export default function StudyPage(){return <Suspense fallback={<p role="status" className="py-10 text-sm text-slate-500">Loading Study Hub…</p>}><StudyHub/></Suspense>;}
