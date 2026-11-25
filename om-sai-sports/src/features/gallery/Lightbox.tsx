import {useEffect} from "react";
import {AnimatePresence,motion} from "framer-motion";
import {X,ChevronLeft,ChevronRight,ExternalLink,Copy} from "lucide-react";
import type {Design} from "../../types";
export default function Lightbox({designs,index,onClose,onMove}:{designs:Design[];index:number|null;onClose:()=>void;onMove:(n:number)=>void}){
 const d=index===null?null:designs[index];
 useEffect(()=>{if(!d)return;const f=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();if(e.key==="ArrowRight")onMove((index!+1)%designs.length);if(e.key==="ArrowLeft")onMove((index!-1+designs.length)%designs.length)};window.addEventListener("keydown",f);document.body.style.overflow="hidden";return()=>{window.removeEventListener("keydown",f);document.body.style.overflow=""}},[d,index,designs.length,onClose,onMove]);
 const wa=`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER||"919999999999"}?text=${encodeURIComponent(`Hi, I liked design ${d?.id} - ${d?.title} on your website. I’d like to know more.`)}`;
 return <AnimatePresence>{d&&<motion.div className="lightbox" role="dialog" aria-modal="true" aria-label={`${d.title} design preview`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
  <button className="lightbox-close" onClick={onClose} aria-label="Close" data-cursor="CLOSE"><X/></button>
  <button className="lightbox-arrow prev" onClick={e=>{e.stopPropagation();onMove((index!-1+designs.length)%designs.length)}} aria-label="Previous" data-cursor="PREVIOUS"><ChevronLeft/></button>
  <motion.div className="lightbox-content" initial={{y:20,scale:.98}} animate={{y:0,scale:1}} onClick={e=>e.stopPropagation()}>
   <img src={d.imageUrl} alt={d.alt||d.title}/>
   <div className="lightbox-info"><span className="lightbox-meta">{d.category} / {d.id}</span><h2>{d.title}</h2><p>{d.description}</p>
    <div className="lightbox-actions"><a className="button button-orange" data-cursor="ENQUIRE" href={wa} target="_blank" rel="noreferrer">I like this design <ExternalLink size={16}/></a><button className="button button-outline" data-cursor="COPY LINK" onClick={()=>navigator.clipboard.writeText(`${location.origin}/design/${d.id}`).catch(()=>{})}><Copy size={15}/> Copy link</button></div>
   </div>
  </motion.div>
  <button className="lightbox-arrow next" onClick={e=>{e.stopPropagation();onMove((index!+1)%designs.length)}} aria-label="Next" data-cursor="NEXT"><ChevronRight/></button>
 </motion.div>}</AnimatePresence>
}