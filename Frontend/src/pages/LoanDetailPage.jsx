import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getLoanByIdApi, commitFundingApi } from "../Api/api.services";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../auth/AuthContext";
import {
  ArrowLeft,
  Coins,
  ShieldAlert,
  CheckCircle2,
  Lock,
  TrendingUp,
  Building,
  User,
  Calendar,
  AlertCircle,
  Sparkles,
  Loader2,
  Table,
} from "lucide-react";

export const LoanDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, joinLoanRoom, leaveLoanRoom } = useSocket();

  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commitAmount, setCommitAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [activeTab, setActiveTab] = useState("commitments"); // 'commitments' | 'amortization'

  const fetchLoanDetail = async () => {
    try {
      setLoading(true);
      const res = await getLoanByIdApi(id);
      if (res && res.data) {
        setLoan(res.data);
      }
    } catch (err) {
      console.error("[LoanDetailPage] Fetch error:", err);
      setMessage({ type: "error", text: "Failed to load loan details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanDetail();
  }, [id]);

  // Join Socket.io room for real-time live funding updates
  useEffect(() => {
    if (!id) return;
    joinLoanRoom(id);

    return () => {
      leaveLoanRoom(id);
    };
  }, [id]);

  // Listen to Socket.io events
  useEffect(() => {
    if (!socket) return;

    const handleFundingUpdate = (data) => {
      console.log("[LoanDetailPage] Socket funding_updated received:", data);
      if (data.loan_id.toString() === id.toString()) {
        setLoan((prevLoan) => {
          if (!prevLoan) return prevLoan;

          const updatedCommitments = data.new_commitment
            ? [data.new_commitment, ...(prevLoan.commitments || [])]
            : prevLoan.commitments;

          return {
            ...prevLoan,
            funded_amount: data.funded_amount,
            remaining_amount: data.remaining_amount,
            funded_percentage: data.funded_percentage,
            status: data.status,
            commitments: updatedCommitments,
          };
        });

        // Re-fetch loan details if fully funded to load generated amortization schedule
        if (data.status === "FULLY_FUNDED") {
          fetchLoanDetail();
        }
      }
    };

    socket.on("funding_updated", handleFundingUpdate);

    return () => {
      socket.off("funding_updated", handleFundingUpdate);
    };
  }, [socket, id]);

  const handleCommitSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const numericAmount = parseFloat(commitAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid commitment amount." });
      return;
    }

    if (numericAmount > loan.remaining_amount) {
      setMessage({
        type: "error",
        text: `Commitment amount (₹${numericAmount.toLocaleString()}) exceeds remaining amount required (₹${loan.remaining_amount.toLocaleString()}).`,
      });
      return;
    }

    // Optimistic UI state backup
    const previousLoanState = { ...loan };

    try {
      setIsSubmitting(true);

      // Optimistic update
      const newFunded = loan.funded_amount + numericAmount;
      const newRemaining = Math.max(0, loan.loan_amount - newFunded);
      const newPercentage = Math.min(100, parseFloat(((newFunded / loan.loan_amount) * 100).toFixed(2)));

      setLoan((prev) => ({
        ...prev,
        funded_amount: newFunded,
        remaining_amount: newRemaining,
        funded_percentage: newPercentage,
        status: newFunded >= loan.loan_amount ? "FULLY_FUNDED" : prev.status,
      }));

      const res = await commitFundingApi(id, numericAmount);

      if (res && res.status === 200) {
        setMessage({
          type: "success",
          text: res.message || `Successfully committed ₹${numericAmount.toLocaleString()} to facility!`,
        });
        setCommitAmount("");
        fetchLoanDetail(); // Refresh authoritative DB state
      } else {
        // Rollback optimistic update
        setLoan(previousLoanState);
        setMessage({ type: "error", text: res?.message || "Commitment rejected by server." });
      }
    } catch (err) {
      // Rollback optimistic update on failure
      setLoan(previousLoanState);
      console.error("[LoanDetailPage] Commit error:", err);
      setMessage({
        type: "error",
        text: err?.message || "Race condition or server error. Commitment rejected.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPercent = (pct) => {
    if (!loan) return;
    const amount = Math.floor((loan.loan_amount * pct) / 100);
    const validAmount = Math.min(amount, loan.remaining_amount);
    setCommitAmount(validAmount.toString());
  };

  const handleFillRemaining = () => {
    if (!loan) return;
    setCommitAmount(loan.remaining_amount.toString());
  };

  if (loading && !loan) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-3" />
        <p className="text-sm font-medium">Loading loan facility details...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="py-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
        Loan facility not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        to="/loans"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Syndication Marketplace
      </Link>

      {/* Message Toast */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            message.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
              : "bg-red-950/80 border-red-800 text-red-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Loan Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Loan Syndication Facility
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold uppercase ${
                  loan.status === "FULLY_FUNDED"
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                    : "bg-cyan-950/80 text-cyan-400 border-cyan-800"
                }`}
              >
                {loan.status === "FULLY_FUNDED" ? "100% Fully Funded" : loan.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{loan.title}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Borrower: <span className="text-slate-200 font-medium">{loan.borrower?.first_name} {loan.borrower?.last_name}</span> ({loan.borrower?.email})
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-right">
            <div className="text-xs text-slate-400 uppercase font-semibold">Total Facility Required</div>
            <div className="text-2xl font-extrabold text-cyan-400">₹{parseFloat(loan.loan_amount).toLocaleString()}</div>
          </div>
        </div>

        {/* Real-Time Animated Progress Bar */}
        <div className="space-y-3 bg-slate-950/60 p-6 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-sm font-semibold">
            <div className="flex items-center gap-2 text-white">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Live Funding Progress</span>
            </div>
            <span className="text-cyan-400 text-lg font-bold">{loan.funded_percentage}%</span>
          </div>

          <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                loan.funded_percentage >= 100
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50"
                  : "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 animate-pulse"
              }`}
              style={{ width: `${loan.funded_percentage}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
            <div>
              <span className="text-slate-400">Funded Amount:</span>
              <div className="font-bold text-emerald-400 text-sm">₹{parseFloat(loan.funded_amount).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-slate-400">Remaining Amount:</span>
              <div className="font-bold text-amber-400 text-sm">₹{parseFloat(loan.remaining_amount).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-slate-400">Interest Rate:</span>
              <div className="font-bold text-white text-sm">{loan.interest_rate}% p.a.</div>
            </div>
            <div>
              <span className="text-slate-400">Tenure:</span>
              <div className="font-bold text-white text-sm">{loan.tenure_months} Months</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Funding Panel & History/Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Commitment Action Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-24">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Coins className="w-5 h-5 text-cyan-400" />
              Commit Partner Capital
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Participate in this co-lending pool. Transaction uses row-level database locking to prevent over-funding.
            </p>

            {loan.status === "FULLY_FUNDED" ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span className="font-bold">Facility 100% Fully Funded!</span>
                <p className="text-xs opacity-80 mt-1">
                  Amortization schedule generated. No further commitments accepted.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCommitSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Commitment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={commitAmount}
                    onChange={(e) => setCommitAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 200000)"
                    min="1"
                    max={loan.remaining_amount}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-white font-semibold placeholder-slate-600"
                  />
                </div>

                {/* Preset Quick Fill Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(10)}
                    className="py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition"
                  >
                    10%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(25)}
                    className="py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(50)}
                    className="py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={handleFillRemaining}
                    className="py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 rounded-lg text-xs font-bold text-cyan-300 transition"
                  >
                    Max
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !commitAmount}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Lock...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Commit Capital Now
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tenant Info */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
              <div>
                Signing Partner: <span className="text-slate-200 font-semibold">{user?.tenant_name || "Apex Capital (Default)"}</span>
              </div>
              <div>
                User Account: <span className="text-slate-200">{user?.first_name} {user?.last_name} ({user?.role_name})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabs (Commitments History vs Amortization Schedule) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Selection Header */}
          <div className="flex border-b border-slate-800 gap-4">
            <button
              onClick={() => setActiveTab("commitments")}
              className={`pb-3 font-semibold text-sm transition border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "commitments"
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Coins className="w-4 h-4" />
              Partner Commitments ({loan.commitments?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab("amortization")}
              className={`pb-3 font-semibold text-sm transition border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "amortization"
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Table className="w-4 h-4" />
              Amortization Schedule {loan.status === "FULLY_FUNDED" && "(Generated)"}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "commitments" ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Syndication Commitment History</h3>

              {!loan.commitments || loan.commitments.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No capital commitments submitted for this loan facility yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <th className="pb-3">Lending Tenant</th>
                        <th className="pb-3">Investor</th>
                        <th className="pb-3 text-right">Amount Committed</th>
                        <th className="pb-3 text-right">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {loan.commitments.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/50">
                          <td className="py-3.5 font-semibold text-cyan-400">
                            {c.tenant?.name || "Lending Partner"}
                          </td>
                          <td className="py-3.5 text-slate-200">
                            {c.investor?.first_name} {c.investor?.last_name}
                          </td>
                          <td className="py-3.5 text-right font-extrabold text-white text-sm">
                            ₹{parseFloat(c.amount).toLocaleString()}
                          </td>
                          <td className="py-3.5 text-right text-slate-400">
                            {new Date(c.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Server-Generated Amortization Schedule</h3>

              {!loan.amortization_schedules || loan.amortization_schedules.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Lock className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-medium text-slate-300">Amortization Schedule Locked</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    The EMI amortization schedule will be automatically calculated server-side and generated as soon as the loan reaches 100% full funding.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <th className="pb-3">Inst #</th>
                        <th className="pb-3">Due Date</th>
                        <th className="pb-3 text-right">EMI Amount</th>
                        <th className="pb-3 text-right">Principal</th>
                        <th className="pb-3 text-right">Interest</th>
                        <th className="pb-3 text-right">Balance</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {loan.amortization_schedules.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-850/50">
                          <td className="py-3 font-bold text-slate-300">#{item.installment_no}</td>
                          <td className="py-3 text-slate-300">{item.due_date}</td>
                          <td className="py-3 text-right font-extrabold text-cyan-400">
                            ₹{parseFloat(item.emi_amount).toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-emerald-400 font-medium">
                            ₹{parseFloat(item.principal_amount).toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-amber-400 font-medium">
                            ₹{parseFloat(item.interest_amount).toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-slate-400">
                            ₹{parseFloat(item.remaining_balance).toLocaleString()}
                          </td>
                          <td className="py-3 text-center">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
