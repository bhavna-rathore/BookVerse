import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./register.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!username || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`/auth/register`, {
        username,
        email,
        password,
      });

      if (res.data) {
        setSuccess(true);
        setTimeout(() => {
          window.location.replace("/login");
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register">
      <div className="registerCard">
        <h2 className="registerTitle">Create Account ✨</h2>
        <p className="registerSubtitle">Join the community today</p>

        <form className="registerForm" onSubmit={handleSubmit}>
          <div className="inputGroup">
            <label>Username</label>
            <input
              type="text"
              className="registerInput"
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="inputGroup">
            <label>Email</label>
            <input
              type="email"
              className="registerInput"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="inputGroup">
            <label>Password</label>
            <input
              type="password"
              className="registerInput"
              placeholder="Enter your password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="inputGroup">
            <label>Confirm Password</label>
            <input
              type="password"
              className="registerInput"
              placeholder="Re-enter your password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="registerError">{error}</p>}
          {success && <p className="registerSuccess">Account created! Redirecting...</p>}

          <button className="registerButton" type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="registerFooter">
          <span>Already have an account?</span>
          <Link className="registerLoginLink" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
