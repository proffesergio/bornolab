"use client";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";
export const adminInput = "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
export const adminButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800";
export const adminPrimary = `${adminButton} border-transparent bg-cyan-700 text-white hover:bg-cyan-800 dark:border-transparent dark:hover:bg-cyan-800`;
function subscribe(callback:()=>void) { window.addEventListener("popstate",callback); window.addEventListener("admin-location",callback); return () => {window.removeEventListener("popstate",callback);window.removeEventListener("admin-location",callback);}; }
export function useAdminQuery() { return new URLSearchParams(useSyncExternalStore(subscribe,()=>window.location.search,()=>"")); }
export function navigateAdmin(section:string, view?:string) {
  if (!window.dispatchEvent(new Event("admin-before-navigate",{cancelable:true}))) return;
  const query = new URLSearchParams({section}); if(view)query.set("view",view);
  window.history.pushState(null,"",`/admin?${query}`); window.dispatchEvent(new Event("admin-location"));
}
/** Record changes stay inside the catalog draft; leaving the workspace invokes the dirty guard. */
export function setAdminRecord(record:string) {
  const query=new URLSearchParams(window.location.search);if(record)query.set("record",record);else query.delete("record");
  window.history.pushState(null,"",`/admin?${query}`);window.dispatchEvent(new Event("admin-location"));
}
export function useUnsavedChanges(dirty:boolean) {
  useEffect(()=>{
    if(!dirty)return;
    const unload=(e:BeforeUnloadEvent)=>{e.preventDefault();};
    const navigate=(e:Event)=>{if(!window.confirm("Discard unsaved changes?"))e.preventDefault();};
    window.addEventListener("beforeunload",unload);window.addEventListener("admin-before-navigate",navigate);
    return ()=>{window.removeEventListener("beforeunload",unload);window.removeEventListener("admin-before-navigate",navigate);};
  },[dirty]);
}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}) { return <label className="block min-w-0 text-sm font-medium"><span className="mb-1.5 block">{label}</span>{children}{hint&&<span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">{hint}</span>}</label>; }
export function WorkspaceTabs({items,current,onChange,label}:{items:{id:string;label:string}[];current:string;onChange:(id:string)=>void;label:string}) {
  return <nav aria-label={label} className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 pb-3 dark:border-slate-700">{items.map(item=><button type="button" key={item.id} aria-current={current===item.id?"page":undefined} onClick={()=>onChange(item.id)} className={cn("rounded-xl px-3 py-2 text-sm font-semibold",current===item.id?"bg-cyan-700 text-white":"text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")}>{item.label}</button>)}</nav>;
}
export function WorkspaceHeading({title,description,children}:{title:string;description:string;children?:ReactNode}) {return <div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold tracking-tight">{title}</h2><p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p></div><div className="flex flex-wrap gap-2">{children}</div></div>;}
