const sipFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
});

let latestSipReport = null;

function calculateSIP() {
    const monthlyInvestment = Number(document.getElementById("monthlyInvestment").value);
    const annualRate = Number(document.getElementById("expectedReturnRate").value);
    const years = Number(document.getElementById("investmentDuration").value);
    const resultEl = document.getElementById("sipResult");
    const reportButton = document.getElementById("downloadSipReportBtn");

    if (!monthlyInvestment || annualRate < 0 || !years) {
        resultEl.textContent = "Please enter valid positive values in all fields.";
        resultEl.classList.add("error-state");
        latestSipReport = null;
        reportButton.disabled = true;
        return;
    }

    const monthlyRate = annualRate / 12 / 100;
    const months = years * 12;

    const maturityValue = monthlyRate === 0
        ? monthlyInvestment * months
        : monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

    const totalInvestment = monthlyInvestment * months;
    const estimatedWealthGain = maturityValue - totalInvestment;

    latestSipReport = {
        generatedAt: new Date(),
        monthlyInvestment,
        annualRate,
        years,
        months,
        maturityValue,
        totalInvestment,
        estimatedWealthGain
    };

    resultEl.classList.remove("error-state");
    resultEl.innerHTML = `
        <strong>Estimated SIP Maturity:</strong> ${sipFormatter.format(maturityValue)}<br>
        <strong>Total Invested Amount:</strong> ${sipFormatter.format(totalInvestment)}<br>
        <strong>Estimated Wealth Gain:</strong> ${sipFormatter.format(estimatedWealthGain)}
    `;
    reportButton.disabled = false;
}

function downloadSipReport() {
    if (!latestSipReport || !window.jspdf?.jsPDF) {
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const r = latestSipReport;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SIP Calculation Report", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Generated on: ${r.generatedAt.toLocaleString("en-IN")}`, 14, 28);

    doc.setFont("helvetica", "bold");
    doc.text("Input Details", 14, 42);
    doc.setFont("helvetica", "normal");
    doc.text(`Monthly Investment: ${sipFormatter.format(r.monthlyInvestment)}`, 14, 50);
    doc.text(`Expected Annual Return: ${r.annualRate}%`, 14, 58);
    doc.text(`Investment Duration: ${r.years} years (${r.months} months)`, 14, 66);

    doc.setFont("helvetica", "bold");
    doc.text("Calculation Summary", 14, 82);
    doc.setFont("helvetica", "normal");
    doc.text(`Estimated Maturity Value: ${sipFormatter.format(r.maturityValue)}`, 14, 90);
    doc.text(`Total Invested Amount: ${sipFormatter.format(r.totalInvestment)}`, 14, 98);
    doc.text(`Estimated Wealth Gain: ${sipFormatter.format(r.estimatedWealthGain)}`, 14, 106);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("Note: This is an estimate based on fixed monthly investment and assumed return rate.", 14, 124);

    doc.save(`sip-report-${r.generatedAt.toISOString().slice(0, 10)}.pdf`);
}

document.getElementById("calculateSipBtn").addEventListener("click", calculateSIP);
document.getElementById("downloadSipReportBtn").addEventListener("click", downloadSipReport);
