const express = require("express");
const router = express.Router();
const { Loan, LoanCommitment, AmortizationSchedule, RepaymentLedger, Tenant, User, sequelize } = require("../models");
const { verifyAuthToken } = require("../middlewares/auth");
const { getIo } = require("../utils/socket");

// POST /repayments/pay - Process proportional borrower EMI repayment
router.post("/pay", verifyAuthToken, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { loan_id, installment_no } = req.body;

    if (!loan_id || !installment_no) {
      await transaction.rollback();
      return res.sendInvalidRequest("loan_id and installment_no are required.");
    }

    const loan = await Loan.findByPk(loan_id, {
      include: [{ model: LoanCommitment, as: "commitments", include: [{ model: Tenant, as: "tenant" }] }],
      transaction,
    });

    if (!loan) {
      await transaction.rollback();
      return res.sendResourceNotFound("Loan not found.");
    }

    const installment = await AmortizationSchedule.findOne({
      where: { loan_id: loan.id, installment_no: parseInt(installment_no, 10) },
      transaction,
    });

    if (!installment) {
      await transaction.rollback();
      return res.sendResourceNotFound(`Installment #${installment_no} not found for this loan.`);
    }

    if (installment.status === "PAID") {
      await transaction.rollback();
      return res.sendInvalidRequest(`Installment #${installment_no} has already been paid.`);
    }

    const totalFunded = parseFloat(loan.funded_amount);
    if (totalFunded <= 0 || !loan.commitments || loan.commitments.length === 0) {
      await transaction.rollback();
      return res.sendInvalidRequest("Loan has no active commitments to split repayments across.");
    }

    const emiPrincipal = parseFloat(installment.principal_amount);
    const emiInterest = parseFloat(installment.interest_amount);
    const ledgerEntries = [];

    // Calculate proportional split per partner commitment
    for (const commitment of loan.commitments) {
      const commitmentAmount = parseFloat(commitment.amount);
      const partnerRatio = commitmentAmount / totalFunded;

      const principalPaid = parseFloat((emiPrincipal * partnerRatio).toFixed(2));
      const interestPaid = parseFloat((emiInterest * partnerRatio).toFixed(2));
      const totalPaid = parseFloat((principalPaid + interestPaid).toFixed(2));

      const ledgerRecord = await RepaymentLedger.create(
        {
          loan_id: loan.id,
          commitment_id: commitment.id,
          tenant_id: commitment.tenant_id,
          installment_no: installment.installment_no,
          principal_paid: principalPaid,
          interest_paid: interestPaid,
          total_paid: totalPaid,
          payment_date: new Date(),
        },
        { transaction }
      );

      ledgerEntries.push({
        ...ledgerRecord.toJSON(),
        tenant_name: commitment.tenant ? commitment.tenant.name : "Lending Partner",
        tenant_code: commitment.tenant ? commitment.tenant.code : "PARTNER",
      });
    }

    // Mark installment as PAID
    installment.status = "PAID";
    await installment.save({ transaction });

    // Check if all installments for this loan are now PAID
    const remainingUnpaid = await AmortizationSchedule.count({
      where: { loan_id: loan.id, status: "PENDING" },
      transaction,
    });

    if (remainingUnpaid === 0) {
      loan.status = "CLOSED";
      await loan.save({ transaction });
    } else if (loan.status === "AT_RISK") {
      // If loan was AT_RISK and borrower paid, restore to FULLY_FUNDED / ACTIVE
      loan.status = "FULLY_FUNDED";
      await loan.save({ transaction });
    }

    await transaction.commit();

    // Socket.io Real-Time Broadcast
    try {
      const io = getIo();
      io.to(`loan_${loan.id}`).emit("repayment_processed", {
        loan_id: loan.id,
        installment_no: installment.installment_no,
        status: installment.status,
        loan_status: loan.status,
        ledger_entries: ledgerEntries,
      });
    } catch (socketErr) {
      console.error("[Repayments Route] Socket error:", socketErr);
    }

    return res.sendSuccess(
      {
        installment: {
          installment_no: installment.installment_no,
          status: installment.status,
          emi_amount: installment.emi_amount,
        },
        loan_status: loan.status,
        ledger_splits: ledgerEntries,
      },
      `Installment #${installment_no} paid successfully and split proportionally across ${ledgerEntries.length} funding partners.`
    );
  } catch (error) {
    await transaction.rollback();
    console.error("[Repayments Route] Error:", error);
    return res.sendError(error);
  }
});

// GET /repayments/ledger/:loan_id - Fetch auditable repayment ledger history for a loan
router.get("/ledger/:loan_id", verifyAuthToken, async (req, res) => {
  try {
    const ledgerRecords = await RepaymentLedger.findAll({
      where: { loan_id: req.params.loan_id },
      include: [
        { model: Tenant, as: "tenant", attributes: ["id", "name", "code"] },
        {
          model: LoanCommitment,
          as: "commitment",
          include: [{ model: User, as: "investor", attributes: ["id", "first_name", "last_name"] }],
        },
      ],
      order: [["installment_no", "ASC"], ["created_at", "DESC"]],
    });

    return res.sendSuccess(ledgerRecords, "Repayment ledger records fetched successfully.");
  } catch (error) {
    console.error("[Repayments Route] Fetch ledger error:", error);
    return res.sendError(error);
  }
});

module.exports = router;
