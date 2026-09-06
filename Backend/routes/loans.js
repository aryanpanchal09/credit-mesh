const express = require("express");
const router = express.Router();
const { Loan, LoanCommitment, AmortizationSchedule, User, Tenant, sequelize } = require("../models");
const { verifyAuthToken, roleAccess } = require("../middlewares/auth");
const { calculateAmortizationSchedule } = require("../utils/amortization");
const { getIo } = require("../utils/socket");

// GET /loans - List all loans with calculated funding metrics
router.get("/", verifyAuthToken, async (req, res) => {
  try {
    const loans = await Loan.findAll({
      include: [
        { model: User, as: "borrower", attributes: ["id", "first_name", "last_name", "email"] },
        {
          model: LoanCommitment,
          as: "commitments",
          include: [{ model: Tenant, as: "tenant", attributes: ["id", "name", "code"] }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formattedLoans = loans.map((loan) => {
      const loanAmount = parseFloat(loan.loan_amount);
      const fundedAmount = parseFloat(loan.funded_amount);
      const remainingAmount = Math.max(0, loanAmount - fundedAmount);
      const percentage = Math.min(100, parseFloat(((fundedAmount / loanAmount) * 100).toFixed(2)));

      return {
        id: loan.id,
        uuid: loan.uuid,
        title: loan.title,
        loan_amount: loanAmount,
        funded_amount: fundedAmount,
        remaining_amount: remainingAmount,
        funded_percentage: percentage,
        interest_rate: parseFloat(loan.interest_rate),
        tenure_months: loan.tenure_months,
        status: loan.status,
        borrower: loan.borrower,
        commitments_count: loan.commitments ? loan.commitments.length : 0,
        created_at: loan.created_at,
      };
    });

    return res.sendSuccess(formattedLoans, "Loans retrieved successfully");
  } catch (error) {
    console.error("[Loans Route] Fetch error:", error);
    return res.sendError(error);
  }
});

// GET /loans/:id - Single loan details with commitments & schedule
router.get("/:id", verifyAuthToken, async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: User, as: "borrower", attributes: ["id", "first_name", "last_name", "email"] },
        {
          model: LoanCommitment,
          as: "commitments",
          include: [
            { model: User, as: "investor", attributes: ["id", "first_name", "last_name", "email"] },
            { model: Tenant, as: "tenant", attributes: ["id", "name", "code"] },
          ],
        },
        { model: AmortizationSchedule, as: "amortization_schedules" },
      ],
      order: [[{ model: AmortizationSchedule, as: "amortization_schedules" }, "installment_no", "ASC"]],
    });

    if (!loan) {
      return res.sendResourceNotFound("Loan not found.");
    }

    const loanAmount = parseFloat(loan.loan_amount);
    const fundedAmount = parseFloat(loan.funded_amount);
    const remainingAmount = Math.max(0, loanAmount - fundedAmount);
    const percentage = Math.min(100, parseFloat(((fundedAmount / loanAmount) * 100).toFixed(2)));

    const loanData = {
      ...loan.toJSON(),
      loan_amount: loanAmount,
      funded_amount: fundedAmount,
      remaining_amount: remainingAmount,
      funded_percentage: percentage,
    };

    return res.sendSuccess(loanData, "Loan details fetched successfully");
  } catch (error) {
    console.error("[Loans Route] Fetch detail error:", error);
    return res.sendError(error);
  }
});

