"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Download,FileText,Share2,Check,Search} from "lucide-react";
import {useLogin} from "./use-login";
import {STUDY_CATEGORIES,isBuetOnlyMaterial,type StudyMaterial,type StudyCategory} from "@/lib/study-data";
import {adminInput} from "./admin/workspace";
import {goalMaterials,type StudyGoal} from "@/lib/study-navigation";
export function StudyResourceLibrary({materials,goal}:{materials:StudyMaterial[];goal?:StudyGoal}){
 const router=useRouter();const {loggedIn,refresh}=useLogin();const [cat,setCat]=useState<"all"|StudyCategory>(goal?.categories[0]??"all");const [q,setQ]=useState("");const [subject,setSubject]=useState("");const [dlBusy,setDlBusy]=useState<string|null>(null);const [dlError,setDlError]=useState<string|null>(null);const [copied,setCopied]=useState<string|null>(null);
 const showBuet=cat==="masters"||Boolean(goal?.categories.includes("masters"));
 const pool=goal?goalMaterials(materials,goal):materials;
 const list=pool.filter(m=>(cat==="all"||m.category===cat)&&(!subject||m.subject===subject)&&(showBuet||!isBuetOnlyMaterial(m))&&
  (m.title+" "+m.description+" "+(m.subject??"")).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)));
  const download = async (m: StudyMaterial) => {
    setDlError(null);
    // Recheck at click time: never bounce a signed-in user to /login
    // just because the initial session check was slow or failed once.
    const ok = loggedIn === true || (loggedIn === null && (await refresh()));
    if (!ok) {
      router.push(`/login?next=${encodeURIComponent(`/study/${m.id}`)}`);
      return;
    }
    setDlBusy(m.id);
    try {
      const res = await fetch(`/api/study/download?id=${encodeURIComponent(m.id)}`);
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/study/${m.id}`)}`);
        return;
      }
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Download failed (${res.status})`);
      const blob = await res.blob();
      const ext = m.fileType === "link" ? "pdf" : m.fileType;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${m.title.replace(/["\r\n/\\]/g, "").slice(0, 80)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) {
      setDlError((e as Error).message);
    } finally {
      setDlBusy(null);
    }
  };

  const share = async (m: StudyMaterial) => {
    const url = `${window.location.origin}/study/${m.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(m.id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      window.prompt("Copy this link to share:", url);
    }
  };


 return <section><div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px_200px]"><label className="relative"><Search size={16} className="absolute left-3 top-3"/><input className={adminInput+" pl-9"} aria-label="Search study resources" placeholder="Search resources…" value={q} onChange={e=>setQ(e.target.value)}/></label><select className={adminInput} aria-label="Resource category" value={cat} onChange={e=>setCat(e.target.value as typeof cat)}><option value="all">All levels</option>{STUDY_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select><select className={adminInput} aria-label="Resource subject" value={subject} onChange={e=>setSubject(e.target.value)}><option value="">All subjects</option>{[...new Set(pool.map(m=>m.subject).filter(Boolean))].map(s=><option key={s}>{s}</option>)}</select></div>
 <p role="status" className="mb-4 text-sm text-slate-500">{list.length} resources{!showBuet?" · BUET PG guides are under Masters":""}</p>
 <div className="grid gap-4 sm:grid-cols-2">{list.map(m=><article key={m.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><FileText size={22} className="text-cyan-700 dark:text-cyan-300"/><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs dark:bg-slate-800">{m.access==="paid"?"৳"+(m.priceBDT??0):"Free"}</span></div><h3 className="mt-4 font-bold">{m.title}</h3>{m.featured&&<span className="mt-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">Featured resource</span>}<p className="mt-1 text-xs text-slate-500">{m.subject??STUDY_CATEGORIES.find(c=>c.id===m.category)?.label}{m.subcategory?" · "+m.subcategory:""}</p><p className="mt-3 flex-1 text-sm text-slate-600 dark:text-slate-400">{m.description}</p><div className="mt-5 flex flex-wrap gap-2"><Link href={"/study/"+m.id} className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">{m.access==="paid"?"Preview":"Read resource"}</Link>{m.access!=="paid"&&m.fileType==="pdf"&&<button disabled={dlBusy===m.id} onClick={()=>void download(m)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"><Download size={15}/>{dlBusy===m.id?"Preparing…":"Download"}</button>}<button aria-label={"Share "+m.title} onClick={()=>void share(m)} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">{copied===m.id?<Check size={15}/>:<Share2 size={15}/>}</button></div></article>)}</div>
 {!list.length&&<div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">No resources match this view. Try another goal, level or search.</div>}{dlError&&<p role="alert" className="mt-4 text-sm text-red-600">{dlError}</p>}</section>;
}
