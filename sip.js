const sipFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
});

function calculateSIP() {
    const monthlyInvestment = Number(document.getElementById("monthlyInvestment").value);
    const annualRate = Number(document.getElementById("expectedReturnRate").value);
    const years = Number(document.getElementById("investmentDuration").value);
    const resultEl = document.getElementById("sipResult");

    if (!monthlyInvestment || annualRate < 0 || !years) {
        resultEl.textContent = "Please enter valid positive values in all fields.";
        resultEl.classList.add("error-state");
        return;
    }

    const monthlyRate = annualRate / 12 / 100;
    const months = years * 12;

    const maturityValue = monthlyRate === 0
        ? monthlyInvestment * months
        : monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

    resultEl.classList.remove("error-state");
    resultEl.textContent = `Your estimated SIP maturity value is ${sipFormatter.format(maturityValue)} after ${years} years with monthly investment of ${sipFormatter.format(monthlyInvestment)}.`;
}

document.getElementById("calculateSipBtn").addEventListener("click", calculateSIP);
