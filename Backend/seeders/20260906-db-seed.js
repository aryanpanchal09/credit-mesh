"use strict";

const { Role, Tenant, User, Loan } = require("../models");

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("Starting Database Seeding for credit_db...");

    // 1. Seed Roles
    const rolesCount = await Role.count();
    let rolesData = [];
    if (rolesCount === 0) {
      rolesData = await Role.bulkCreate([
        { id: 1, name: "SuperAdmin", description: "System Super Administrator" },
        { id: 2, name: "PartnerAdmin", description: "Lending Partner Tenant Administrator" },
        { id: 3, name: "RiskAnalyst", description: "Risk Analyst and Portfolio Inspector" },
        { id: 4, name: "Borrower", description: "Loan Applicant Borrower" },
        { id: 5, name: "Investor", description: "Lending Partner Investor" },
      ]);
      console.log("Roles seeded!");
    }

    // 2. Seed Tenants (Lending Partners)
    let partnerA = await Tenant.findOne({ where: { code: "PARTNER_A" } });
    if (!partnerA) {
      partnerA = await Tenant.create({
        name: "Apex Capital Partners",
        code: "PARTNER_A",
        contact_email: "contact@apexcapital.com",
      });
    }

    let partnerB = await Tenant.findOne({ where: { code: "PARTNER_B" } });
    if (!partnerB) {
      partnerB = await Tenant.create({
        name: "Beacon Lending Ltd",
        code: "PARTNER_B",
        contact_email: "contact@beaconlending.com",
      });
    }
    console.log("Tenants seeded!");

    // 3. Seed Users
    // SuperAdmin
    if (!(await User.findOne({ where: { email: "admin@creditmesh.com" } }))) {
      await User.create({
        first_name: "System",
        last_name: "SuperAdmin",
        email: "admin@creditmesh.com",
        password: "Password123",
        role_id: 1,
        tenant_id: null,
      });
    }

    // PartnerAdmin - Partner A
    if (!(await User.findOne({ where: { email: "admin@apexcapital.com" } }))) {
      await User.create({
        first_name: "Apex",
        last_name: "Admin",
        email: "admin@apexcapital.com",
        password: "Password123",
        role_id: 2,
        tenant_id: partnerA.id,
      });
    }

    // PartnerAdmin - Partner B
    if (!(await User.findOne({ where: { email: "admin@beaconlending.com" } }))) {
      await User.create({
        first_name: "Beacon",
        last_name: "Admin",
        email: "admin@beaconlending.com",
        password: "Password123",
        role_id: 2,
        tenant_id: partnerB.id,
      });
    }

    // RiskAnalyst
    if (!(await User.findOne({ where: { email: "risk@creditmesh.com" } }))) {
      await User.create({
        first_name: "Risk",
        last_name: "Analyst",
        email: "risk@creditmesh.com",
        password: "Password123",
        role_id: 3,
        tenant_id: null,
      });
    }

    // Borrower
    let borrower = await User.findOne({ where: { email: "borrower1@gmail.com" } });
    if (!borrower) {
      borrower = await User.create({
        first_name: "Rahul",
        last_name: "Sharma",
        email: "borrower1@gmail.com",
        password: "Password123",
        role_id: 4,
        tenant_id: null,
      });
    }

    // Investor A - Partner A
    if (!(await User.findOne({ where: { email: "investor_a@apexcapital.com" } }))) {
      await User.create({
        first_name: "Investor",
        last_name: "Apex",
        email: "investor_a@apexcapital.com",
        password: "Password123",
        role_id: 5,
        tenant_id: partnerA.id,
      });
    }

    // Investor B - Partner B
    if (!(await User.findOne({ where: { email: "investor_b@beaconlending.com" } }))) {
      await User.create({
        first_name: "Investor",
        last_name: "Beacon",
        email: "investor_b@beaconlending.com",
        password: "Password123",
        role_id: 5,
        tenant_id: partnerB.id,
      });
    }

    console.log("Users seeded!");

    // 4. Seed Initial Loans
    const loanCount = await Loan.count();
    if (loanCount === 0) {
      await Loan.create({
        title: "Commercial Equipment Financing",
        borrower_id: borrower.id,
        loan_amount: 1000000.00, // ₹10,00,000
        funded_amount: 0.00,
        interest_rate: 12.00,
        tenure_months: 12,
        status: "FUNDING",
      });

      await Loan.create({
        title: "Real Estate Expansion Facility",
        borrower_id: borrower.id,
        loan_amount: 2500000.00, // ₹25,00,000
        funded_amount: 0.00,
        interest_rate: 14.00,
        tenure_months: 24,
        status: "FUNDING",
      });

      await Loan.create({
        title: "Working Capital Line of Credit",
        borrower_id: borrower.id,
        loan_amount: 500000.00, // ₹5,00,000
        funded_amount: 0.00,
        interest_rate: 10.50,
        tenure_months: 6,
        status: "FUNDING",
      });
      console.log("Loans seeded!");
    }

    console.log("Database Seeding Completed Successfully for credit_db!");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("loans", null, {});
    await queryInterface.bulkDelete("users", null, {});
    await queryInterface.bulkDelete("tenants", null, {});
    await queryInterface.bulkDelete("roles", null, {});
  },
};
