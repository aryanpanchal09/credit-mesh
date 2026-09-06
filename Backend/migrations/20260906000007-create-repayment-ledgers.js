"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("repayment_ledgers", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false,
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
      commitment_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "loan_commitments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tenant_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      installment_no: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      principal_paid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      interest_paid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      total_paid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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
    await queryInterface.dropTable("repayment_ledgers");
  },
};
