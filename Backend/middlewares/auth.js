const jwt = require("jsonwebtoken");
const { User, Role, Tenant } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "creditmesh_secret_key_12345";

const verifyAuthToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.sendLogin("Authorization header with Bearer token is required.");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.sendLogin("Token missing.");
    }

    jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
      if (err) {
        return res.tokenNotValid("Invalid or expired token.");
      }

      req.user = decodedUser;
      return next();
    });
  } catch (error) {
    return res.sendError(error);
  }
};

const roleAccess = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role_name) {
      return res.sendUnauthorized("Access denied: User role unknown.");
    }

    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (rolesArray.includes(req.user.role_name) || req.user.role_name === "SuperAdmin") {
      return next();
    }

    return res.sendUnauthorized(`Access denied: Requires role ${rolesArray.join(" or ")}.`);
  };
};

const tenantAccess = (req, res, next) => {
  if (!req.user) {
    return res.sendLogin();
  }

  // SuperAdmin and RiskAnalyst have global access across all tenants
  if (req.user.role_name === "SuperAdmin" || req.user.role_name === "RiskAnalyst") {
    return next();
  }

  if (!req.user.tenant_id) {
    return res.sendUnauthorized("Access denied: User is not assigned to any lending partner tenant.");
  }

  return next();
};

module.exports = {
  verifyAuthToken,
  roleAccess,
  tenantAccess,
  JWT_SECRET,
};
