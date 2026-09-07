const express = require("express");
const router = express.Router();
const { Loan, LoanCommitment, AmortizationSchedule, RepaymentLedger, Tenant, User, sequelize } = require("../models");
const { Op } = require("sequelize");
const { verifyAuthToken, roleAccess } = require("../middlewares/auth");
const { runRiskCheckNow } = require("../utils/cron");

// GET /risk/loans - Server-Side Paginated, Filterable & Sortable List of Loans for Risk Dashboard
router.get("/loans", verifyAuthToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const statusFilter = req.query.status || "ALL";
    const searchQuery = req.query.search || "";
    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = (req.query.sortOrder || "DESC").toUpperCase();

    // Construct Sequelize where clause
    const whereClause = {};

    if (statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    if (searchQuery.trim() !== "") {
      whereClause[Op.or] = [
        { title: { [Op.iLike || Op.like]: `%${searchQuery.trim()}%` } },
      ];
    }

    const { count, rows: loans } = await Loan.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: "borrower", attributes: ["id", "first_name", "last_name", "email"] },
        { model: LoanCommitment, as: "commitments" },
        { model: AmortizationSchedule, as: "amortization_schedules" },
      ],
      distinct: true,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    const formattedList = loans.map((loan) => {
      const loanAmount = parseFloat(loan.loan_amount);
      const fundedAmount = parseFloat(loan.funded_amount);
      const percentage = Math.min(100, parseFloat(((fundedAmount / loanAmount) * 100).toFixed(2)));

      const overdueCount = loan.amortization_schedules
        ? loan.amortization_schedules.filter(
            (s) => s.status === "PENDING" && new Date(s.due_date) < new Date()
          ).length
        : 0;

      return {
        id: loan.id,
        uuid: loan.uuid,
        title: loan.title,
        loan_amount: loanAmount,
        funded_amount: fundedAmount,
        funded_percentage: percentage,
        interest_rate: parseFloat(loan.interest_rate),
        tenure_months: loan.tenure_months,
        status: loan.status,
        borrower: loan.borrower,
        commitments_count: loan.commitments ? loan.commitments.length : 0,
        overdue_installments_count: overdueCount,
        created_at: loan.created_at,
      };
    });

    const totalPages = Math.ceil(count / limit);

    return res.sendSuccess(
      {
        list: formattedList,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      "Risk dashboard loans retrieved successfully."
    );
  } catch (error) {
    console.error("[Risk Route] Fetch error:", error);
    return res.sendError(error);
  }
});

// GET /risk/partner-exposure - Aggregate Portfolio Exposure metrics per Lending Partner (Tenant)
router.get("/partner-exposure", verifyAuthToken, async (req, res) => {
  try {
    const tenants = await Tenant.findAll();
    const exposureList = [];

    for (const tenant of tenants) {
      // Fetch commitments for tenant
      const commitments = await LoanCommitment.findAll({
        where: { tenant_id: tenant.id },
        include: [{ model: Loan, as: "loan" }],
      });

      let totalCommitted = 0;
      let atRiskExposure = 0;

      commitments.forEach((c) => {
        const amt = parseFloat(c.amount);
        totalCommitted += amt;
        if (c.loan && c.loan.status === "AT_RISK") {
          atRiskExposure += amt;
        }
      });

      // Fetch repayment ledger for tenant
      const repayments = await RepaymentLedger.findAll({
        where: { tenant_id: tenant.id },
      });

      let principalRepaid = 0;
      let interestEarned = 0;

      repayments.forEach((r) => {
        principalRepaid += parseFloat(r.principal_paid);
        interestEarned += parseFloat(r.interest_paid);
      });

      const outstandingExposure = Math.max(0, totalCommitted - principalRepaid);

      exposureList.push({
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        tenant_code: tenant.code,
        contact_email: tenant.contact_email,
        total_committed: parseFloat(totalCommitted.toFixed(2)),
        principal_repaid: parseFloat(principalRepaid.toFixed(2)),
        interest_earned: parseFloat(interestEarned.toFixed(2)),
        outstanding_exposure: parseFloat(outstandingExposure.toFixed(2)),
        at_risk_exposure: parseFloat(atRiskExposure.toFixed(2)),
        active_commitments_count: commitments.length,
      });
    }

    return res.sendSuccess(exposureList, "Partner exposure metrics fetched successfully.");
  } catch (error) {
    console.error("[Risk Route] Exposure error:", error);
    return res.sendError(error);
  }
});

// POST /risk/run-cron - Manual demo trigger for 3-day overdue risk check
router.post("/run-cron", verifyAuthToken, async (req, res) => {
  try {
    const result = await runRiskCheckNow();
    return res.sendSuccess(result, result.message);
  } catch (error) {
    console.error("[Risk Route] Run cron error:", error);
    return res.sendError(error);
  }
});

module.exports = router;
