import React, { createContext, useState, useEffect, useContext } from "react";
import Constant from "../utils/constant";
import { loginApi, getMeApi } from "../Api/api.services";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(Constant.USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(Constant.TOKEN_KEY));
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      if (res && res.data && res.data.token) {
        const authToken = res.data.token;
        const userData = res.data.user;

        localStorage.setItem(Constant.TOKEN_KEY, authToken);
        localStorage.setItem(Constant.USER_KEY, JSON.stringify(userData));

        setToken(authToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: res?.message || "Login failed" };
    } catch (err) {
      console.error("[AuthContext] Login Error:", err);
      return {
        success: false,
        message: err?.message || "Invalid credentials or server error.",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(Constant.TOKEN_KEY);
    localStorage.removeItem(Constant.USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
