# شروق — Shurooq

A static, right-to-left Arabic website for **Shurooq (شروق)**, an anthology-style
periodical. Built with [Astro](https://astro.build). Print-native design: warm
paper, near-black ink, one oxide-red accent, and a rising-sun nameplate vignette.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
```

```bash
npm run build    # static output → ./dist
npm run preview  # preview the build
```

Deploy `./dist` free to Netlify, Vercel, or GitHub Pages — no server needed.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Masthead, thesis, "Issue 1 coming soon" notice, the five sections, email signup |
| `/archive` | Issues list (Issue 1 as a "coming soon" card + faint future slots) |
| `/about` | The project, its voice, and the three-tier verification method |
| `/sections/<id>` | One page per section (`progress`, `lost`, `people`, `without`, `internet`) |

## Editing content

- **The five sections** live in [`src/data/sections.js`](src/data/sections.js).
  The Arabic `title` of each is a **working title** — swap it in that one file
  when you finalize the real names.
- **Issues** live in the `issues` array in [`src/pages/archive.astro`](src/pages/archive.astro).
  When Issue 1 is ready, set its `status` to `'ready'`, add a `pdf` path (drop the
  file in `public/`), and a real `date`. The card's buttons switch to Read / Download
  automatically. Adjust the `ghosts` count as the archive fills.
- **Design tokens** (colors, fonts, spacing) are at the top of
  [`src/styles/global.css`](src/styles/global.css).

## Email signup

The form in [`src/components/EmailSignup.astro`](src/components/EmailSignup.astro)
has no backend yet. Set `data-endpoint` on the `<form>` to a provider action URL
(Buttondown, Mailchimp, Formspree) to go live; until then it acknowledges honestly
without pretending to send.

## Fonts

Loaded from Google Fonts: **Rakkas** (wordmark), **Aref Ruqaa** (headings),
**Amiri** (body — a revival of the Naskh used in early Arabic newspapers),
**EB Garamond** (stray Latin). To work fully offline, self-host these later.
