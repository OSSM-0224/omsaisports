import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { deleteDesign, getDesigns, saveDesign } from "../../lib/data";
import { defaultSiteSettings, getSiteSettings, saveSiteSettings } from "../../lib/siteSettings";
import type { SiteSettings } from "../../lib/siteSettings";
import { HeroBackground } from "../hero/HeroBackground";
import type { Category, Design } from "../../types";
import { Film, Image as ImageIcon, LogOut, Plus, Save, Trash2, Upload } from "lucide-react";

const categories: Category[] = ["School", "College", "Club", "Cricket", "Football", "Kabaddi", "Running", "Custom"];
const emptyForm = { title: "", category: "School" as Category, description: "", alt: "" };

function splitFileName(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0
    ? { base: name.slice(0, dot), ext: name.slice(dot) }
    : { base: name, ext: "" };
}

export default function Admin() {
  const nav = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<Design[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [fileName, setFileName] = useState("");
  const fileParts = splitFileName(fileName);

  const [hero, setHero] = useState<SiteSettings>(defaultSiteSettings);
  const [heroBusy, setHeroBusy] = useState<"video" | "poster" | "save" | null>(null);
  const [heroMsg, setHeroMsg] = useState("");
  const [heroReady, setHeroReady] = useState(false);
  const [heroDirty, setHeroDirty] = useState(false);
  const [heroFiles, setHeroFiles] = useState({ video: "", poster: "" });
  const heroVideoParts = splitFileName(heroFiles.video);
  const heroPosterParts = splitFileName(heroFiles.poster);
  const heroMode = hero.hero_use_video && hero.hero_video_url.trim() ? "Video" : "Silk";

  async function refresh() {
    try {
      setItems(await getDesigns({ seedFallback: false }));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not load designs.");
    }
  }

  async function loadHero() {
    try {
      setHero(await getSiteSettings({ strict: true }));
      setHeroReady(true);
      setHeroDirty(false);
    } catch (err) {
      setHeroMsg(err instanceof Error ? err.message : "Could not load hero settings.");
    }
  }

  useEffect(() => {
    if (!supabase) {
      setMsg("Supabase is not configured. Add environment variables to enable the admin.");
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    refresh();
    loadHero();
  }, [session]);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password"))
    });
    setMsg(error?.message ?? "");
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (!form.title.trim()) {
      setMsg("Add a title before choosing an image.");
      input.value = "";
      return;
    }
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloud || !preset) {
      setMsg("Add Cloudinary cloud name and unsigned upload preset.");
      input.value = "";
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", preset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body });
      if (!res.ok) throw new Error("Cloudinary upload failed. Check the upload preset.");
      const data = await res.json();
      const design: Design = {
        id: `OSS-${Date.now().toString().slice(-6)}`,
        title: form.title.trim(),
        category: form.category,
        description: form.description,
        imageUrl: data.secure_url,
        createdAt: new Date().toISOString(),
        alt: form.alt || form.title
      };
      await saveDesign(design);
      await refresh();
      setForm(emptyForm);
      setMsg("Design published.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  async function uploadHero(e: ChangeEvent<HTMLInputElement>, kind: "video" | "poster") {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setHeroFiles((current) => ({ ...current, [kind]: file.name }));
    setHeroMsg("");

    if (kind === "video" && !file.type.startsWith("video/")) {
      setHeroMsg("Choose an MP4 or WebM video.");
      input.value = "";
      return;
    }
    if (kind === "poster" && !file.type.startsWith("image/")) {
      setHeroMsg("Choose a JPG, PNG or WebP image.");
      input.value = "";
      return;
    }

    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloud || !preset) {
      setHeroMsg("Add Cloudinary cloud name and unsigned upload preset.");
      input.value = "";
      return;
    }

    const tooLarge = kind === "video" && file.size > 4 * 1024 * 1024;
    setHeroBusy(kind);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", preset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${kind === "video" ? "video" : "image"}/upload`, { method: "POST", body });
      if (!res.ok) throw new Error(`Cloudinary ${kind} upload failed. Check that the preset allows ${kind === "video" ? "video" : "image"} uploads.`);
      const data = await res.json();
      setHero((current) => kind === "video"
        ? { ...current, hero_video_url: data.secure_url, hero_use_video: true }
        : { ...current, hero_poster_url: data.secure_url });
      setHeroDirty(true);
      setHeroReady(true);
      setHeroMsg(`${kind === "video" ? "Video" : "Poster"} uploaded${tooLarge ? " — this file is over 4 MB, consider a shorter clip" : ""}. Save to publish.`);
    } catch (err) {
      setHeroMsg(err instanceof Error ? err.message : "Hero upload failed.");
    } finally {
      setHeroBusy(null);
      input.value = "";
    }
  }

  async function saveHero() {
    setHeroBusy("save");
    setHeroMsg("");
    try {
      await saveSiteSettings(hero);
      setHeroDirty(false);
      setHeroReady(true);
      setHeroMsg("Hero background saved.");
    } catch (err) {
      setHeroMsg(err instanceof Error ? err.message : "Could not save hero settings.");
    } finally {
      setHeroBusy(null);
    }
  }

  function setUseVideo(enabled: boolean) {
    setHero((current) => ({ ...current, hero_use_video: enabled }));
    setHeroDirty(true);
  }

  function clearHeroVideo() {
    setHero((current) => ({ ...current, hero_video_url: "", hero_use_video: false }));
    setHeroFiles((current) => ({ ...current, video: "" }));
    setHeroDirty(true);
    setHeroMsg("Video removed. Save to publish the shader background.");
  }

  async function remove(id: string) {
    if (!confirm(`Delete ${id}?`)) return;
    try {
      await deleteDesign(id);
      await refresh();
      setMsg("Design deleted.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  if (!session) {
    return (
      <main className="admin-page">
        <div className="admin-box">
          <a className="admin-brand" href="/" aria-label="OM SAI SPORTS — home">
            <img src="/brand/oss-logo-full.png" alt="OM SAI SPORTS" width="760" height="453" />
          </a>
          <h1>Admin access</h1>
          <p>Sign in to manage your design archive.</p>
          <form onSubmit={login}>
            <label>Email<input name="email" type="email" required /></label>
            <label>Password<input name="password" type="password" required /></label>
            <button className="button button-orange" disabled={!isSupabaseConfigured}>Sign in</button>
          </form>
          <small>{msg}</small>
          <button className="text-link" onClick={() => nav("/")}>← Back to website</button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-dashboard">
        <header>
          <div><span className="eyebrow">OM SAI SPORTS / PRIVATE</span><h1>Design desk.</h1></div>
          <button className="button button-outline" onClick={() => supabase?.auth.signOut()}><LogOut size={16} /> Sign out</button>
        </header>

        <section className="admin-hero">
          <div className="admin-hero-head">
            <div>
              <h2><Film /> Hero background</h2>
              <p>A short looping clip or the animated silk shader. Upload a 10–12 second video under 4 MB; the poster is the instant first paint and the reduced-motion fallback.</p>
            </div>
            <span className="admin-hero-note" aria-live="polite">{heroReady ? (heroDirty ? "Unsaved changes" : "Synced") : "Not loaded"}</span>
          </div>
          <div className="admin-hero-grid">
            <div className="admin-hero-fields">
              <div className="admin-hero-uploads">
                <label className="upload-drop">
                  <Film />
                  <b>{heroBusy === "video" ? "Uploading..." : "Upload video"}</b>
                  <span>MP4 or WebM · 10–12 s · under 4 MB</span>
                  {heroFiles.video && (
                    <span className="upload-file" title={heroFiles.video}>
                      <span className="name">{heroVideoParts.base}</span>
                      <span className="ext">{heroVideoParts.ext}</span>
                    </span>
                  )}
                  <input type="file" accept="video/mp4,video/webm" onChange={(e) => uploadHero(e, "video")} disabled={Boolean(heroBusy)} />
                </label>
                <label className="upload-drop">
                  <ImageIcon />
                  <b>{heroBusy === "poster" ? "Uploading..." : "Upload poster"}</b>
                  <span>JPG, PNG or WebP · dark first frame</span>
                  {heroFiles.poster && (
                    <span className="upload-file" title={heroFiles.poster}>
                      <span className="name">{heroPosterParts.base}</span>
                      <span className="ext">{heroPosterParts.ext}</span>
                    </span>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => uploadHero(e, "poster")} disabled={Boolean(heroBusy)} />
                </label>
              </div>
              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={hero.hero_use_video}
                  onChange={(e) => setUseVideo(e.target.checked)}
                  disabled={!hero.hero_video_url || Boolean(heroBusy)}
                />
                <span className="admin-switch-track" aria-hidden="true" />
                <span>Use video</span>
              </label>
              <p className="admin-hero-note">
                {hero.hero_video_url ? "Video is ready. Turn it off any time to return to the silk shader." : "No video yet — the silk shader is used automatically."}
                {" "}Visitors with reduced motion or data saver only see the poster.
              </p>
              <div className="admin-hero-actions">
                <button className="button button-orange" onClick={saveHero} disabled={!heroDirty || Boolean(heroBusy)}>
                  <Save size={16} /> {heroBusy === "save" ? "Saving..." : "Save hero settings"}
                </button>
                {hero.hero_video_url && (
                  <button className="text-link" onClick={clearHeroVideo} disabled={Boolean(heroBusy)}>Remove video</button>
                )}
              </div>
              <p className="admin-hero-msg" role="status">{heroMsg}</p>
            </div>
            <div className="admin-hero-preview">
              <HeroBackground settings={hero} />
              <span className="admin-preview-tag"><i />{heroMode} preview</span>
            </div>
          </div>
        </section>

        <section className="admin-upload">
          <h2><Plus /> Add a new design</h2>
          <div className="admin-fields">
            <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label>Image alt text<input value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} /></label>
          </div>
          <label className="upload-drop">
            <Upload />
            <b>{busy ? "Uploading..." : "Choose image & publish"}</b>
            <span>JPG, PNG, WebP · Cloudinary optimized</span>
            {fileName && (
              <span className="upload-file" title={fileName}>
                <span className="name">{fileParts.base}</span>
                <span className="ext">{fileParts.ext}</span>
              </span>
            )}
            <input type="file" accept="image/*" onChange={upload} disabled={busy} />
          </label>
          <p>{msg}</p>
        </section>
        <h2>Published designs <span>({items.length})</span></h2>
        {items.length === 0 && <p>No designs in the database yet. Upload one above.</p>}
        <div className="admin-list">
          {items.map((d) => (
            <div key={d.id}>
              <img src={d.imageUrl} alt={d.alt || d.title} />
              <span><b>{d.title}</b><small>{d.id} · {d.category}</small></span>
              <button onClick={() => remove(d.id)} aria-label={`Delete ${d.id}`}><Trash2 /></button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
