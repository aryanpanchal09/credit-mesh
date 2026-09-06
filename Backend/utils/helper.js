"use strict";
const bcrypt = require("bcryptjs");

const generateHash = (str) => bcrypt.hash(str, 10);
const compareHash = (str, hash) => bcrypt.compare(str, hash);

module.exports = {
  generateHash,
  compareHash,
};
