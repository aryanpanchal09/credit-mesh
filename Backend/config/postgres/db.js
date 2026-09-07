"use strict";
const { config } = require("../generals.js");

const dbConfig = {
  local: {
    username: config.pguser,
    password: config.pgpassword,
    database: config.pgdatabase,
    host: config.pghost,
    port: config.pgport,
    dialect: config.pgdialect,
    logging: false,
  },
  development: {
    username: config.pguser,
    password: config.pgpassword,
    database: config.pgdatabase,
    host: config.pghost,
    port: config.pgport,
    dialect: config.pgdialect,
    logging: false,
  },
  test: {
    username: config.pguser,
    password: config.pgpassword,
    database: config.pgdatabase,
    host: config.pghost,
    port: config.pgport,
    dialect: config.pgdialect,
    logging: false,
  },
  production: {
    username: config.pguser,
    password: config.pgpassword,
    database: config.pgdatabase,
    host: config.pghost,
    port: config.pgport,
    dialect: config.pgdialect,
    logging: false,
  },
};

module.exports = dbConfig;
