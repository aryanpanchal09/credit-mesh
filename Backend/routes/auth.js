const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { User, Role, Tenant } = require("../models");
const { compareHash } = require("../utils/helper");
const { verifyAuthToken, JWT_SECRET } = require("../middlewares/auth");

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.sendInvalidRequest("Email and password are required.");
    }

    const user = await User.findOne({
      where: { email },
      include: [
        { model: Role, as: "role" },
        { model: Tenant, as: "tenant" },
      ],
    });

    if (!user) {
      return res.sendLogin("Invalid email or password.");
    }

    const isMatch = await compareHash(password, user.password);
    if (!isMatch) {
      return res.sendLogin("Invalid email or password.");
    }

    const payload = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role_id: user.role_id,
      role_name: user.role ? user.role.name : null,
      tenant_id: user.tenant_id,
      tenant_name: user.tenant ? user.tenant.name : null,
      tenant_code: user.tenant ? user.tenant.code : null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    return res.sendSuccess(
      {
        token,
        user: payload,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("[Auth Route] Login error:", error);
    return res.sendError(error);
  }
});

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password, role_id, tenant_id } = req.body;

    if (!first_name || !last_name || !email || !password || !role_id) {
      return res.sendInvalidRequest("Please provide all required fields.");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.sendInvalidRequest("User with this email already exists.");
    }

    const newUser = await User.create({
      first_name,
      last_name,
      email,
      password,
      role_id: parseInt(role_id),
      tenant_id: tenant_id ? parseInt(tenant_id) : null,
    });

    const fullUser = await User.findByPk(newUser.id, {
      include: [
        { model: Role, as: "role" },
        { model: Tenant, as: "tenant" },
      ],
    });

    const payload = {
      id: fullUser.id,
      uuid: fullUser.uuid,
      email: fullUser.email,
      first_name: fullUser.first_name,
      last_name: fullUser.last_name,
      role_id: fullUser.role_id,
      role_name: fullUser.role ? fullUser.role.name : null,
      tenant_id: fullUser.tenant_id,
      tenant_name: fullUser.tenant ? fullUser.tenant.name : null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    return res.sendCreated(
      {
        token,
        user: payload,
      },
      "Registration successful"
    );
  } catch (error) {
    console.error("[Auth Route] Register error:", error);
    return res.sendError(error);
  }
});

// GET /auth/me
router.get("/me", verifyAuthToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, as: "role" },
        { model: Tenant, as: "tenant" },
      ],
    });

    if (!user) {
      return res.sendResourceNotFound("User profile not found.");
    }

    return res.sendSuccess({ user }, "Profile fetched successfully");
  } catch (error) {
    return res.sendError(error);
  }
});

module.exports = router;
