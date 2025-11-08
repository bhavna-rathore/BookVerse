import "./settings.css";
import Sidebar from "../../components/sidebar/Sidebar";
import { useContext, useState, useEffect } from "react";
import { Context } from "../../context/Context";
import axios from "axios";

export default function Settings() {
  const { user, dispatch } = useContext(Context);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const PF = "http://localhost:5000/images/";
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      alert("Username and email cannot be empty.");
      return;
    }

    setLoading(true);
    dispatch({ type: "UPDATE_START" });

    const updatedUser = {
      userId: user._id,
      username,
      email,
      ...(password && { password }),
    };

    try {
      if (file) {
        const data = new FormData();
        const filename = Date.now() + file.name;
        data.append("name", filename);
        data.append("file", file);
        updatedUser.profilePic = filename;

        await axios.post(`/upload`, data);
      }

      const res = await axios.put("/users/" + user._id, updatedUser);
      setSuccess(true);
      dispatch({ type: "UPDATE_SUCCESS", payload: res.data });
    } catch (err) {
      console.error("Error updating user:", err.response?.data || err.message);
      dispatch({ type: "UPDATE_FAILURE" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings">
      <div className="settingsWrapper">
        <div className="settingsTitle">
          <span className="settingsUpdateTitle">Update Your Account</span>
        </div>

        <form className="settingsForm" onSubmit={handleSubmit}>
          <label>Profile Picture</label>
          <div className="settingsPP">
            <img
              src={
                file
                  ? URL.createObjectURL(file)
                  : user?.profilePic
                    ? PF + user.profilePic
                    : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
              }
              alt="Profile"
              className="settingsPPImg"
            />
            <label htmlFor="fileInput" className="settingsPPLabel">
              <i className="fa-solid fa-camera"></i> Change
            </label>
            <input
              type="file"
              id="fileInput"
              style={{ display: "none" }}
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>New Password</label>
          <input
            type="password"
            value={password}
            placeholder="Leave blank to keep current password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="settingsSubmit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </button>

          {success && (
            <span className="settingsSuccess">
              ✅ Profile updated successfully.
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
