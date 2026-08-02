import axios from "axios";

//Using axios.create() to make a reusable HTTP client.

const API_ROOT = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

// Shared base for statically-served uploads (book covers, profile pics).
export const IMAGE_BASE_URL = API_ROOT.replace(/\/api$/, "") + "/images/";

const API = axios.create({
  baseURL: API_ROOT, //baseURL points to your backend’s API endpoint.
  withCredentials: false, // or true if you use cookies
});

// Attach the JWT (if we have one) to every outgoing request.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;