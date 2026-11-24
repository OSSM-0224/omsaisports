import {useMemo,useState} from "react";
import {Search,ArrowUpRight} from "lucide-react";
import type {Design} from "../../types";
import Reveal from "../../components/Reveal";
import Lightbox from "./Lightbox";
const filters=["All","School","College","Club","Cricket","Football","Kabaddi","Running","Custom"];
export default function Gallery({designs}:{designs:Design[]}){
 const [filter,setFilter]=useState("All"),[query,setQuery]=useState(""),[index,setIndex]=useState<number|null>(null);
 const shown=useMemo(()=>designs.filter(d=>(filter==="All"||d.category===filter)&&`${d.title} ${d.id} ${d.category}`.toLowerCase().includes(query.toLowerCase())),[designs,filter,query]);
 return <section id="designs" className="section gallery-section">
  <Reveal><div className="section-head"><div><span className="eyebrow">THE DESIGN ARCHIVE / 01</span><h2>Made to be <em>worn.</em></h2></div><p>Every team has its colours. Every design has a story. Find the one that feels like yours.</p></div></Reveal>
  <div className="gallery-tools"><div className="filter-list">{filters.map(f=><button key={f} className={filter===f?"filter active":"filter"} data-text={f} data-cursor={f.toUpperCase()} onClick={()=>setFilter(f)}><span>{f}</span></button>)}</div><label className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a design..."/></label></div>
  <div className="design-grid">{shown.map((d,i)=><Reveal key={d.id} className={`design-card ${i%5===1?"tall":""}`}><button className="design-image" data-cursor="VIEW" onClick={()=>setIndex(designs.findIndex(x=>x.id===d.id))} aria-label={`View ${d.title}`}><img loading="lazy" src={d.imageUrl} alt={d.alt||d.title}/>{Date.parse(d.createdAt)>Date.now()-7*86400000&&<span className="new-tag">NEW DROP</span>}<span className="image-open"><ArrowUpRight/></span></button><div className="design-caption"><div><span>{d.category} / {d.id}</span><h3>{d.title}</h3></div><button data-cursor="OPEN" onClick={()=>setIndex(designs.findIndex(x=>x.id===d.id))} aria-label={`Open ${d.title}`}><ArrowUpRight/></button></div></Reveal>)}</div>
  {shown.length===0&&<div className="empty-state">No designs found. Try another search.</div>}
  <Lightbox designs={designs} index={index} onClose={()=>setIndex(null)} onMove={setIndex}/>
 </section>
}