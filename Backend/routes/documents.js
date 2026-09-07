const express = require("express");
const router = express.Router();
const { Loan, LoanCommitment, AmortizationSchedule, RepaymentLedger, Tenant, User } = require("../models");
const { verifyAuthToken } = require("../middlewares/auth");
const { generateSanctionLetter, generateRepaymentStatement } = require("../utils/pdfGenerator");

// GET /documents/sanction-letter/:loan_id - Download PDF Sanction Letter
router.get("/sanction-letter/:loan_id", verifyAuthToken, async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.loan_id, {
      include: [
        { model: User, as: "borrower" },
        { model: LoanCommitment, as: "commitments", include: [{ model: Tenant, as: "tenant" }] },
      ],
    });

    if (!loan) {
      return res.sendResourceNotFound("Loan not found.");
    }

    const { pdfBytes } = await generateSanctionLetter(loan);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Sanction_Letter_${loan.id}.pdf"`);
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("[Documents Route] Sanction letter error:", error);
    return res.sendError(error);
  }
});

// GET /documents/repayment-statement/:loan_id - Download PDF Repayment Statement
router.get("/repayment-statement/:loan_id", verifyAuthToken, async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.loan_id, {
      include: [{ model: User, as: "borrower" }],
    });

    if (!loan) {
      return res.sendResourceNotFound("Loan not found.");
    }

    const ledgerRecords = await RepaymentLedger.findAll({
      where: { loan_id: loan.id },
      include: [{ model: Tenant, as: "tenant" }],
      order: [["installment_no", "ASC"]],
    });

    const { pdfBytes } = await generateRepaymentStatement(loan, ledgerRecords);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Repayment_Statement_${loan.id}.pdf"`);
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("[Documents Route] Repayment statement error:", error);
    return res.sendError(error);
  }
});

module.exports = router;
