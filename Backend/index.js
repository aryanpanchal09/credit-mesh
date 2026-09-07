const express = require("express");
require("./utils/responseFunction")(express);
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { initSocket } = require("./utils/socket");
const { initRiskCron } = require("./utils/cron");
const { sequelize } = require("./models");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

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
app.use("/repayments", require("./routes/repayments"));
app.use("/risk", require("./routes/risk"));
app.use("/documents", require("./routes/documents"));

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
    initRiskCron();
  } catch (error) {
    console.error("[CreditMesh API] Unable to connect to the database:", error);
  }
});
