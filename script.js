function calculateEMI() {

    let P = document.getElementById("loanAmount").value;
    let annualRate = document.getElementById("interestRate").value;
    let years = document.getElementById("loanTenure").value;

    let R = annualRate / 12 / 100;
    let N = years * 12;

    let EMI = (P * R * Math.pow(1 + R, N)) / 
              (Math.pow(1 + R, N) - 1);

    document.getElementById("result").innerHTML =
        "Monthly EMI: ₹" + EMI.toFixed(2);
}
