# OM SAI SPORTS — Design Showcase

A responsive editorial-style jersey manufacturing showcase built with React 19, Vite, TypeScript, Tailwind CSS and Framer Motion. The public experience is a design portfolio: no cart, checkout, pricing or purchase flow.

## Features

- Full-bleed hero with a deferred Cloudinary video, a raw-WebGL silk-fabric shader fallback, a local poster for first paint, scroll choreography and a live card counter.
- Responsive Design Wall hero, client marquee, story, process, facts, journal and WhatsApp contact form.
- Design archive with category filters, search and keyboard-accessible lightbox.
- Shareable design pages at `/design/:id` with WhatsApp inquiry prefilled with the selected Design ID and title.
- `/admin` Supabase Auth login, Cloudinary image/video upload, design records and hero background settings.
- 12 locally seeded demo designs when Supabase is not configured or has no rows.
- CSS design tokens in `src/styles.css`; reduced-motion, data-saver and slow-connection fallbacks.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_WHATSAPP_NUMBER` to the full international number with country code and no `+` or spaces. Update the phone/email values to the real business contact details.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL Editor.
3. Replace `YOUR_ADMIN_EMAIL@example.com` in the SQL policies with the one administrator email.
4. Create that user in Supabase Authentication. Disable public signups after creating the account.
5. Add the project URL and anon key to `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Public visitors can read design records. Writes are restricted by RLS to the configured admin email. Never put a Supabase service-role key in this frontend.

The same schema creates the single-row `site_settings` table (`hero_video_url`, `hero_poster_url`, `hero_use_video`). Keep its public read policy so the hero can load the published background. When the table is missing or no video is enabled, the hero uses the built-in silk shader and `/hero-poster.svg`.

## Hero background

1. Sign in at `/admin` and open the **Hero background** card.
2. Upload a 10–12 second loop, ideally MP4/WebM and under 4 MB, then upload a dark poster that matches its first frame.
3. Turn on **Use video** and save. If video is off or missing, the shader runs automatically.
4. Visitors with `prefers-reduced-motion`, data saver enabled, a slow connection or no WebGL see the poster only.

## Cloudinary setup

1. Create a Cloudinary account.
2. Create an **unsigned** upload preset and allow both image and video uploads, with appropriate format / size limits.
3. Set `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET`.
4. Uploads are delivered as secure Cloudinary URLs; add automatic format and quality transformations (`f_auto,q_auto`) through a Cloudinary delivery transformation or update the image URL helper for your preferred delivery policy.

The Cloudinary upload preset is public by design for unsigned uploads. Restrict it in Cloudinary (allowed formats, file size, folder, moderation as appropriate). For stronger production security, proxy uploads through a serverless function that signs requests.

## Deployment

- **Vercel:** Import the repository, set the `VITE_*` environment variables, build command `npm run build`, output directory `dist`. `vercel.json` includes the SPA rewrite so `/design/:id` deep links resolve.
- **Cloudflare Pages:** Connect the repository, set build command `npm run build`, output directory `dist`. `_redirects` contains the SPA fallback (`/* /index.html 200`).

## Notes before production

- Replace demo Unsplash photography with actual jersey artwork and founder/process photos.
- Confirm business phone, email, WhatsApp number and factory address.
- Client names and facts are currently authored in `src/lib/data.ts` and `src/sections/Facts.tsx`. They can be migrated to Supabase tables when admin editing for those content types is required.
- The admin currently supports publishing/deleting designs and editing the hero background. Add editing/reordering and a dedicated client/facts editor before handing over the content-management workflow.
