import axios from "axios";

//Using axios.create() to make a reusable HTTP client.

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api", //baseURL points to your backend’s API endpoint.
  withCredentials: false, // or true if you use cookies
});

export default API;