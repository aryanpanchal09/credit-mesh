import axios from "axios";
import Constant from "../utils/constant";

const AxiosClientApi = axios.create({
  baseURL: Constant.API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Bearer token
AxiosClientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(Constant.TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle response data and token expiration
AxiosClientApi.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(Constant.TOKEN_KEY);
      localStorage.removeItem(Constant.USER_KEY);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error?.response?.data || error);
  }
);

export default AxiosClientApi;
