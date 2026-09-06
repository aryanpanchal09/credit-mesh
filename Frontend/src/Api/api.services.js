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
