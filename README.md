# PCForge 🔧

A fast, production-ready PC component browser and builder built with **Astro + React**.

## Stack

- **Astro 4** — static site generator, zero JS by default
- **React 18** — islands-only for interactive components (Builder, Compare, CategoryBrowser)
- **Custom CSS** — design system with CSS variables, no Tailwind required
- **Static output** — deploys to any CDN/edge network

---

## Quick Start

### Prerequisites
- Node.js v18 or higher — https://nodejs.org
- npm (bundled with Node)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# → Opens at http://localhost:4321

# 3. Build for production
npm run build
# → Outputs to /dist

# 4. Preview production build locally
npm run preview
```

---

## Deploy

### Cloudflare Pages (Recommended — Edge CDN, free, fastest)

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name pcforge
```

Or connect your GitHub repo to Cloudflare Pages dashboard:
- Build command: `npm run build`
- Build output: `dist`

### Vercel

```bash
npm install -g vercel
npm run build
vercel --prod
```

Or import your GitHub repo at vercel.com — it auto-detects Astro.

### Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

---

## Project Structure

```
pcforge/
├── public/
│   └── favicon.svg
└── src/
    ├── data/
    │   ├── index.js          ← Central data + utility exports
    │   ├── categories.js
    │   ├── cpu.js
    │   ├── gpu.js
    │   └── components.js     ← RAM, MB, Storage, PSU, Case, Cooler
    ├── utils/
    │   └── compatibility.js  ← Compatibility engine
    ├── styles/
    │   └── global.css        ← Full design system
    ├── layouts/
    │   └── Base.astro        ← HTML shell, navbar, footer
    ├── components/
    │   └── react/
    │       ├── Builder.jsx         ← PC Builder island
    │       ├── Compare.jsx         ← Compare island
    │       └── CategoryBrowser.jsx ← Category listing island
    └── pages/
        ├── index.astro                              → /
        ├── components/
        │   ├── index.astro                          → /components
        │   └── [category]/
        │       ├── index.astro                      → /components/cpu
        │       └── [slug].astro                     → /components/cpu/cpu1
        ├── builder/
        │   └── index.astro                          → /builder
        └── compare/
            └── index.astro                          → /compare
```

---

## Features

- **200 components** across 8 categories (CPU, GPU, RAM, Motherboard, Storage, PSU, Case, Cooler)
- **25/50/100 per page** dropdown on all category pages
- **Search + Brand filter + Sort** on every category listing
- **Compatibility engine** — socket, RAM type, TDP, PSU wattage, case form factor
- **Free Selection Mode** — toggle off compatibility with a warning note
- **Wattage calculator** — live power estimate with PSU headroom bar
- **Compare mode** — up to 4 components side-by-side with best-value highlights
- **Share build via URL** — encodes build state as query param
- **Export build** — downloads a .txt file of selected components + total price
- **Add to Build from any page** — detail and category pages link directly to builder

---

## Adding More Components

Edit the data files in `src/data/`. Each component needs:
- A unique `id`
- A `brand` and `name`
- A `price`
- Category-specific fields (see existing entries for structure)

The compatibility engine, spec chips, and detail pages all derive from the data automatically.
