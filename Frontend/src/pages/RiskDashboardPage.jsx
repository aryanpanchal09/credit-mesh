import React, { useEffect, useState } from "react";
import { getRiskLoansApi, triggerRiskCronApi } from "../Api/api.services";
import { Link } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  Play,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  Coins,
} from "lucide-react";

export const RiskDashboardPage = () => {
  const [loans, setLoans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState(null);

  const { socket } = useSocket();

  const fetchRiskLoans = async () => {
    try {
      setLoading(true);
      const res = await getRiskLoansApi({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        search: searchTerm,
        sortBy,
        sortOrder,
      });

      if (res && res.data) {
        setLoans(res.data.list);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("[RiskDashboardPage] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskLoans();
  }, [pagination.page, pagination.limit, statusFilter, sortBy, sortOrder]);

  // Handle Search Input Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchRiskLoans();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Listen to Socket.io risk alerts
  useEffect(() => {
    if (!socket) return;

    const handleRiskAlert = (data) => {
      console.log("[RiskDashboardPage] Socket risk_alert received:", data);
      fetchRiskLoans();
    };

    socket.on("risk_alert", handleRiskAlert);

    return () => {
      socket.off("risk_alert", handleRiskAlert);
    };
  }, [socket]);

  const handleRunCron = async () => {
    try {
      setIsCronRunning(true);
      setCronResult(null);
      const res = await triggerRiskCronApi();
      if (res && res.data) {
        setCronResult(res.data);
        fetchRiskLoans();
      }
    } catch (err) {
      console.error("[RiskDashboardPage] Cron trigger error:", err);
    } finally {
      setIsCronRunning(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "AT_RISK":
        return "bg-red-950/80 text-red-400 border-red-800 animate-pulse font-bold";
      case "FULLY_FUNDED":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-800";
      case "FUNDING":
        return "bg-cyan-950/80 text-cyan-400 border-cyan-800";
      case "CLOSED":
        return "bg-slate-800 text-slate-400 border-slate-700";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
            <ShieldAlert className="w-4 h-4" />
            Risk Analyst Operations Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Risk & Overdue Loan Monitoring
          </h1>
          <p className="mt-2 text-slate-400 text-sm max-w-2xl">
            High-performance server-side paginated inspect engine. Loans with EMIs &gt;3 days overdue are automatically flagged as <span className="text-red-400 font-semibold">AT_RISK</span> and notification alerts dispatched.
          </p>
        </div>

        {/* Live Cron Simulation Button */}
        <div className="shrink-0">
          <button
            onClick={handleRunCron}
            disabled={isCronRunning}
            className="w-full sm:w-auto py-3.5 px-5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/25 transition duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 text-sm"
          >
            {isCronRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Node-Cron Check...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Simulate 3-Day Overdue Check Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cron Execution Result Toast */}
      {cronResult && (
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-800/80 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Cron Execution Result</span>
            </div>
            <button onClick={() => setCronResult(null)} className="text-xs opacity-70 hover:opacity-100 underline">
              Dismiss
            </button>
          </div>
          <p className="text-slate-300 text-xs">{cronResult.message}</p>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search facility title..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-sm text-white placeholder-slate-600"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Filter className="w-4 h-4" />
            <span>Filter Status:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="AT_RISK">⚠️ AT_RISK Only</option>
            <option value="FULLY_FUNDED">Fully Funded</option>
            <option value="FUNDING">Funding Open</option>
            <option value="CLOSED">Closed / Paid Off</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="created_at-DESC">Newest First</option>
            <option value="loan_amount-DESC">Highest Amount</option>
            <option value="status-ASC">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Paginated Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-3" />
            <p className="text-sm font-medium">Querying server-side dataset...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No loans found matching the current search & risk filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-6">Loan Facility</th>
                  <th className="py-3.5 px-4">Borrower</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Facility Amount</th>
                  <th className="py-3.5 px-4 text-right">Funded Amount</th>
                  <th className="py-3.5 px-4 text-center">Overdue EMIs</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-4 px-6 font-bold text-white text-sm">
                      <Link to={`/loans/${loan.id}`} className="hover:text-cyan-400">
                        {loan.title}
                      </Link>
                      <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                        {loan.interest_rate}% p.a. • {loan.tenure_months} Months
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {loan.borrower?.first_name} {loan.borrower?.last_name}
                      <div className="text-[11px] text-slate-500">{loan.borrower?.email}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border uppercase tracking-wider ${getStatusBadge(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-white text-sm">
                      ₹{loan.loan_amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-emerald-400 font-semibold">
                      ₹{loan.funded_amount.toLocaleString()} ({loan.funded_percentage}%)
                    </td>
                    <td className="py-4 px-4 text-center">
                      {loan.overdue_installments_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800">
                          <AlertTriangle className="w-3 h-3" />
                          {loan.overdue_installments_count} Overdue
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/loans/${loan.id}`}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                      >
                        Inspect Facility
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-400">
            Showing Page <span className="font-bold text-white">{pagination.page}</span> of{" "}
            <span className="font-bold text-white">{pagination.totalPages || 1}</span> ({pagination.total} total facilities)
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Items per page:</span>
              <select
                value={pagination.limit}
                onChange={(e) => setPagination((prev) => ({ ...prev, limit: parseInt(e.target.value, 10), page: 1 }))}
                className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-white text-xs font-semibold"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={!pagination.hasPrevPage}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-200" />
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNextPage}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
