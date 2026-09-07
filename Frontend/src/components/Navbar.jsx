import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Shield, LayoutDashboard, Coins, ShieldAlert, Building2, LogOut, Wifi, WifiOff } from "lucide-react";
import { useSocket } from "../hooks/useSocket";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isConnected } = useSocket();

  const navLinks = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Loan Syndication", path: "/loans", icon: Coins },
    { label: "Risk Analyst", path: "/risk", icon: ShieldAlert },
    { label: "Partner Exposure", path: "/exposure", icon: Building2 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">CreditMesh</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                    isActive
                      ? "bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Socket.io Live Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isConnected
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                : "bg-amber-950/80 text-amber-400 border-amber-800"
            }`}
            title={isConnected ? "Real-Time Socket Active" : "Connecting to Socket..."}
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Socket</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Connecting...</span>
              </>
            )}
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-white">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-xs text-slate-400">
              {user?.role_name} {user?.tenant_code ? `• ${user.tenant_code}` : ""}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-2 text-sm"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
