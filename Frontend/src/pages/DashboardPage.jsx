import React from "react";
import { useAuth } from "../auth/AuthContext";
import { LogOut, Shield, Building2, UserCheck, Layers, Sparkles } from "lucide-react";

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">CreditMesh</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-medium">
              Phase 2 Active
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-slate-400">{user?.email}</div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-2 text-sm"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-48 h-48 text-cyan-400" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-semibold mb-3">
              <UserCheck className="w-3.5 h-3.5" />
              Authenticated Session
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.first_name}!
            </h1>
            <p className="mt-2 text-slate-400 text-sm max-w-2xl">
              You are signed in as <span className="text-cyan-400 font-semibold">{user?.role_name}</span>.
              This dashboard reflects your tenant-isolated access scope and role permissions.
            </p>
          </div>
        </div>

        {/* User Scope Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned Role</span>
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{user?.role_name || "N/A"}</div>
            <p className="text-xs text-slate-400 mt-2">
              Role ID: {user?.role_id} • RBAC Gated
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
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">JWT Authentication</span>
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">Active Token</div>
            <p className="text-xs text-slate-400 mt-2">
              Stored securely in LocalStorage • 24h Expiry
            </p>
          </div>
        </div>

        {/* Phase Status Notification */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Phase 2 Authentication Setup Completed!
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            JWT-based Authentication, RBAC, and Tenant Context isolation are fully working.
            Next, we will proceed with **Phase 3: Loan Syndication Engine & Real-Time Socket.io Funding Screen**.
          </p>
        </div>
      </main>
    </div>
  );
};
