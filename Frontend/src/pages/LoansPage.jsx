import React, { useEffect, useState } from "react";
import { getLoansApi } from "../Api/api.services";
import { Link } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { Coins, Percent, Calendar, ArrowRight, CheckCircle2, TrendingUp, Sparkles, Loader2 } from "lucide-react";

export const LoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const { socket } = useSocket();

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await getLoansApi();
      if (res && res.data) {
        setLoans(res.data);
      }
    } catch (err) {
      console.error("[LoansPage] Fetch error:", err);
      setErrorMsg("Failed to load loan syndication marketplace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Real-time socket updates for loan progress across marketplace
  useEffect(() => {
    if (!socket) return;

    const handleFundingUpdate = (data) => {
      console.log("[LoansPage] Socket funding_updated received:", data);
      setLoans((prevLoans) =>
        prevLoans.map((loan) => {
          if (loan.id === data.loan_id) {
            return {
              ...loan,
              funded_amount: data.funded_amount,
              remaining_amount: data.remaining_amount,
              funded_percentage: data.funded_percentage,
              status: data.status,
            };
          }
          return loan;
        })
      );
    };

    socket.on("funding_updated", handleFundingUpdate);

    return () => {
      socket.off("funding_updated", handleFundingUpdate);
    };
  }, [socket]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "FUNDING":
        return "bg-cyan-950/80 text-cyan-400 border-cyan-800";
      case "FULLY_FUNDED":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-800";
      case "ACTIVE":
        return "bg-blue-950/80 text-blue-400 border-blue-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
          <Coins className="w-4 h-4" />
          Real-Time Co-Lending Marketplace
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Loan Syndication Marketplace
        </h1>
        <p className="mt-2 text-slate-400 text-sm max-w-2xl">
          Multiple lending partner tenants pool funds to co-lend single commercial facilities.
          Commitments update live in real-time across all connected partner terminals.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-3" />
          <p className="text-sm font-medium">Loading loan pools...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-2xl bg-red-950/50 border border-red-800 text-red-300 text-center">
          {errorMsg}
        </div>
      ) : loans.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          No loan facilities currently open for syndication.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-1"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="font-bold text-lg text-white leading-snug">{loan.title}</h3>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-semibold shrink-0 uppercase tracking-wider ${getStatusBadge(
                      loan.status
                    )}`}
                  >
                    {loan.status === "FULLY_FUNDED" ? "100% Funded" : loan.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-6">
                  Borrower: <span className="text-slate-200 font-medium">{loan.borrower?.first_name} {loan.borrower?.last_name}</span>
                </p>

                {/* Progress Bar */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Funding Progress</span>
                    <span className="text-cyan-400 font-bold">{loan.funded_percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        loan.funded_percentage >= 100
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse"
                      }`}
                      style={{ width: `${loan.funded_percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>Funded: ₹{parseFloat(loan.funded_amount).toLocaleString()}</span>
                    <span>Goal: ₹{parseFloat(loan.loan_amount).toLocaleString()}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/80 mb-6 text-xs">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-slate-400">Interest Rate</div>
                      <div className="font-bold text-white text-sm">{loan.interest_rate}% p.a.</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="text-slate-400">Tenure</div>
                      <div className="font-bold text-white text-sm">{loan.tenure_months} Months</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <Link
                to={`/loans/${loan.id}`}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  loan.status === "FULLY_FUNDED"
                    ? "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-900/50"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20"
                }`}
              >
                {loan.status === "FULLY_FUNDED" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>View Schedule & Audit</span>
                  </>
                ) : (
                  <>
                    <span>Fund Loan Facility</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
