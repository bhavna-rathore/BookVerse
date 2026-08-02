import { Context } from "../../context/Context";
import { useContext, useRef, useState } from "react";
import { Link } from "react-router-dom"
import "./login.css"
import API from "../../api";

export default function Login() {

  const userRef = useRef();
  const passwordRef = useRef();
  const { dispatch, isFetching } = useContext(Context);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await API.post("/auth/login", {
        username: userRef.current.value,
        password: passwordRef.current.value,
      });
      // Save JWT to localStorage
      if (res.data.token) {
        localStorage.setItem("jwtToken", res.data.token);
      }
      dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
    } catch (err) {
      setError("Invalid username or password");
      dispatch({ type: "LOGIN_FAILURE" });
    }
  };

  return (
    <div className="login">
      <div className="loginCard">
        <h2 className="loginTitle">Welcome Back 👋</h2>
        <p className="loginSubtitle">Login to continue your journey</p>

        <form className="loginForm" onSubmit={handleSubmit}>
          <div className="inputGroup">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="loginInput"
              placeholder="Enter your username"
              ref={userRef}
              required
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="loginInput"
              placeholder="Enter your password"
              ref={passwordRef}
              required
            />
          </div>

          {error && <p className="loginError">{error}</p>}

          <button className="loginButton" type="submit" disabled={isFetching}>
            {isFetching ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="loginFooter">
          <span>Don’t have an account?</span>
          <Link className="loginRegisterLink" to="/register">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

