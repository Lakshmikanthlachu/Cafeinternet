# Byteport — Cyber Café & Internet Center HTML Template

Multipurpose, mobile-first HTML template for cyber cafés, internet centers and gaming lounges.
Tailwind CSS 3 · vanilla JavaScript · light & dark mode · RTL · self-hosted fonts · no framework.

## Pages (27)

| Page | File |
| --- | --- |
| Home 1 — cyber café | `index.html` |
| Home 2 — gaming arena | `index-2.html` |
| About | `about.html` |
| Services | `services.html` |
| Service details (9) | `service-details.html` (Printing), `service-browsing.html`, `service-scan.html`, `service-forms.html`, `service-gaming.html`, `service-pods.html`, `service-lamination.html`, `service-typing.html`, `service-tickets.html` |
| Rates / pricing | `rates.html` |
| Blog | `blog.html` |
| Blog articles (9) | `blog-details.html` + `blog-*.html` (one page per post) |
| Contact & booking | `contact.html` |
| 404 | `404.html` |
| Coming soon | `coming-soon.html` |

Full guide: open `documentation.html`.

## Quick start

Open `index.html` in a browser — the compiled CSS is included, nothing to install.

To edit styles:

```bash
npm install
npm run watch        # rebuilds assets/css/style.css while you edit
npm run build        # one-off minified build
```

After changing CSS or JS, raise the `?v=` number on the `style.css` / `main.js` links so browsers load the new files (or press **Ctrl + F5** to hard-refresh while testing).

## Deploy

```bash
npm run build:public   # copies the site into ./public
```

**Vercel:** import the folder — `vercel.json` runs `npm run vercel-build` and serves `public/`.
**Any static host:** upload the `.html` files, `assets/`, `sitemap.xml` and `robots.txt`.

Replace `https://byteport.example/` (canonical URLs, Open Graph, sitemap) with your domain.

## Features

- Light / dark mode (follows the system, remembered per visitor) and one-click RTL
- Forms with inline validation: required fields, letters-only names, mobile numbers (digits, optional `+`, 9–15 digits), no past dates, booking times only within opening hours
- Styled, keyboard-accessible selects; focus kept inside the mobile menu and popups; Escape closes menus
- Blog with category counts, search with a clear button, tag filters and pagination
- Pinned horizontal photo tours, parallax, scroll reveals — all disabled for “reduce motion” users
- Validated with the W3C Nu HTML Checker and axe-core (0 errors)

## Credits

Photos: Unsplash (Unsplash License) — photographers listed in `documentation.html`.
Fonts: Chakra Petch, Manrope, JetBrains Mono, Cairo (SIL OFL). Smooth scrolling: Lenis (MIT).
