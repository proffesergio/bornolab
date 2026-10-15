"use client";
import {useEffect,useState} from "react";
export function usePrintingEnabled(){const [enabled,setEnabled]=useState(false);useEffect(()=>{let alive=true;function refresh(){fetch("/api/printing/flags").then(r=>r.json()).then(j=>{if(alive)setEnabled(j.enabled===true);}).catch(()=>{if(alive)setEnabled(false);});}refresh();window.addEventListener("printing-config-changed",refresh);return()=>{alive=false;window.removeEventListener("printing-config-changed",refresh);};},[]);return enabled;}
