import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role_name) && user.role_name !== "SuperAdmin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
