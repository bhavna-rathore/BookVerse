import { useContext, useState } from "react";
import axios from "axios";
import "./write.css";
import { Context } from "../../context/Context";

export default function WriteBookPost() {
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [keyLearnings, setKeyLearnings] = useState([""]);
  const [whoShouldRead, setWhoShouldRead] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState("");
  const [bookCover, setBookCover] = useState("");
  const [file, setFile] = useState(null);
  const { user } = useContext(Context);

  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleAddLearning = () => setKeyLearnings([...keyLearnings, ""]);

  const handleChangeLearning = (i, value) => {
    const arr = [...keyLearnings];
    arr[i] = value;
    setKeyLearnings(arr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newPost = {
      username: user?.username || "guest",
      bookTitle: bookTitle,
      author,
      category,
      rating: Number(rating),
      summary,
      keyLearnings: keyLearnings.filter((k) => k.trim() !== ""),
      whoShouldRead,
      bookCover: bookCover || "",
    };

    // upload file if any
    if (file) {
      const data = new FormData();
      const filename = Date.now() + file.name;
      data.append("name", filename);
      data.append("file", file);
      newPost.bookCover = filename;
      try {
        await axios.post(`/upload`, data);
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    }

    try {
      const res = await axios.post(`/posts`, newPost);
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

        <input
          type="text"
          className="write-input"
          placeholder="Category (e.g., Self Growth, Productivity)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

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
