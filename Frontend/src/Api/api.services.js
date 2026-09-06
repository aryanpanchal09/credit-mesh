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
