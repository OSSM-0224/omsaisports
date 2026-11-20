import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Copy, ExternalLink, Shirt } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../sections/Footer";
import { getDesigns } from "../../lib/data";
import type { Design } from "../../types";

export default function DesignDetail() {
  const { id } = useParams<{ id: string }>();
  const [designs, setDesigns] = useState<Design[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    window.scrollTo({ top: 0, behavior: "auto" });
    getDesigns()
      .then((next) => { if (active) setDesigns(next); })
      .catch(() => { if (active) setDesigns([]); });
    return () => { active = false; };
  }, [id]);

  const design = designs?.find((d) => d.id === id) ?? null;

  useEffect(() => {
    if (!design) return;
    const previous = document.title;
    document.title = `${design.title} — OM SAI SPORTS`;
    return () => { document.title = previous; };
  }, [design]);

  if (designs === null) {
    return (
      <>
        <Navbar />
        <main className="design-detail-page"><div className="design-detail-loading">Loading design…</div></main>
        <Footer />
      </>
    );
  }

  if (!design) {
    return (
      <>
        <Navbar />
        <main className="design-detail-page">
          <div className="design-detail-missing">
            <span className="eyebrow">DESIGN NOT FOUND</span>
            <h1>That one isn’t<br /><em>on the wall.</em></h1>
            <p>The design may have been removed, or the link could be incorrect.</p>
            <a className="button button-orange" href="/#designs"><ArrowLeft size={16} /> Back to the archive</a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const wa = import.meta.env.VITE_WHATSAPP_NUMBER || "919999999999";
  const waLink = `https://wa.me/${wa}?text=${encodeURIComponent(`Hi, I liked design ${design.id} - ${design.title} on your website. I’d like to know more.`)}`;
  const related = designs
    .filter((d) => d.id !== design.id)
    .sort((a, b) => Number(b.category === design.category) - Number(a.category === design.category))
    .slice(0, 3);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/design/${design!.id}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="design-detail-page">
        <a className="design-detail-back" href="/#designs"><ArrowLeft size={16} /> Back to the design archive</a>
        <div className="design-detail">
          <div className="design-detail-media">
            <img src={design.imageUrl} alt={design.alt || design.title} />
            <span className="design-detail-tag">{design.category} / {design.id}</span>
          </div>
          <div className="design-detail-copy">
            <span className="eyebrow">CUSTOM TEAMWEAR / {design.category.toUpperCase()}</span>
            <h1>{design.title}</h1>
            <p>{design.description || "A custom teamwear concept made for movement, identity and the moments that bring a team together."}</p>
            <dl className="design-detail-meta">
              <div><dt>Design ID</dt><dd>{design.id}</dd></div>
              <div><dt>Category</dt><dd>{design.category}</dd></div>
              <div><dt>Made by</dt><dd>OM SAI SPORTS</dd></div>
            </dl>
            <div className="design-detail-actions">
              <a className="button button-orange" href={waLink} target="_blank" rel="noreferrer">Ask about this design <ExternalLink size={16} /></a>
              <button className="button button-outline" onClick={copyLink}><Copy size={15} /> {copied ? "Link copied" : "Copy link"}</button>
            </div>
            <p className="design-detail-note"><Shirt size={17} /> Every jersey is made to order in the Navi Mumbai region. Share your team colours and we’ll take it from there.</p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="design-related">
            <div className="design-related-head">
              <h2>More from <em>the wall.</em></h2>
              <a className="text-link" href="/#designs">See all designs <ArrowUpRight size={14} /></a>
            </div>
            <div className="design-related-grid">
              {related.map((d) => (
                <Link className="design-related-card" to={`/design/${d.id}`} key={d.id}>
                  <img src={d.imageUrl} alt={d.alt || d.title} loading="lazy" />
                  <span>{d.category} / {d.id}</span>
                  <h3>{d.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
