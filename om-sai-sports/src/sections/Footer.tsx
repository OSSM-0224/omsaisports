import { useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  const isHome = useLocation().pathname === "/";
  const hash = (id: string) => (isHome ? id : `/${id}`);
  return (
    <footer className="footer">
      <a className="wordmark" href={isHome ? "#top" : "/"}>OM SAI <span>SPORTS.</span></a>
      <p>Made for the moments that matter.</p>
      <div>
        <a href={hash("#designs")}>Designs</a>
        <a href={hash("#story")}>Story</a>
        <a href={hash("#clients")}>Clients</a>
        <a href={hash("#journal")}>Journal</a>
        <a href={hash("#contact")}>Contact</a>
        <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "919999999999"}`} target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={13} /></a>
      </div>
      <small>© {new Date().getFullYear()} OM SAI SPORTS · EST. 2000</small>
    </footer>
  );
}
