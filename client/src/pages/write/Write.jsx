import { useEffect, useState } from "react";
import "./write.css";
import API from "../../api";

const NEW_CATEGORY_VALUE = "__new__";

export default function WriteBookPost() {
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [keyLearnings, setKeyLearnings] = useState([""]);
  const [whoShouldRead, setWhoShouldRead] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [rating, setRating] = useState("");
  const [bookCover, setBookCover] = useState("");
  const [file, setFile] = useState(null);

  // Categories are a real linked collection, not free text — this is what
  // keeps "Fiction" and "fiction" from ever becoming two different things.
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await API.get("/categories");
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
  }, []);

  const handleAddLearning = () => setKeyLearnings([...keyLearnings, ""]);

  const handleChangeLearning = (i, value) => {
    const arr = [...keyLearnings];
    arr[i] = value;
    setKeyLearnings(arr);
  };

  const resolveCategoryId = async () => {
    if (categoryId !== NEW_CATEGORY_VALUE) return categoryId || undefined;
    if (!newCategoryName.trim()) return undefined;

    try {
      const res = await API.post("/categories", { name: newCategoryName.trim() });
      return res.data._id;
    } catch (err) {
      // Someone else may have just created the same category — fall back to
      // finding it instead of failing the whole post.
      const existing = await API.get("/categories");
      const match = (existing.data || []).find(
        (c) => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      );
      return match?._id;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newPost = {
      bookTitle: bookTitle,
      author,
      categoryId: await resolveCategoryId(),
      rating: Number(rating),
      summary,
      keyLearnings: keyLearnings.filter((k) => k.trim() !== ""),
      whoShouldRead,
      bookCover: bookCover || "",
    };

    // upload file if any
    if (file) {
      const data = new FormData();
      data.append("file", file);
      try {
        const uploadRes = await API.post(`/upload`, data);
        newPost.bookCover = uploadRes.data.filename;
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Cover image upload failed. You can still publish without it.");
      }
    }

    try {
      const res =await API.post(`/posts`, newPost);
      window.location.replace(`/post/${res.data._id}`);
    } catch (err) {
      console.error("Post creation failed", err);
      alert("Failed to publish. Please try again.");
    }
  };

  return (
    <div className="write-container">
      <form className="write-form" onSubmit={handleSubmit}>
        <h2 className="write-heading">📚 Add a New Book Review</h2>

        <div className="cover-upload">
          <label htmlFor="fileInput" className="cover-label">
            <i className="fa-solid fa-image"></i> Upload Cover
          </label>
          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file && (
            <img
              className="preview-img"
              src={URL.createObjectURL(file)}
              alt="Preview"
            />
          )}
        </div>

        <input
          type="text"
          className="write-input"
          placeholder="Book Cover URL (optional)"
          value={bookCover}
          onChange={(e) => setBookCover(e.target.value)}
        />

        <input
          type="text"
          className="write-input"
          placeholder="Book Title *"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          required
        />

        <input
          type="text"
          className="write-input"
          placeholder="Author *"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />

        <select
          className="write-input"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
          <option value={NEW_CATEGORY_VALUE}>+ Add new category…</option>
        </select>

        {categoryId === NEW_CATEGORY_VALUE && (
          <input
            type="text"
            className="write-input"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        )}

        <input
          type="number"
          className="write-input"
          placeholder="Rating (0–5)"
          value={rating}
          min="0"
          max="5"
          onChange={(e) => setRating(e.target.value)}
        />

        <textarea
          className="write-textarea"
          placeholder="Write a short summary..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
        />

        <textarea
          className="write-textarea"
          placeholder="Who should read this book?"
          value={whoShouldRead}
          onChange={(e) => setWhoShouldRead(e.target.value)}
        />

        <div className="key-section">
          <label><strong>✨ Key Learnings / Quotes</strong></label>
          {keyLearnings.map((k, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Learning #${i + 1}`}
              className="write-input"
              value={k}
              onChange={(e) => handleChangeLearning(i, e.target.value)}
            />
          ))}
          <button type="button" className="add-learning" onClick={handleAddLearning}>
            + Add Another Learning
          </button>
        </div>

        <button className="publish-btn" type="submit">
          🚀 Publish Review
        </button>
      </form>
    </div>
  );
}
