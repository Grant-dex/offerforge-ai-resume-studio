import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:ReactNode}) {
  const titleId=useId();
  const panel=useRef<HTMLDivElement>(null);
  const closeRef=useRef(onClose);
  closeRef.current=onClose;
  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement as HTMLElement|null;
    const focusable=()=>Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')??[]).filter(el=>el.getClientRects().length>0);
    focusable()[0]?.focus();
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.stopPropagation();closeRef.current();}if(event.key==='Tab'){const elements=focusable();const first=elements[0],last=elements[elements.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};
    const current=panel.current;
    current?.addEventListener('keydown',onKey);
    return ()=>{current?.removeEventListener('keydown',onKey);previous?.focus();};
  },[open]);
  if(!open)return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30" onClick={onClose}/><div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative flex max-h-[85dvh] w-full max-w-lg flex-col rounded-xl bg-white p-5 shadow-xl"><div className="mb-4 flex shrink-0 items-center justify-between gap-3"><h2 id={titleId} className="text-lg font-semibold text-neutral-800">{title}</h2><button onClick={onClose} aria-label="关闭弹窗" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"><X size={18}/></button></div><div className="min-h-0 flex-1 overflow-y-auto">{children}</div></div></div>;
}
