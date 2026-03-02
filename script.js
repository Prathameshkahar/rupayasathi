function calculateEMI() {
    const principal = Number(document.getElementById("loanAmount").value);
    const annualRate = Number(document.getElementById("interestRate").value);
    const years = Number(document.getElementById("loanTenure").value);
    const resultEl = document.getElementById("result");

    if (!principal || annualRate < 0 || !years) {
        resultEl.textContent = "Please enter valid positive values in all fields.";
        return;
    }

    const monthlyRate = annualRate / 12 / 100;
    const months = years * 12;

    let emi;
    if (monthlyRate === 0) {
        emi = principal / months;
    } else {
        emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
    }

    const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(emi);

    resultEl.textContent = `Estimated Monthly EMI: ${formatted}`;
}
