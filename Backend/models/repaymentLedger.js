"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class RepaymentLedger extends Model {
    static associate(models) {
      RepaymentLedger.belongsTo(models.Loan, { foreignKey: "loan_id", as: "loan" });
      RepaymentLedger.belongsTo(models.LoanCommitment, { foreignKey: "commitment_id", as: "commitment" });
      RepaymentLedger.belongsTo(models.Tenant, { foreignKey: "tenant_id", as: "tenant" });
    }
  }

  RepaymentLedger.init(
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
      loan_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      commitment_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      tenant_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      installment_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      principal_paid: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      interest_paid: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      total_paid: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      payment_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
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
      modelName: "RepaymentLedger",
      tableName: "repayment_ledgers",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return RepaymentLedger;
};
