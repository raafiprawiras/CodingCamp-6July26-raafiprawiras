# Expense & Budget Visualizer

A mobile-first expense tracker and budget visualizer built with pure HTML, CSS, and Vanilla JavaScript — no frameworks, no backend, no build tools.

**Live Demo:** https://raafiprawiras.github.io/CodingCamp-6July26-raafiprawiras/

---

## Features

- **Add Transactions** — Record income or expenses with a name, amount, and category
- **Delete Transactions** — Remove any entry instantly
- **Total Balance** — Real-time balance, income, and expense summary cards
- **Pie Chart** — Expense breakdown by category, powered by Chart.js
- **Custom Categories** — Create and delete your own categories beyond the defaults
- **Sort Transactions** — Sort by newest, oldest, amount, or category
- **Dark Mode** — Toggle and persists your preference across sessions
- **LocalStorage Persistence** — All data survives page refreshes

---

## Project Structure

```
CodingCamp-6July26-raafiprawiras/
├── index.html        # App shell — semantic HTML, ARIA, template element
├── css/
│   └── style.css     # All styles — CSS variables, mobile-first, dark mode
├── js/
│   └── script.js     # All logic — state, storage, rendering, validation
└── assets/           # Reserved for future static assets (icons, images)
```

Single `index.html`, one `style.css`, one `script.js`. No bundler, no preprocessor, no dependencies other than Chart.js via CDN.

---

## Tech Stack

| Concern       | Solution                                      |
|---------------|-----------------------------------------------|
| Markup        | Semantic HTML5                                |
| Styling       | CSS custom properties, Flexbox, CSS Grid      |
| Logic         | Vanilla JavaScript (ES6+), IIFE module        |
| Charts        | [Chart.js 4.4.0](https://www.chartjs.org/) via jsDelivr CDN |
| Persistence   | `localStorage` API                            |
| Deployment    | GitHub Pages (static hosting)                 |

---

## Running Locally

No installation or build step required. Open `index.html` directly in any modern browser:

```bash
# Option 1 — file system (works for all features except localStorage on some browsers)
open index.html

# Option 2 — local server (recommended, guarantees localStorage works)
npx serve .
# or
python -m http.server 8080
```

Then visit `http://localhost:8080`.

---

## Deployment (GitHub Pages)

This project is deployed via **GitHub Pages** from the `main` branch root.

To deploy your own fork:

1. Push to a GitHub repository
2. Go to **Settings → Pages**
3. Set **Source** to `Deploy from a branch`
4. Select **Branch:** `main`, **Folder:** `/ (root)`
5. Save — GitHub will publish at `https://<username>.github.io/<repo-name>/`

---

## Browser Support

Supports all modern browsers (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+).  
Requires JavaScript enabled. LocalStorage must be available (standard in all modern browsers).

---

## Coding Camp 2026

Built as a project submission for **Coding Camp — July 2026** by **Raafi Prawiras**.
