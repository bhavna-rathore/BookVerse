import { useContext, useEffect, useState } from "react";
import { Context } from "../../context/Context";
import API from "../../api";
import usePosts from "../../hooks/usePosts";
import Pagination from "../../components/pagination/Pagination";
import "./admin.css";

function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await API.get("/categories");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!newName.trim()) return;
    try {
      await API.post("/categories", { name: newName.trim() });
      setNewName("");
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add category");
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? Posts using it will show no category.`)) return;
    try {
      await API.delete(`/categories/${cat._id}`);
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete category");
    }
  };

  return (
    <div className="adminPanel">
      <h2 className="adminPanelTitle">Categories</h2>

      <form className="adminInlineForm" onSubmit={handleAdd}>
        <input
          type="text"
          className="adminInput"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="adminBtn">Add</button>
      </form>
      {error && <p className="adminError">{error}</p>}

      {loading ? (
        <p className="adminMuted">Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="adminMuted">No categories yet.</p>
      ) : (
        <ul className="adminList">
          {categories.map((c) => (
            <li key={c._id} className="adminListRow">
              <span className="adminListName">{c.name}</span>
              <button className="adminBtn adminBtnDanger" onClick={() => handleDelete(c)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MessagesPanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await API.get("/contact");
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, []);

  return (
    <div className="adminPanel">
      <h2 className="adminPanelTitle">Messages</h2>

      {loading ? (
        <p className="adminMuted">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="adminMuted">No messages yet.</p>
      ) : (
        <ul className="adminList">
          {messages.map((m) => (
            <li key={m._id} className="adminListRow">
              <div className="adminListInfo">
                <span className="adminListName">{m.name} &lt;{m.email}&gt;</span>
                <span className="adminListMeta">{m.message}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PostsPanel() {
  const { posts, loading, page, setPage, hasMore, refresh } = usePosts();
  const [busyId, setBusyId] = useState(null);

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.bookTitle}" by ${post.username}?`)) return;
    setBusyId(post._id);
    try {
      await API.delete(`/posts/${post._id}`);
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete post");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="adminPanel">
      <h2 className="adminPanelTitle">Posts</h2>

      {loading ? (
        <p className="adminMuted">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="adminMuted">No posts found.</p>
      ) : (
        <ul className="adminList">
          {posts.map((p) => (
            <li key={p._id} className="adminListRow">
              <div className="adminListInfo">
                <span className="adminListName">{p.bookTitle}</span>
                <span className="adminListMeta">by {p.username} {p.category && `· ${p.category}`}</span>
              </div>
              <button
                className="adminBtn adminBtnDanger"
                disabled={busyId === p._id}
                onClick={() => handleDelete(p)}
              >
                {busyId === p._id ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} hasMore={hasMore} onChange={setPage} />
    </div>
  );
}

export default function AdminPage() {
  const { user } = useContext(Context);

  if (user?.role !== "admin") {
    return (
      <div className="adminDenied">
        <h2>Admins only</h2>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="adminPage">
      <h1 className="adminTitle">🛠️ Admin Panel</h1>
      <p className="adminSubtitle">Manage categories and moderate posts.</p>
      <div className="adminGrid">
        <CategoriesPanel />
        <PostsPanel />
        <MessagesPanel />
      </div>
    </div>
  );
}
