"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Loan extends Model {
    static associate(models) {
      Loan.belongsTo(models.User, { foreignKey: "borrower_id", as: "borrower" });
      Loan.hasMany(models.LoanCommitment, { foreignKey: "loan_id", as: "commitments" });
      Loan.hasMany(models.AmortizationSchedule, { foreignKey: "loan_id", as: "amortization_schedules" });
      Loan.hasMany(models.RepaymentLedger, { foreignKey: "loan_id", as: "repayments" });
    }
  }

  Loan.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      borrower_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      loan_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      funded_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false,
      },
      interest_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      tenure_months: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("DRAFT", "FUNDING", "FULLY_FUNDED", "ACTIVE", "AT_RISK", "CLOSED"),
        defaultValue: "FUNDING",
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Loan",
      tableName: "loans",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return Loan;
};
