# Finance Calculator

A user-friendly and responsive web app with **two fully independent calculator pages**:

- `emi.html` → EMI (Equated Monthly Installment) Calculator
- `sip.html` → SIP (Systematic Investment Plan) Calculator

## Features

- Separate pages for EMI and SIP (no shared inputs/outputs).
- Clean navigation between Home, EMI, and SIP pages.
- Clear labels, placeholders, and validation messages.
- Results shown with simple, human-readable explanations.
- Indian currency formatting (`₹`) for financial values.
- Responsive layout for desktop and mobile.

## Pages

1. **Home** (`index.html`)
   - Simple landing page with navigation buttons.

2. **EMI Calculator** (`emi.html` + `emi.js`)
   - Inputs: Loan Amount, Annual Interest Rate, Loan Tenure.
   - Output: Estimated monthly EMI with explanation.

3. **SIP Calculator** (`sip.html` + `sip.js`)
   - Inputs: Monthly Investment, Expected Annual Return Rate, Investment Duration.
   - Output: Estimated maturity value with explanation.

## Run locally

Open `index.html` directly in your browser or run a local server:

```bash
python3 -m http.server 4173
```

Then visit: `http://127.0.0.1:4173`
