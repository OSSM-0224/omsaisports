import Reveal from "../components/Reveal";
const facts=[["25+","Years of making"],["20+","Schools & clubs on our wall"],["1000s","Of jerseys made"],["1st","Team-first mindset"]];
export default function Facts(){return <section className="facts-section"><Reveal><h2>Not just numbers.<br/><em>Our kind of stats.</em></h2></Reveal><div className="facts-grid">{facts.map(([n,t])=><div className="fact" key={t}><b>{n}</b><span>{t}</span></div>)}</div></section>}
