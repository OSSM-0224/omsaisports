import { useLocation } from "react-router-dom";
import BeamWordmarkFooter, {
  type FooterColumn,
  type FooterSocial,
} from "@/components/ui/beam-wordmark-footer";
import { BRAND } from "../lib/config";

const whatsappNumber = BRAND.whatsappNumber.replace(/\D/g, "");
const whatsappUrl = `https://wa.me/${whatsappNumber}`;
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || BRAND.email;
const instagramUrl = `https://instagram.com/${BRAND.instagramHandle.replace(/^@/, "")}`;

const WhatsAppIcon = (
  <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L3.8 20l1.2-4.2a8.2 8.2 0 1 1 15.2-4.1Z" />
    <path d="M8.8 8.2c.4-.1.7.1.9.5l.7 1.3c.1.2.1.4 0 .6l-.5.6c.4.8 1.1 1.5 1.9 1.9l.6-.5c.2-.1.4-.1.6 0l1.3.7c.4.2.6.5.5.9-.1.7-.7 1.2-1.5 1.2-2.4 0-5.2-2.8-5.2-5.2 0-.8.6-1.4 1.2-1.5Z" />
  </g>
);

const MailIcon = (
  <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4.5 7 7.5 6 7.5-6" />
  </g>
);

export default function Footer() {
  const isHome = useLocation().pathname === "/";
  const hash = (id: string) => (isHome ? id : `/${id}`);

  const socials: FooterSocial[] = [
    { label: "Instagram", href: instagramUrl, icon: "instagram" },
    { label: "WhatsApp", href: whatsappUrl, icon: WhatsAppIcon },
    { label: "Email", href: `mailto:${contactEmail}`, icon: MailIcon },
  ];

  const columns: FooterColumn[] = [
    {
      title: "Explore",
      links: [
        { label: "Design archive", href: hash("#designs") },
        { label: "Our story", href: hash("#story") },
        { label: "Clients", href: hash("#clients") },
        { label: "Journal", href: hash("#journal") },
      ],
    },
    {
      title: "Start here",
      links: [
        { label: "Contact", href: hash("#contact") },
        { label: "WhatsApp", href: whatsappUrl },
        { label: "Email us", href: `mailto:${contactEmail}` },
      ],
    },
  ];

  return (
    <BeamWordmarkFooter
      brand="OM SAI SPORTS"
      wordmark="OM SAI SPORTS"
      company="OM SAI SPORTS"
      socials={socials}
      columns={columns}
      credits={[
        { lead: "Custom teamwear, crafted in ", label: "Navi Mumbai", tail: " since 2000." },
        { lead: "Made for the moments that ", label: "matter", tail: "." },
      ]}
      cut={0.16}
      background="#0C0C0D"
      ink="#F7F1E9"
      muted="#8F8880"
      accent="#FF5A00"
      wordTop="#7A2A00"
      wordFoot="#0C0C0D"
      fontSans="'Space Grotesk', 'DM Sans', ui-sans-serif, system-ui, sans-serif"
      wordWeight={700}
    />
  );
}
