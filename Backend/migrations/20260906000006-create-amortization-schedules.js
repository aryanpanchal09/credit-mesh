"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("amortization_schedules", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      loan_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "loans",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      installment_no: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      emi_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      principal_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      interest_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      remaining_balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(30),
        defaultValue: "PENDING",
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("amortization_schedules");
  },
};
