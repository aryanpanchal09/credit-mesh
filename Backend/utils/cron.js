const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { Loan, AmortizationSchedule, User, Tenant, sequelize } = require("../models");
const { Op } = require("sequelize");
const { getIo } = require("./socket");

// Configure test Nodemailer transporter (Ethereal test inbox / fallback logger)
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "test.creditmesh@ethereal.email",
    pass: "ethereal_password_123",
  },
});

const runRiskCheckNow = async () => {
  console.log("[Risk Cron Job] Running automated overdue EMI risk check...");

  try {
    // 3 days overdue threshold
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const dateThresholdStr = threeDaysAgo.toISOString().split("T")[0];

    // Find all PENDING installments overdue by > 3 days
    const overdueInstallments = await AmortizationSchedule.findAll({
      where: {
        status: "PENDING",
        due_date: {
          [Op.lt]: dateThresholdStr,
        },
      },
      include: [
        {
          model: Loan,
          as: "loan",
          include: [{ model: User, as: "borrower" }],
        },
      ],
    });

    if (overdueInstallments.length === 0) {
      console.log("[Risk Cron Job] No overdue installments >3 days found. All loans healthy.");
      return {
        flaggedCount: 0,
        loansFlagged: [],
        message: "No overdue EMIs >3 days found.",
      };
    }

    const flaggedLoanIds = new Set();
    const flaggedLoanTitles = [];

    for (const inst of overdueInstallments) {
      if (inst.loan) {
        flaggedLoanIds.add(inst.loan.id);
        flaggedLoanTitles.push({
          id: inst.loan.id,
          title: inst.loan.title,
          installment_no: inst.installment_no,
          due_date: inst.due_date,
          amount_due: inst.emi_amount,
          borrower_email: inst.loan.borrower ? inst.loan.borrower.email : "N/A",
        });
      }
    }

    const loanIdArray = Array.from(flaggedLoanIds);

    // Update loan statuses to AT_RISK
    if (loanIdArray.length > 0) {
      await Loan.update(
        { status: "AT_RISK" },
        {
          where: {
            id: {
              [Op.in]: loanIdArray,
            },
          },
        }
      );

      console.log(`[Risk Cron Job] Flagged ${loanIdArray.length} loans as AT_RISK:`, loanIdArray);

      // Socket.io Broadcast to alert connected Risk Analysts
      try {
        const io = getIo();
        io.emit("risk_alert", {
          flagged_count: loanIdArray.length,
          flagged_loans: flaggedLoanTitles,
          timestamp: new Date().toISOString(),
        });
      } catch (sErr) {
        console.error("[Risk Cron Job] Socket error:", sErr);
      }

      // Simulate sending Email Alert via Nodemailer
      try {
        console.log(`[Nodemailer Simulation] Sending Risk Alert Email to Risk Management Team...`);
        console.log(`----------------------------------------------------------------------`);
        console.log(`SUBJECT: [CRITICAL ALERT] ${loanIdArray.length} Loans Flagged AT_RISK (>3 Days Overdue EMI)`);
        console.log(`TO: risk@creditmesh.com, admin@creditmesh.com`);
        console.log(`DETAILS:`);
        flaggedLoanTitles.forEach((l) => {
          console.log(` - Loan ID ${l.id} ("${l.title}"): Installment #${l.installment_no} due ${l.due_date} (₹${l.amount_due} unpaid). Borrower: ${l.borrower_email}`);
        });
        console.log(`----------------------------------------------------------------------`);
      } catch (mailErr) {
        console.error("[Risk Cron Job] Nodemailer error:", mailErr);
      }
    }

    return {
      flaggedCount: loanIdArray.length,
      loansFlagged: flaggedLoanTitles,
      message: `Successfully flagged ${loanIdArray.length} loans as AT_RISK. Notifications dispatched.`,
    };
  } catch (error) {
    console.error("[Risk Cron Job] Error executing risk check:", error);
    throw error;
  }
};

const initRiskCron = () => {
  // Schedule cron to run every 2 minutes
  cron.schedule("*/2 * * * *", () => {
    runRiskCheckNow();
  });
  console.log("[Risk Cron Job] Scheduled node-cron runner initialized (every 2 minutes).");
};

module.exports = {
  initRiskCron,
  runRiskCheckNow,
};
