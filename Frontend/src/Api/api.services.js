import AxiosClientApi from "./axios.services";

export const loginApi = (credentials) => {
  return AxiosClientApi.post("/auth/login", credentials);
};

export const registerApi = (userData) => {
  return AxiosClientApi.post("/auth/register", userData);
};

export const getMeApi = () => {
  return AxiosClientApi.get("/auth/me");
};

export const getLoansApi = () => {
  return AxiosClientApi.get("/loans");
};

export const getLoanByIdApi = (id) => {
  return AxiosClientApi.get(`/loans/${id}`);
};

export const commitFundingApi = (id, amount) => {
  return AxiosClientApi.post(`/loans/${id}/commit`, { amount });
};

// Phase 4: Repayment & Risk APIs
export const payInstallmentApi = (loan_id, installment_no) => {
  return AxiosClientApi.post("/repayments/pay", { loan_id, installment_no });
};

export const getRepaymentLedgerApi = (loan_id) => {
  return AxiosClientApi.get(`/repayments/ledger/${loan_id}`);
};

export const getRiskLoansApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return AxiosClientApi.get(`/risk/loans?${query}`);
};

export const getPartnerExposureApi = () => {
  return AxiosClientApi.get("/risk/partner-exposure");
};

export const triggerRiskCronApi = () => {
  return AxiosClientApi.post("/risk/run-cron");
};
