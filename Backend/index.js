const express = require("express");
require("./utils/responseFunction")(express);
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { initSocket } = require("./utils/socket");
const { sequelize } = require("./models");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
initSocket(server);

// Health check endpoint
app.get("/", (req, res) => {
  res.send({
    service: "CreditMesh API",
    status: "Active",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/loans", require("./routes/loans"));

// Global Error Fallback
app.use((err, req, res, next) => {
  console.error("[Unhandled Error]", err);
  return res.sendError(err);
});

server.listen(PORT, async () => {
  console.log(`[CreditMesh API] Listening on http://localhost:${PORT}`);
  try {
    await sequelize.authenticate();
    console.log("[CreditMesh API] PostgreSQL database connection established successfully.");
  } catch (error) {
    console.error("[CreditMesh API] Unable to connect to the database:", error);
  }
});
