"use client";
import {useState} from "react";
export function PrivateFileLink({id,children}:{id:string;children:React.ReactNode}) {
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  async function open(){setBusy(true);setError("");try{const r=await fetch(`/api/printing/uploads?id=${encodeURIComponent(id)}&link=1`);const j=await r.json();if(!r.ok)throw new Error(j.error);const a=document.createElement("a");a.href=j.url;a.rel="noreferrer";a.click();}catch(e){setError(e instanceof Error?e.message:"Could not open private file.");}finally{setBusy(false);}}
  return <span><button className="text-sm underline disabled:opacity-50" disabled={busy} onClick={open}>{busy?"Preparing file…":children}</button>{error&&<span role="alert" className="ml-2 text-xs text-red-500">{error}</span>}</span>;
}
