import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Context } from "../../context/Context";
import "./topbar.css";
import axios from "axios";
import { useLocation } from "react-router";

export default function TopBar() {
  const { user, dispatch, theme, readerMode } = useContext(Context);
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const PF = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "") + "/images";
  const path = location.pathname.split("/")[2];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const handleLogout = () => dispatch({ type: "LOGOUT" });
  const toggleTheme = () => dispatch({ type: "TOGGLE_THEME" });
  const toggleReader = () => dispatch({ type: "TOGGLE_READER" });
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const res = await axios.get("/categories/");
        const data = Array.isArray(res.data) ? res.data : [];

        const normalized = data.map((c) => ({
          id:
            (c._id && (typeof c._id === "string" ? c._id : c._id.$oid)) ||
            (c.id && (typeof c.id === "string" ? c.id : c.id.$oid)) ||
            String(c._id || c.id || ""),
          name: c.name || "",
          description: c.description || "",
        }));

        setCategories(normalized);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);
  return (
    <div className="topbar">
      <div className="topbarWrapper">
        <div className="topLeft">
          <Link to="/" className="logo">BookVerse</Link>
        </div>

        <nav className="topCenter">
          <Link to="/" className="navLink">Home</Link>

          <div className="navDropdown">
            <button className="navLink dropdownBtn" aria-haspopup="true" aria-expanded="false">
              Categories ▾
            </button>
            <div className="dropdownMenu">
              {categories.length === 0 ? (
                <div className="dropdownItem">No categories</div>
              ) : (
                categories.map((c) => (
                  <Link key={c.id} to={`/category/${c.name}`} className="dropdownItem">
                    {c.name}
                  </Link>
                ))
              )}
            </div>
          </div>

          <Link to="/books" className="navLink">Books</Link>
          <Link to="/reviews" className="navLink">Reviews</Link>
          {user && <Link to="/write" className="navLink">Write Review</Link>}
        </nav>

        <div className="topRight">
          <div className="themeControls">
            <button
              className={`modeBtn themeBtn ${theme === "dark" ? "active" : ""}`}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              <i className={`fas fa-${theme === "light" ? "moon" : "sun"}`}></i>
            </button>
            <button
              className={`modeBtn readerBtn ${readerMode ? "active" : ""}`}
              onClick={toggleReader}
              aria-label="Toggle reader mode"
            >
              <i className="fas fa-book-reader"></i>
            </button>
          </div>

          {user ? (
            <div className="userInfo" ref={menuRef}>
              <img
                className="topImg"
                src={
                  user.profilePic
                    ? `${PF}/${user.profilePic}`
                    : "/defaultAvatar.png"
                }
                alt={user.username}
                onClick={() => setMenuOpen((prev) => !prev)}
              />

              {menuOpen && (
                <div className="userMenu">
                  <Link
                    to="/settings"
                    className="menuItem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="logoutBtn"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="authLinks">
              <Link to="/login" className="loginBtn">
                Login
              </Link>
              <Link to="/register" className="registerBtn">
                Register
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}









