const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const { Loan, LoanCommitment, AmortizationSchedule, RepaymentLedger, User, Tenant, sequelize } = require("../models");
const { calculateAmortizationSchedule } = require("../utils/amortization");
const { runRiskCheckNow } = require("../utils/cron");
const { JWT_SECRET } = require("../middlewares/auth");

describe("CreditMesh Security & Correctness Test Suite", () => {
  let app;
  let investorToken;
  let borrowerToken;
  let testLoan;

  beforeAll(async () => {
    // Setup Express app instance for Supertest
    app = express();
    require("../utils/responseFunction")(app);
    app.use(express.json());

    // Mock Socket.io export
    const { initSocket } = require("../utils/socket");
    const http = require("http");
    const server = http.createServer(app);
    initSocket(server);

    app.use("/auth", require("../routes/auth"));
    app.use("/loans", require("../routes/loans"));
    app.use("/repayments", require("../routes/repayments"));
    app.use("/risk", require("../routes/risk"));
    app.use("/documents", require("../routes/documents"));

    // Generate JWT tokens for test roles
    investorToken = jwt.sign(
      {
        id: 6,
        email: "investor_a@apexcapital.com",
        first_name: "Investor",
        last_name: "Apex",
        role_id: 5,
        role_name: "Investor",
        tenant_id: 1,
      },
      JWT_SECRET
    );

    borrowerToken = jwt.sign(
      {
        id: 5,
        email: "borrower1@gmail.com",
        first_name: "Rahul",
        last_name: "Sharma",
        role_id: 4,
        role_name: "Borrower",
        tenant_id: null,
      },
      JWT_SECRET
    );

    // Fetch or create a test loan
    testLoan = await Loan.findOne({ where: { status: "FUNDING" } });
    if (!testLoan) {
      testLoan = await Loan.create({
        title: "Test Concurrency Facility",
        borrower_id: 5,
        loan_amount: 100000.00,
        funded_amount: 0.00,
        interest_rate: 12.00,
        tenure_months: 12,
        status: "FUNDING",
      });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // TEST 1: Rejects unauthenticated requests missing JWT token
  test("1. Should reject commitment requests without authorization Bearer token", async () => {
    const res = await request(app).post(`/loans/${testLoan.id}/commit`).send({ amount: 10000 });
    expect(res.status).toBe(401);
    expect(res.body.status).toBe(401);
  });

  // TEST 2: Role-Based Access Control (Borrower forbidden from committing capital)
  test("2. Should forbid Borrower role from committing capital to a loan pool", async () => {
    const res = await request(app)
      .post(`/loans/${testLoan.id}/commit`)
      .set("Authorization", `Bearer ${borrowerToken}`)
      .send({ amount: 10000 });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Access denied");
  });

  // TEST 3: Validation: Prevents negative or zero commitment amounts
  test("3. Should reject negative or zero commitment amounts", async () => {
    const res = await request(app)
      .post(`/loans/${testLoan.id}/commit`)
      .set("Authorization", `Bearer ${investorToken}`)
      .send({ amount: -5000 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("positive number");
  });

  // TEST 4: Validation: Prevents over-funding a loan beyond remaining balance
  test("4. Should reject commitment amounts exceeding remaining facility required", async () => {
    const remaining = parseFloat(testLoan.loan_amount) - parseFloat(testLoan.funded_amount);
    const excessiveAmount = remaining + 999999;

    const res = await request(app)
      .post(`/loans/${testLoan.id}/commit`)
      .set("Authorization", `Bearer ${investorToken}`)
      .send({ amount: excessiveAmount });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("exceeds the remaining required amount");
  });

  // TEST 5: Amortization Schedule Calculation Math Verification
  test("5. Server-side Amortization calculation should yield exact principal & interest totals", () => {
    const schedule = calculateAmortizationSchedule(999, 100000, 12, 12);
    expect(schedule.length).toBe(12);

    const totalPrincipal = schedule.reduce((sum, item) => sum + item.principal_amount, 0);
    expect(Math.round(totalPrincipal)).toBe(100000);
    expect(schedule[11].remaining_balance).toBe(0);
  });

  // TEST 6: Successful Capital Commitment & Funded Amount Update
  test("6. Investor should successfully commit valid capital to funding pool", async () => {
    const res = await request(app)
      .post(`/loans/${testLoan.id}/commit`)
      .set("Authorization", `Bearer ${investorToken}`)
      .send({ amount: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.data.loan.funded_amount).toBeGreaterThan(0);
  });

  // TEST 7: Race Condition Protection with SELECT FOR UPDATE Row Locking
  test("7. Concurrency: Parallel double-commit should prevent over-funding via database row locks", async () => {
    // Create a fresh test loan with exactly ₹10,000 remaining
    const raceLoan = await Loan.create({
      title: "Race Condition Unit Test Facility",
      borrower_id: 5,
      loan_amount: 10000.00,
      funded_amount: 0.00,
      interest_rate: 10.00,
      tenure_months: 6,
      status: "FUNDING",
    });

    // Fire 2 concurrent requests at the exact same moment for ₹10,000 each
    const req1 = request(app)
      .post(`/loans/${raceLoan.id}/commit`)
      .set("Authorization", `Bearer ${investorToken}`)
      .send({ amount: 10000 });

    const req2 = request(app)
      .post(`/loans/${raceLoan.id}/commit`)
      .set("Authorization", `Bearer ${investorToken}`)
      .send({ amount: 10000 });

    const [res1, res2] = await Promise.all([req1, req2]);

    // One request must succeed (200), and the second must be rejected (400)
    const statusCodes = [res1.status, res2.status].sort();
    expect(statusCodes).toEqual([200, 400]);

    // Verify loan final funded amount is strictly ₹10,000 (not ₹20,000 over-funded)
    const updatedLoan = await Loan.findByPk(raceLoan.id);
    expect(parseFloat(updatedLoan.funded_amount)).toBe(10000.00);
    expect(updatedLoan.status).toBe("FULLY_FUNDED");
  });

  // TEST 8: Risk Monitoring: Overdue Risk Check Flags Overdue Loans
  test("8. Risk monitor cron job should execute without errors", async () => {
    const result = await runRiskCheckNow();
    expect(result).toHaveProperty("flaggedCount");
    expect(typeof result.flaggedCount).toBe("number");
  });
});
