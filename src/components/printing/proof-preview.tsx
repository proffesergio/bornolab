"use client";
import {useEffect,useRef,useState} from "react";
import type {PDFDocumentProxy,PDFDocumentLoadingTask} from "pdfjs-dist";
export function ProofPreview({id}:{id:string}) {
  const canvas=useRef<HTMLCanvasElement>(null);const document=useRef<PDFDocumentProxy|null>(null);const active=useRef(true);
  const loading=useRef<PDFDocumentLoadingTask|null>(null);
  const [busy,setBusy]=useState(false);const [loaded,setLoaded]=useState(false);const [page,setPage]=useState(1);const [pages,setPages]=useState(0);const [error,setError]=useState("");
  useEffect(()=>{active.current=true;return()=>{active.current=false;void loading.current?.destroy();};},[]);
  async function renderPage(pdf:PDFDocumentProxy,index:number){const sheet=await pdf.getPage(index);const size=sheet.getViewport({scale:1});const viewport=sheet.getViewport({scale:Math.min(2,1000/size.width,1400/size.height)});const target=canvas.current;if(!target)return;target.width=viewport.width;target.height=viewport.height;await sheet.render({canvas:target,viewport}).promise;if(active.current){setPage(index);setLoaded(true);}}
  async function show(){setBusy(true);setError("");try{const signed=await fetch(`/api/printing/uploads?id=${encodeURIComponent(id)}&link=1`);const link=await signed.json();if(!signed.ok)throw new Error(link.error);const response=await fetch(link.url);if(!response.ok)throw new Error("Could not load this proof. Request a fresh file link.");const blob=await response.blob();
    if(blob.type==="application/pdf"){
      const pdfjs=await import("pdfjs-dist");pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
      await loading.current?.destroy();
      const task=pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer()),maxImageSize:50_000_000,canvasMaxAreaInBytes:16_000_000,stopAtErrors:true});loading.current=task;const pdf=await task.promise;
      if(!active.current){await task.destroy();return;}document.current=pdf;setPages(pdf.numPages);await renderPage(pdf,1);
    }else{
      const image=await createImageBitmap(blob);const target=canvas.current;if(target){const scale=Math.min(1,1000/image.width,1400/image.height);target.width=image.width*scale;target.height=image.height*scale;target.getContext("2d")?.drawImage(image,0,0,target.width,target.height);}image.close();if(active.current){setLoaded(true);setPages(1);}
    }
  }catch(e){if(active.current)setError(e instanceof Error?e.message:"Preview is unavailable. Download the proof to review it.");}finally{if(active.current)setBusy(false);}}
  async function change(index:number){if(!document.current)return;setBusy(true);setError("");try{await renderPage(document.current,index);}catch{setError("This page could not be rendered. Download the proof for review.");}finally{setBusy(false);}}
  return <div className="mt-3"><button className="glass rounded-full px-4 py-2 text-sm" disabled={busy} onClick={show}>{busy?"Preparing private preview…":loaded?"Reload proof preview":"Preview this proof"}</button><p role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-300">{error}</p><canvas ref={canvas} hidden={!loaded} aria-label={`Proof preview, page ${page}`} className="mt-3 max-h-[70vh] w-full rounded-xl bg-white object-contain"/>{loaded&&<p className="mt-2 text-xs text-slate-500">Preview only: screens cannot confirm exact print colour or resolution. Check every page before approval.</p>}{pages>1&&<div className="mt-3 flex items-center gap-3 text-sm"><button className="glass rounded-full px-4 py-2" disabled={busy||page<=1} onClick={()=>change(page-1)}>Previous page</button><span>{page} / {pages}</span><button className="glass rounded-full px-4 py-2" disabled={busy||page>=pages} onClick={()=>change(page+1)}>Next page</button></div>}</div>;
}
