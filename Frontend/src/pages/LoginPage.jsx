import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Lock, Mail, Users, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setErrorMsg(res.message || "Invalid credentials.");
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg("");

    const res = await login(demoEmail, demoPassword);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setErrorMsg(res.message || "Quick login failed.");
    }
  };

  const demoAccounts = [
    { label: "SuperAdmin", email: "admin@creditmesh.com", role: "SuperAdmin", badge: "bg-purple-950/80 text-purple-300 border-purple-800" },
    { label: "Apex PartnerAdmin", email: "admin@apexcapital.com", role: "PartnerAdmin (Apex)", badge: "bg-blue-950/80 text-blue-300 border-blue-800" },
    { label: "Beacon PartnerAdmin", email: "admin@beaconlending.com", role: "PartnerAdmin (Beacon)", badge: "bg-teal-950/80 text-teal-300 border-teal-800" },
    { label: "Risk Analyst", email: "risk@creditmesh.com", role: "RiskAnalyst", badge: "bg-amber-950/80 text-amber-300 border-amber-800" },
    { label: "Apex Investor", email: "investor_a@apexcapital.com", role: "Investor (Apex)", badge: "bg-emerald-950/80 text-emerald-300 border-emerald-800" },
    { label: "Beacon Investor", email: "investor_b@beaconlending.com", role: "Investor (Beacon)", badge: "bg-cyan-950/80 text-cyan-300 border-cyan-800" },
    { label: "Borrower", email: "borrower1@gmail.com", role: "Borrower", badge: "bg-indigo-950/80 text-indigo-300 border-indigo-800" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white">CreditMesh</h2>
        <p className="mt-2 text-sm text-slate-400">
          Multi-Tenant Real-Time Loan Syndication Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-8 backdrop-blur-xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@creditmesh.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-white placeholder-slate-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-white placeholder-slate-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In to CreditMesh"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Quick Demo Login Preset Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Quick Demo Sign-In (1-Click Tester)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, "Password123")}
                  className={`text-left p-3 rounded-xl border transition-all duration-150 hover:scale-[1.02] cursor-pointer flex flex-col justify-between ${acc.badge}`}
                >
                  <div className="font-semibold text-sm">{acc.label}</div>
                  <div className="text-xs opacity-80 mt-0.5">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
