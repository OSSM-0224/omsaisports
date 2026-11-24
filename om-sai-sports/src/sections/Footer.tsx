import { useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  const isHome = useLocation().pathname === "/";
  const hash = (id: string) => (isHome ? id : `/${id}`);
  return (
    <footer className="footer">
      <a className="footer-brand" href={isHome ? "#top" : "/"} aria-label="OM SAI SPORTS — back to top" data-cursor="HOME">
        <img src="/brand/oss-logo-full.png" alt="OM SAI SPORTS" width="760" height="453" />
      </a>
      <p>Made for the moments that matter.</p>
      <div>
        <a href={hash("#designs")} data-cursor="DESIGNS">Designs</a>
        <a href={hash("#story")} data-cursor="STORY">Story</a>
        <a href={hash("#clients")} data-cursor="CLIENTS">Clients</a>
        <a href={hash("#journal")} data-cursor="JOURNAL">Journal</a>
        <a href={hash("#contact")} data-cursor="CONTACT">Contact</a>
        <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "919999999999"}`} target="_blank" rel="noreferrer" data-cursor="CHAT">WhatsApp <ArrowUpRight size={13} /></a>
      </div>
      <small>© {new Date().getFullYear()} OM SAI SPORTS · EST. 2000</small>
    </footer>
  );
}
