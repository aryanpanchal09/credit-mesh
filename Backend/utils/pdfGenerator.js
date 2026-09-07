const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const ensureDocsDirectory = () => {
  const dir = path.join(__dirname, "../public/documents");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

/**
 * Generate Loan Sanction Letter PDF
 */
const generateSanctionLetter = async (loan) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(0.04, 0.29, 0.43),
  });

  page.drawText("CREDITMESH FINTECH PLATFORM", {
    x: 40,
    y: height - 45,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("LOAN SANCTION LETTER & SYNDICATION AGREEMENT", {
    x: 40,
    y: height - 70,
    size: 11,
    font: fontRegular,
    color: rgb(0.8, 0.9, 1),
  });

  // Facility Metadata
  let y = height - 140;

  page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 40, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Sanction Ref: CM-SANCTION-${loan.id}-${Date.now().toString().slice(-6)}`, { x: 300, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  y -= 30;
  page.drawText("BORROWER & FACILITY DETAILS", { x: 40, y, size: 12, font: fontBold, color: rgb(0.04, 0.29, 0.43) });

  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: 560, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  y -= 25;
  const borrowerName = loan.borrower ? `${loan.borrower.first_name} ${loan.borrower.last_name}` : "N/A";
  const borrowerEmail = loan.borrower ? loan.borrower.email : "N/A";

  page.drawText(`Borrower Name: ${borrowerName}`, { x: 40, y, size: 10, font: fontBold });
  page.drawText(`Email: ${borrowerEmail}`, { x: 300, y, size: 10, font: fontRegular });

  y -= 20;
  page.drawText(`Facility Title: ${loan.title}`, { x: 40, y, size: 10, font: fontRegular });

  y -= 20;
  page.drawText(`Sanctioned Amount: INR ${parseFloat(loan.loan_amount).toLocaleString()}`, { x: 40, y, size: 10, font: fontBold, color: rgb(0, 0.5, 0.3) });
  page.drawText(`Interest Rate: ${loan.interest_rate}% p.a.`, { x: 300, y, size: 10, font: fontRegular });

  y -= 20;
  page.drawText(`Tenure: ${loan.tenure_months} Months`, { x: 40, y, size: 10, font: fontRegular });
  page.drawText(`Facility Status: ${loan.status}`, { x: 300, y, size: 10, font: fontBold });

  // Co-Lending Partners Table
  y -= 40;
  page.drawText("SYNDICATION CO-LENDING PARTNER SPLITS", { x: 40, y, size: 12, font: fontBold, color: rgb(0.04, 0.29, 0.43) });

  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: 560, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  y -= 25;
  page.drawText("Lending Partner Tenant", { x: 40, y, size: 10, font: fontBold });
  page.drawText("Committed Capital", { x: 260, y, size: 10, font: fontBold });
  page.drawText("Funding Share (%)", { x: 440, y, size: 10, font: fontBold });

  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: 560, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });

  const totalFunded = parseFloat(loan.funded_amount) || parseFloat(loan.loan_amount);

  if (loan.commitments && loan.commitments.length > 0) {
    loan.commitments.forEach((c) => {
      y -= 20;
      const tenantName = c.tenant ? c.tenant.name : "Lending Partner";
      const amt = parseFloat(c.amount);
      const sharePct = ((amt / totalFunded) * 100).toFixed(2);

      page.drawText(tenantName, { x: 40, y, size: 9, font: fontRegular });
      page.drawText(`INR ${amt.toLocaleString()}`, { x: 260, y, size: 9, font: fontRegular });
      page.drawText(`${sharePct}%`, { x: 440, y, size: 9, font: fontBold, color: rgb(0, 0.4, 0.7) });
    });
  } else {
    y -= 20;
    page.drawText("No syndication commitments logged.", { x: 40, y, size: 9, font: fontRegular });
  }

  // Footer / Terms
  y -= 60;
  page.drawText("TERMS & CONDITIONS:", { x: 40, y, size: 10, font: fontBold });
  y -= 15;
  page.drawText("1. Repayments will be automatically split proportionally across funded partner ledgers.", { x: 40, y, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  y -= 12;
  page.drawText("2. Installments overdue by >3 days trigger automatic AT_RISK classification.", { x: 40, y, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  y -= 50;
  page.drawText("Authorized Signatory", { x: 40, y, size: 10, font: fontBold });
  page.drawText("Borrower Acceptance", { x: 380, y, size: 10, font: fontBold });

  y -= 30;
  page.drawLine({ start: { x: 40, y }, end: { x: 180, y }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });
  page.drawLine({ start: { x: 380, y }, end: { x: 520, y }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });

  const pdfBytes = await pdfDoc.save();
  const dir = ensureDocsDirectory();
  const filePath = path.join(dir, `sanction_letter_${loan.id}.pdf`);
  fs.writeFileSync(filePath, pdfBytes);

  return { filePath, pdfBytes };
};

/**
 * Generate Repayment Statement PDF
 */
const generateRepaymentStatement = async (loan, ledgerRecords = []) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(0.04, 0.29, 0.43),
  });

  page.drawText("CREDITMESH FINTECH PLATFORM", {
    x: 40,
    y: height - 45,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("REPAYMENT AUDIT STATEMENT & LEDGER HISTORY", {
    x: 40,
    y: height - 70,
    size: 11,
    font: fontRegular,
    color: rgb(0.8, 0.9, 1),
  });

  let y = height - 130;
  const borrowerName = loan.borrower ? `${loan.borrower.first_name} ${loan.borrower.last_name}` : "N/A";

  page.drawText(`Facility: ${loan.title} (ID: #${loan.id})`, { x: 40, y, size: 11, font: fontBold });
  page.drawText(`Borrower: ${borrowerName}`, { x: 340, y, size: 10, font: fontRegular });

  y -= 20;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;

  ledgerRecords.forEach((r) => {
    totalPrincipalPaid += parseFloat(r.principal_paid);
    totalInterestPaid += parseFloat(r.interest_paid);
  });

  page.drawText(`Total Principal Recovered: INR ${totalPrincipalPaid.toLocaleString()}`, { x: 40, y, size: 10, font: fontBold, color: rgb(0, 0.5, 0.3) });
  page.drawText(`Total Interest Yield: INR ${totalInterestPaid.toLocaleString()}`, { x: 340, y, size: 10, font: fontBold, color: rgb(0, 0.4, 0.7) });

  y -= 30;
  page.drawText("PROPORTIONAL REPAYMENT LEDGER LOGS", { x: 40, y, size: 11, font: fontBold, color: rgb(0.04, 0.29, 0.43) });

  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: 560, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  y -= 20;
  page.drawText("Inst #", { x: 40, y, size: 9, font: fontBold });
  page.drawText("Partner Tenant", { x: 90, y, size: 9, font: fontBold });
  page.drawText("Principal", { x: 250, y, size: 9, font: fontBold });
  page.drawText("Interest", { x: 350, y, size: 9, font: fontBold });
  page.drawText("Total Payout", { x: 450, y, size: 9, font: fontBold });

  y -= 6;
  page.drawLine({ start: { x: 40, y }, end: { x: 560, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });

  if (ledgerRecords.length > 0) {
    ledgerRecords.forEach((r) => {
      y -= 18;
      if (y < 60) return; // Prevent page overflow

      const tenantName = r.tenant ? r.tenant.code || r.tenant.name : "PARTNER";

      page.drawText(`#${r.installment_no}`, { x: 40, y, size: 8, font: fontRegular });
      page.drawText(tenantName.slice(0, 22), { x: 90, y, size: 8, font: fontRegular });
      page.drawText(`INR ${parseFloat(r.principal_paid).toLocaleString()}`, { x: 250, y, size: 8, font: fontRegular });
      page.drawText(`INR ${parseFloat(r.interest_paid).toLocaleString()}`, { x: 350, y, size: 8, font: fontRegular });
      page.drawText(`INR ${parseFloat(r.total_paid).toLocaleString()}`, { x: 450, y, size: 8, font: fontBold, color: rgb(0, 0.4, 0.7) });
    });
  } else {
    y -= 20;
    page.drawText("No repayment ledger entries logged yet.", { x: 40, y, size: 9, font: fontRegular });
  }

  const pdfBytes = await pdfDoc.save();
  const dir = ensureDocsDirectory();
  const filePath = path.join(dir, `repayment_statement_${loan.id}.pdf`);
  fs.writeFileSync(filePath, pdfBytes);

  return { filePath, pdfBytes };
};

module.exports = {
  generateSanctionLetter,
  generateRepaymentStatement,
};
