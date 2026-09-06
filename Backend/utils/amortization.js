/**
 * Amortization Schedule Calculation Utility
 * Computes monthly EMI, principal split, interest split, and remaining balance.
 */

const calculateAmortizationSchedule = (loanId, loanAmount, annualInterestRate, tenureMonths) => {
  const P = parseFloat(loanAmount);
  const annualRate = parseFloat(annualInterestRate);
  const n = parseInt(tenureMonths, 10);

  // Monthly interest rate
  const r = annualRate / 12 / 100;

  // Monthly EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  let emi = 0;
  if (r > 0) {
    emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  } else {
    emi = P / n;
  }

  const schedule = [];
  let remainingBalance = P;
  const startDate = new Date();

  for (let i = 1; i <= n; i++) {
    const interestForMonth = remainingBalance * r;
    let principalForMonth = emi - interestForMonth;

    // For the last installment, adjust rounding to bring remaining balance exactly to zero
    if (i === n || principalForMonth > remainingBalance) {
      principalForMonth = remainingBalance;
    }

    remainingBalance -= principalForMonth;
    if (remainingBalance < 0) remainingBalance = 0;

    // Monthly due date (30 days interval per installment)
    const dueDate = new Date(startDate);
    dueDate.setMonth(startDate.getMonth() + i);

    schedule.push({
      loan_id: loanId,
      installment_no: i,
      due_date: dueDate.toISOString().split("T")[0],
      emi_amount: parseFloat((principalForMonth + interestForMonth).toFixed(2)),
      principal_amount: parseFloat(principalForMonth.toFixed(2)),
      interest_amount: parseFloat(interestForMonth.toFixed(2)),
      remaining_balance: parseFloat(remainingBalance.toFixed(2)),
      status: "PENDING",
    });
  }

  return schedule;
};

module.exports = {
  calculateAmortizationSchedule,
};
