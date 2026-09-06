"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LoanCommitment extends Model {
    static associate(models) {
      LoanCommitment.belongsTo(models.Loan, { foreignKey: "loan_id", as: "loan" });
      LoanCommitment.belongsTo(models.Tenant, { foreignKey: "tenant_id", as: "tenant" });
      LoanCommitment.belongsTo(models.User, { foreignKey: "investor_id", as: "investor" });
      LoanCommitment.hasMany(models.RepaymentLedger, { foreignKey: "commitment_id", as: "repayments" });
    }
  }

  LoanCommitment.init(
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
      tenant_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      investor_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(30),
        defaultValue: "COMMITTED",
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
      modelName: "LoanCommitment",
      tableName: "loan_commitments",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return LoanCommitment;
};
