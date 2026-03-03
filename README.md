# Rupaya Saathi

A structured, multi-page financial website built with pure HTML, CSS, and JavaScript.

## Demo Screenshot

The demo screenshot is now stored in-repo to avoid broken/not-found links:

![Rupaya Saathi Home Demo](assets/demo-home.svg)

## Project Structure

```
/
├── index.html
├── emi.html
├── sip.html
├── blogs.html
├── contact.html
├── style.css
├── script.js
├── emi.js
├── sip.js
└── assets/
    └── demo-home.svg
```

## Pages

1. **Home** (`index.html`)
   - Brand-focused hero section with mission statement and CTAs.
2. **EMI Calculator** (`emi.html` + `emi.js`)
   - Calculates EMI, interest payable, and total repayment.
3. **SIP Calculator** (`sip.html` + `sip.js`)
   - Calculates SIP maturity, invested amount, and wealth gain.
4. **Blogs/News** (`blogs.html`)
   - Card-based finance blogs/news layout.
5. **Contact Us** (`contact.html` + `script.js`)
   - Contact form with client-side validation.

## Features

- Shared responsive navbar across all pages.
- Active page highlighting in navigation.
- Blue/green professional financial theme.
- Google Font integration (`Poppins`).
- Responsive layout and hover animations.
- Pure HTML/CSS/JS (no frameworks).

## Run locally

```bash
python3 -m http.server 4173
```

Open: `http://127.0.0.1:4173/index.html`
