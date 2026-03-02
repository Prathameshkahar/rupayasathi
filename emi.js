const emiFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
});

function calculateEMI() {
    const principal = Number(document.getElementById("loanAmount").value);
    const annualRate = Number(document.getElementById("interestRate").value);
    const years = Number(document.getElementById("loanTenure").value);
    const resultEl = document.getElementById("emiResult");

    if (!principal || annualRate < 0 || !years) {
        resultEl.textContent = "Please enter valid positive values in all fields.";
        resultEl.classList.add("error-state");
        return;
    }

    const monthlyRate = annualRate / 12 / 100;
    const months = years * 12;

    const emi = monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);

    resultEl.classList.remove("error-state");
    resultEl.textContent = `Your estimated monthly EMI is ${emiFormatter.format(emi)}. This is the amount payable every month for ${years} years.`;
}

document.getElementById("calculateEmiBtn").addEventListener("click", calculateEMI);
