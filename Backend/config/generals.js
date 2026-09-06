"use strict";
require("dotenv").config();

module.exports.config = {
  jwtSecret: process.env.JWT_SECRET || "creditmesh_secret_key",
  port: process.env.PORT || 5000,

  pghost: process.env.PGHOST || "localhost",
  pgport: process.env.PGPORT || 5432,
  pgdatabase: process.env.PGDATABASE || "credit_db",
  pguser: process.env.PGUSER || "postgres",
  pgpassword: process.env.PGPASSWORD || "postgres",
  pgdialect: process.env.DIALECT || "postgres",
};
