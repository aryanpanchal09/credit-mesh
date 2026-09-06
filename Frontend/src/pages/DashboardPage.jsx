import React from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import { Shield, Building2, UserCheck, Layers, Sparkles, Coins, ArrowRight, Activity } from "lucide-react";

export const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 text-cyan-400" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-semibold mb-3">
            <UserCheck className="w-3.5 h-3.5" />
            Authenticated Session Active
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="mt-2 text-slate-400 text-sm max-w-2xl">
            You are signed in as <span className="text-cyan-400 font-semibold">{user?.role_name}</span>.
            {user?.tenant_name ? ` Representing lending partner ${user.tenant_name}.` : " Global administrator scope."}
          </p>
        </div>
      </div>

      {/* User Scope Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned Role</span>
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{user?.role_name || "N/A"}</div>
          <p className="text-xs text-slate-400 mt-2">
            Role ID: {user?.role_id} • RBAC Row-Level Gated
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lending Tenant</span>
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {user?.tenant_name || (user?.role_name === "SuperAdmin" ? "Global (All Tenants)" : "No Tenant Assigned")}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Tenant Code: {user?.tenant_code || (user?.role_name === "SuperAdmin" ? "GLOBAL_ADMIN" : "NONE")}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Real-Time Socket Layer</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">Socket.io Active</div>
          <p className="text-xs text-slate-400 mt-2">
            Live broadcasts enabled • Zero polling
          </p>
        </div>
      </div>

      {/* Syndication Shortcut Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-900/50 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-cyan-400" />
            Loan Syndication & Co-Lending Engine
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            View active loan facilities, commit capital with race-condition protection (`SELECT FOR UPDATE`), and monitor live funding progress.
          </p>
        </div>

        <Link
          to="/loans"
          className="py-3 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer text-sm"
        >
          <span>Open Syndication Marketplace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
