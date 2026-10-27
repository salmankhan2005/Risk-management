# RiskWatch Landing Page

A responsive Next.js landing page recreating the RiskWatch cinematic financial-risk-intelligence concept with an ivory, obsidian, stone, and copper palette.

## Stack
- Next.js App Router
- React + TypeScript
- Custom CSS design system
- Lucide React icons
- Local generated hero artwork in `public/images/`

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production build

```bash
npm run build
npm start
```

## What is included
- Responsive, editorial-style header and hero section
- Cropped cinematic RiskWatch product artwork and reference image
- Four-column feature band
- Methodology and workflow content below the fold
- Search overlay with section navigation (also opens with Ctrl/Cmd + K)
- Demo and sign-in information dialogs
- Responsive mobile navigation
- Accessible labels, keyboard focus states, Escape-to-close dialogs, and reduced-motion handling

## Asset note
`public/images/riskwatch-hero-scene.jpg` is a crop derived from the generated RiskWatch landing-page visual to preserve the scenic product preview. The dashboard inside that visual is illustrative artwork; the page's header, headline, CTA buttons, menus, dialogs, and below-the-fold content are real HTML/React elements. The included `riskwatch-reference.jpg` keeps the full concept image available for comparison.

## Scope
This scaffold is the public landing page only. It does not implement live bank connectivity, authentication, or the full transaction-monitoring application.
