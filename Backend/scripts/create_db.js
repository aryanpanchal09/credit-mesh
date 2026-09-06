"use strict";

require("dotenv").config({ path: __dirname + "/../.env" });
const { Client } = require("pg");

async function createDbIfNotExists() {
  const client = new Client({
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    host: process.env.PGHOST || "localhost",
    port: process.env.PGPORT || 5432,
    database: "postgres", // Connect to default postgres DB
  });

  try {
    await client.connect();
    const dbName = process.env.PGDATABASE || "credit_db";
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );

    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully!`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error("Error creating database:", err.message);
  } finally {
    await client.end();
  }
}

createDbIfNotExists();
