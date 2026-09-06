"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AmortizationSchedule extends Model {
    static associate(models) {
      AmortizationSchedule.belongsTo(models.Loan, { foreignKey: "loan_id", as: "loan" });
    }
  }

  AmortizationSchedule.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      loan_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      installment_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      emi_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      principal_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      interest_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      remaining_balance: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(30),
        defaultValue: "PENDING",
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
      modelName: "AmortizationSchedule",
      tableName: "amortization_schedules",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return AmortizationSchedule;
};
