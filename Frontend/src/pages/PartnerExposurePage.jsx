import React, { useEffect, useState } from "react";
import { getPartnerExposureApi } from "../Api/api.services";
import { Building2, ShieldAlert, TrendingUp, DollarSign, Coins, Loader2 } from "lucide-react";

export const PartnerExposurePage = () => {
  const [exposureList, setExposureList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExposure = async () => {
    try {
      setLoading(true);
      const res = await getPartnerExposureApi();
      if (res && res.data) {
        setExposureList(res.data);
      }
    } catch (err) {
      console.error("[PartnerExposurePage] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExposure();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
          <Building2 className="w-4 h-4" />
          Multi-Tenant Portfolio Analytics
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Lending Partner Exposure Dashboard
        </h1>
        <p className="mt-2 text-slate-400 text-sm max-w-2xl">
          Live visibility into portfolio capital exposure, principal repayments received, interest earned, and at-risk loan commitments across lending partners.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-3" />
          <p className="text-sm font-medium">Calculating tenant portfolio exposure...</p>
        </div>
      ) : exposureList.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          No tenant portfolio data found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {exposureList.map((item) => (
            <div
              key={item.tenant_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-xl text-white">{item.tenant_name}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Tenant Code: <span className="text-cyan-400 font-semibold">{item.tenant_code}</span> • {item.contact_email}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400 font-bold text-sm">
                    {item.tenant_code?.slice(-1) || "T"}
                  </div>
                </div>

                {/* Main Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Total Capital Committed</span>
                    <div className="text-xl font-extrabold text-white mt-1">
                      ₹{item.total_committed.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Across {item.active_commitments_count} loan facilities</div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Outstanding Exposure</span>
                    <div className="text-xl font-extrabold text-amber-400 mt-1">
                      ₹{item.outstanding_exposure.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Net unpaid principal balance</div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Principal Repaid</span>
                    <div className="text-xl font-extrabold text-emerald-400 mt-1">
                      ₹{item.principal_repaid.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-500/80 mt-1">Recovered principal</div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Interest Earned</span>
                    <div className="text-xl font-extrabold text-cyan-400 mt-1">
                      ₹{item.interest_earned.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-cyan-500/80 mt-1">Net yield generated</div>
                  </div>
                </div>

                {/* At-Risk Warning Box */}
                {item.at_risk_exposure > 0 ? (
                  <div className="mt-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                      <span>At-Risk Exposure Flagged</span>
                    </div>
                    <span className="font-extrabold text-sm text-red-400">
                      ₹{item.at_risk_exposure.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="mt-6 p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>0 At-Risk Exposure • Healthy Tenant Portfolio</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
