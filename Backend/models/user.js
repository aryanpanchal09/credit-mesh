"use strict";
const { generateHash } = require("../utils/helper.js");
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, { foreignKey: "role_id", as: "role" });
      User.belongsTo(models.Tenant, { foreignKey: "tenant_id", as: "tenant" });
      User.hasMany(models.Loan, { foreignKey: "borrower_id", as: "borrower_loans" });
      User.hasMany(models.LoanCommitment, { foreignKey: "investor_id", as: "investments" });
    }
  }

  User.init(
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
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      role_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      tenant_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      status: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
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
      modelName: "User",
      tableName: "users",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  const encryptPasswordIfChanged = async (user) => {
    if (user.changed("password")) {
      user.password = await generateHash(user.password);
    }
  };

  User.beforeCreate(encryptPasswordIfChanged);
  User.beforeUpdate(encryptPasswordIfChanged);

  return User;
};