// POST /loans/:id/commit - Race-Condition Safe Loan Funding Commitment Endpoint
router.post(
  "/:id/commit",
  verifyAuthToken,
  roleAccess(["Investor", "PartnerAdmin", "SuperAdmin"]),
  async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const loanId = req.params.id;
      const { amount } = req.body;

      const commitAmount = parseFloat(amount);
      if (isNaN(commitAmount) || commitAmount <= 0) {
        await transaction.rollback();
        return res.sendInvalidRequest("Commitment amount must be a positive number.");
      }

      // SELECT FOR UPDATE row locking in Sequelize
      const loan = await Loan.findByPk(loanId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!loan) {
        await transaction.rollback();
        return res.sendResourceNotFound("Loan not found.");
      }

      if (loan.status !== "FUNDING") {
        await transaction.rollback();
        return res.sendInvalidRequest(`Loan is no longer open for funding. Current status: ${loan.status}`);
      }

      const currentFunded = parseFloat(loan.funded_amount);
      const totalRequired = parseFloat(loan.loan_amount);
      const remainingRequired = parseFloat((totalRequired - currentFunded).toFixed(2));

      if (commitAmount > remainingRequired) {
        await transaction.rollback();
        return res.sendInvalidRequest(
          `Commitment amount (₹${commitAmount.toLocaleString()}) exceeds the remaining required amount (₹${remainingRequired.toLocaleString()}).`
        );
      }

      // Determine tenant ID for commitment
      let tenantId = req.user.tenant_id;
      if (!tenantId) {
        // If SuperAdmin without tenant, default to Partner A (1)
        tenantId = 1;
      }

      // 1. Create Commitment record
      const commitment = await LoanCommitment.create(
        {
          loan_id: loan.id,
          tenant_id: tenantId,
          investor_id: req.user.id,
          amount: commitAmount,
          status: "COMMITTED",
        },
        { transaction }
      );

      // 2. Update Loan funded amount
      const newFundedAmount = parseFloat((currentFunded + commitAmount).toFixed(2));
      loan.funded_amount = newFundedAmount;

      let isFullyFunded = false;
      if (newFundedAmount >= totalRequired) {
        loan.status = "FULLY_FUNDED";
        isFullyFunded = true;

        // Auto-generate server-side Amortization Schedule
        const scheduleData = calculateAmortizationSchedule(
          loan.id,
          loan.loan_amount,
          loan.interest_rate,
          loan.tenure_months
        );

        await AmortizationSchedule.bulkCreate(scheduleData, { transaction });
      }

      await loan.save({ transaction });
      await transaction.commit();

      // Fetch enriched commitment record for socket broadcast
      const enrichedCommitment = await LoanCommitment.findByPk(commitment.id, {
        include: [
          { model: User, as: "investor", attributes: ["id", "first_name", "last_name"] },
          { model: Tenant, as: "tenant", attributes: ["id", "name", "code"] },
        ],
      });

      const remainingAmount = Math.max(0, totalRequired - newFundedAmount);
      const percentage = Math.min(100, parseFloat(((newFundedAmount / totalRequired) * 100).toFixed(2)));

      // Socket.io Real-Time Broadcast
      try {
        const io = getIo();
        const broadcastData = {
          loan_id: loan.id,
          funded_amount: newFundedAmount,
          remaining_amount: remainingAmount,
          funded_percentage: percentage,
          status: loan.status,
          new_commitment: enrichedCommitment,
        };

        io.to(`loan_${loan.id}`).emit("funding_updated", broadcastData);

        if (isFullyFunded) {
          io.emit("loan_fully_funded", {
            loan_id: loan.id,
            title: loan.title,
            funded_amount: newFundedAmount,
          });
        }
      } catch (socketErr) {
        console.error("[Loans Route] Socket broadcast error:", socketErr);
      }

      return res.sendSuccess(
        {
          loan: {
            id: loan.id,
            funded_amount: newFundedAmount,
            remaining_amount: remainingAmount,
            funded_percentage: percentage,
            status: loan.status,
          },
          commitment: enrichedCommitment,
          is_fully_funded: isFullyFunded,
        },
        isFullyFunded
          ? "Loan has been 100% funded! Amortization schedule has been generated."
          : `Successfully committed ₹${commitAmount.toLocaleString()} to loan.`
      );
    } catch (error) {
      await transaction.rollback();
      console.error("[Loans Route] Commitment Transaction Error:", error);
      return res.sendError(error);
    }
  }
);

module.exports = router;
