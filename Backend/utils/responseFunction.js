const { ValidationError, UniqueConstraintError, DatabaseError } = require("sequelize");

module.exports = function (express) {
  global.HTTP_STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_BODY: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    SERVER_ERROR: 500,
  };

  // Success response
  express.response.sendSuccess = function (data = {}, customMessage, meta = {}) {
    this.status(HTTP_STATUS_CODES.OK).send({
      status: HTTP_STATUS_CODES.OK,
      data: data,
      message: customMessage || undefined,
      ...meta,
    });
  };

  // Created response
  express.response.sendCreated = function (data = {}, message, meta = {}) {
    this.status(HTTP_STATUS_CODES.CREATED).json({
      status: HTTP_STATUS_CODES.CREATED,
      data: data,
      message: message,
      ...meta,
    });
  };

  // Validation failed
  express.response.sendInvalidRequest = function (message, field) {
    this.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
      status: HTTP_STATUS_CODES.BAD_REQUEST,
      message: message,
      ...(field && { field }),
    });
  };

  // Not found
  express.response.sendResourceNotFound = function (message) {
    this.status(HTTP_STATUS_CODES.NOT_FOUND).json({
      status: HTTP_STATUS_CODES.NOT_FOUND,
      message: message || "Resource not found",
    });
  };

  // Login failed / Unauthorized
  express.response.sendLogin = function (message) {
    this.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
      status: HTTP_STATUS_CODES.UNAUTHORIZED,
      title: "Login Failed",
      message: message || "You are not authorized to access this resource.",
    });
  };

  // Token invalid/expired
  express.response.tokenNotValid = function (message) {
    this.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
      status: HTTP_STATUS_CODES.UNAUTHORIZED,
      title: "Token not valid",
      tokenExpired: true,
      message: message || "Your session has expired. Please log in again.",
    });
  };

  // Forbidden / Unauthorized action
  express.response.sendUnauthorized = function (message) {
    this.status(HTTP_STATUS_CODES.FORBIDDEN).json({
      status: HTTP_STATUS_CODES.FORBIDDEN,
      message: message || "You do not have permission to perform this action.",
    });
  };

  // Generic Error Handler
  express.response.sendError = function (err) {
    try {
      if (typeof err === "string") {
        return this.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: err,
        });
      }

      if (err instanceof ValidationError) {
        const message = err.errors ? err.errors.map((e) => e.message).join(", ") : "Validation error";
        return this.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: message,
        });
      }

      if (err instanceof UniqueConstraintError) {
        return this.status(HTTP_STATUS_CODES.CONFLICT).json({
          status: HTTP_STATUS_CODES.CONFLICT,
          message: "Duplicate entry already exists",
        });
      }

      if (err instanceof DatabaseError) {
        return this.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: err.message || "Database error",
        });
      }

      const code = err.statusCode || err.code || HTTP_STATUS_CODES.SERVER_ERROR;
      const message = err.message || "An unexpected error occurred";

      return this.status(typeof code === "number" ? code : 500).json({
        status: typeof code === "number" ? code : 500,
        message: message,
      });
    } catch (handlerError) {
      return this.status(500).json({
        status: 500,
        message: "Internal server error",
      });
    }
  };
};
