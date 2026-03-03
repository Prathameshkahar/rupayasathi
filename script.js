function formatCurrency(value, currency = "INR", locale = "en-IN") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function calculateEMI(principal, annualRate, years) {
  const months = years * 12;
  const monthlyRate = annualRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  return { emi, totalPayment: emi * months, totalInterest: emi * months - principal };
}

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(navLinks.classList.contains("open")));
    });
  }

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    const formMessage = document.getElementById("formMessage");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const message = document.getElementById("message").value.trim();

      if (!name || !email || !message) {
        formMessage.textContent = "Please fill all fields.";
        formMessage.className = "form-message error-state";
        return;
      }

      if (!emailRegex.test(email)) {
        formMessage.textContent = "Please enter a valid email.";
        formMessage.className = "form-message error-state";
        return;
      }

      formMessage.textContent = "Thank you! Our team will connect shortly.";
      formMessage.className = "form-message success-state";
      contactForm.reset();
    });
  }

  const calcBtn = document.querySelector("[data-calc]");
  if (!calcBtn) return;

  calcBtn.addEventListener("click", () => {
    const type = calcBtn.dataset.calc;
    const result = document.getElementById("calcResult");

    if (type === "emi") {
      const principal = +document.getElementById("loanAmount").value;
      const rate = +document.getElementById("interestRate").value;
      const years = +document.getElementById("loanTenure").value;
      if (!principal || !rate || !years) return (result.innerHTML = "Please enter valid values.");
      const { emi, totalPayment, totalInterest } = calculateEMI(principal, rate, years);
      result.innerHTML = `<p>Monthly EMI: <span class="highlight">${formatCurrency(emi)}</span></p><p>Total Interest: ${formatCurrency(totalInterest)}</p><p>Total Payment: ${formatCurrency(totalPayment)}</p>`;
    }

    if (type === "sip") {
      const monthly = +document.getElementById("monthlyInvestment").value;
      const rate = +document.getElementById("expectedReturnRate").value / 12 / 100;
      const months = +document.getElementById("investmentDuration").value * 12;
      if (!monthly || !rate || !months) return (result.innerHTML = "Please enter valid values.");
      const maturity = monthly * ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
      const invested = monthly * months;
      result.innerHTML = `<p>Estimated Maturity: <span class="highlight">${formatCurrency(maturity)}</span></p><p>Total Invested: ${formatCurrency(invested)}</p><p>Total Wealth Gain: ${formatCurrency(maturity - invested)}</p>`;
    }

    if (type === "fd") {
      const p = +document.getElementById("principal").value;
      const r = +document.getElementById("fdRate").value / 100;
      const t = +document.getElementById("fdYears").value;
      const n = +document.getElementById("compoundFreq").value;
      if (!p || !r || !t || !n) return (result.innerHTML = "Please enter valid values.");
      const maturity = p * Math.pow(1 + r / n, n * t);
      result.innerHTML = `<p>Maturity Amount: <span class="highlight">${formatCurrency(maturity)}</span></p><p>Total Interest Earned: ${formatCurrency(maturity - p)}</p>`;
    }

    if (type === "lumpsum") {
      const p = +document.getElementById("lumpAmount").value;
      const r = +document.getElementById("lumpRate").value / 100;
      const t = +document.getElementById("lumpYears").value;
      if (!p || !r || !t) return (result.innerHTML = "Please enter valid values.");
      const fv = p * Math.pow(1 + r, t);
      result.innerHTML = `<p>Future Value: <span class="highlight">${formatCurrency(fv)}</span></p><p>Total Gain: ${formatCurrency(fv - p)}</p>`;
    }

    if (type === "eligibility") {
      const income = +document.getElementById("monthlyIncome").value;
      const existing = +document.getElementById("existingEmi").value;
      const rate = +document.getElementById("eligibilityRate").value;
      const years = +document.getElementById("eligibilityYears").value;
      const affordableEmi = income * 0.5 - existing;
      if (!income || rate <= 0 || !years || affordableEmi <= 0) return (result.innerHTML = "Please enter valid values.");
      const months = years * 12;
      const monthlyRate = rate / 12 / 100;
      const eligibleLoan = affordableEmi * ((Math.pow(1 + monthlyRate, months) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, months)));
      result.innerHTML = `<p>Maximum Eligible Loan: <span class="highlight">${formatCurrency(eligibleLoan)}</span></p><p>Estimated EMI Capacity: ${formatCurrency(affordableEmi)}</p>`;
    }

    if (type === "inflation") {
      const amount = +document.getElementById("currentAmount").value;
      const rate = +document.getElementById("inflationRate").value / 100;
      const years = +document.getElementById("inflationYears").value;
      if (!amount || !rate || !years) return (result.innerHTML = "Please enter valid values.");
      const adjusted = amount * Math.pow(1 + rate, years);
      const reduced = amount - amount / Math.pow(1 + rate, years);
      result.innerHTML = `<p>Future Adjusted Value Needed: <span class="highlight">${formatCurrency(adjusted)}</span></p><p>Purchasing Power Reduction: ${formatCurrency(reduced)}</p>`;
    }
  });
});
