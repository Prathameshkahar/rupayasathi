const emiFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
});

let latestEmiReport = null;

function calculateEMI() {
    const principal = Number(document.getElementById("loanAmount").value);
    const annualRate = Number(document.getElementById("interestRate").value);
    const years = Number(document.getElementById("loanTenure").value);
    const resultEl = document.getElementById("emiResult");
    const reportButton = document.getElementById("downloadEmiReportBtn");

    if (!principal || annualRate < 0 || !years) {
        resultEl.textContent = "Please enter valid positive values in all fields.";
        resultEl.classList.add("error-state");
        latestEmiReport = null;
        reportButton.disabled = true;
        return;
    }

    const monthlyRate = annualRate / 12 / 100;
    const months = years * 12;

    const emi = monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);

    const totalRepayment = emi * months;
    const totalInterest = totalRepayment - principal;

    latestEmiReport = {
        generatedAt: new Date(),
        principal,
        annualRate,
        years,
        months,
        emi,
        totalRepayment,
        totalInterest
    };

    resultEl.classList.remove("error-state");
    resultEl.innerHTML = `
        <strong>Estimated Monthly EMI:</strong> ${emiFormatter.format(emi)}<br>
        <strong>Total Interest Payable:</strong> ${emiFormatter.format(totalInterest)}<br>
        <strong>Total Repayment Amount:</strong> ${emiFormatter.format(totalRepayment)}
    `;
    reportButton.disabled = false;
}

function downloadEmiReport() {
    if (!latestEmiReport || !window.jspdf?.jsPDF) {
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const r = latestEmiReport;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("EMI Calculation Report", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Generated on: ${r.generatedAt.toLocaleString("en-IN")}`, 14, 28);

    doc.setFont("helvetica", "bold");
    doc.text("Input Details", 14, 42);
    doc.setFont("helvetica", "normal");
    doc.text(`Loan Amount: ${emiFormatter.format(r.principal)}`, 14, 50);
    doc.text(`Annual Interest Rate: ${r.annualRate}%`, 14, 58);
    doc.text(`Loan Tenure: ${r.years} years (${r.months} months)`, 14, 66);

    doc.setFont("helvetica", "bold");
    doc.text("Calculation Summary", 14, 82);
    doc.setFont("helvetica", "normal");
    doc.text(`Estimated Monthly EMI: ${emiFormatter.format(r.emi)}`, 14, 90);
    doc.text(`Total Interest Payable: ${emiFormatter.format(r.totalInterest)}`, 14, 98);
    doc.text(`Total Repayment Amount: ${emiFormatter.format(r.totalRepayment)}`, 14, 106);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("Note: EMI calculations are estimates based on constant interest rate assumptions.", 14, 124);

    doc.save(`emi-report-${r.generatedAt.toISOString().slice(0, 10)}.pdf`);
}

document.getElementById("calculateEmiBtn").addEventListener("click", calculateEMI);
document.getElementById("downloadEmiReportBtn").addEventListener("click", downloadEmiReport);
