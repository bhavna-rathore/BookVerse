import { useLocation } from "react-router";
import { useContext, useEffect, useState } from "react";
import { Context } from "../../context/Context";
import "./singlePost.css";
import axios from "axios";
import { Link } from "react-router-dom";
import API from "../../api";


export default function SinglePost() {
  const location = useLocation();
  const path = location.pathname.split("/")[2];
  const [post, setPost] = useState({});
  const [updateMode, setUpdateMode] = useState(false);

  const [bookTitle, setBookTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [rating, setRating] = useState(0);
  const [whoShouldRead, setWhoShouldRead] = useState("");
  const [myTakeaway, setMyTakeaway] = useState("");
  const [keyTakeaways, setKeyTakeaways] = useState([]);

  const { user } = useContext(Context);
  const PF = "http://localhost:5000/images/";

  // Fetch single post
  useEffect(() => {
    const getPost = async () => {
      try {
        const res = await API.get("/posts/" + path);
        const data = res.data;
        setPost(data);
        setBookTitle(data.bookTitle || data.title || "");
        setSummary(data.summary || data.desc || "");
        setRating(data.rating || 0);
        setWhoShouldRead(data.whoShouldRead || "");
        setMyTakeaway(data.myTakeaway || "");
        setKeyTakeaways(data.keyTakeaways || data.keyLearnings || []);
      } catch (err) {
        console.error("Error loading post:", err);
      }
    };
    getPost();
  }, [path]);

  // Delete post
  const handleDelete = async () => {
    try {

      await API.delete(`/posts/${post._id}?username=${user.username}`);

      window.location.replace("/");
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  // Update post
  const handleUpdate = async () => {
    try {
    await API.put(
        `/posts/${post._id}`,
        {
          username: user.username,
          bookTitle,
          summary,
          rating,
          whoShouldRead,
          myTakeaway,
          keyTakeaways,
        },

      );
      setUpdateMode(false);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  const imgSrc = post?.bookCover
    ? /^https?:\/\//i.test(post.bookCover)
      ? post.bookCover
      : PF + post.bookCover
    : "https://cdn-icons-png.flaticon.com/512/29/29302.png";

  return (
    <div className="singlePostContainer">
      <div className="singlePostCard">
        <div className="singlePostImageWrapper">
          <img src={imgSrc} alt={bookTitle} className="singlePostCover" />
        </div>

        <div className="singlePostContent">
          {updateMode ? (
            <input
              type="text"
              className="singlePostTitleInput"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              autoFocus
            />
          ) : (
            <h1 className="singlePostTitle">
              {bookTitle}
              {post.username === user?.username && (
                <div className="singlePostEdit">
                  <i
                    className="singlePostIcon fa-solid fa-pen-to-square"
                    onClick={() => setUpdateMode(true)}
                    title="Edit"
                  ></i>
                  <i
                    className="singlePostIcon fa-solid fa-trash"
                    onClick={handleDelete}
                    title="Delete"
                  ></i>
                </div>
              )}
            </h1>
          )}

          <div className="singlePostMeta">
            <p>
              <strong>Author:</strong> {post.author || "Unknown"}
            </p>
            <p>
              <strong>Category:</strong> {post.category || "—"}
            </p>

            <p>
              <strong>Rating:</strong>{" "}
              {updateMode ? (
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="ratingInput"
                />
              ) : (
                <>
                  {Array.from({ length: Math.round(rating) }).map((_, i) => (
                    <span key={i} className="star">★</span>
                  ))}
                  <span className="ratingNum"> ({rating}/5)</span>
                </>
              )}
            </p>

            <p>
              <strong>Posted by:</strong>{" "}
              <Link to={`/?user=${post.username}`} className="link">
                {post.username}
              </Link>{" "}
              on {new Date(post.createdAt).toDateString()}
            </p>
          </div>

          {updateMode ? (
            <textarea
              className="singlePostTextInput"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          ) : (
            <p className="singlePostDesc">{summary}</p>
          )}

          {updateMode ? (
            <div className="keyTakeawaysEdit">
              <h3>✨ Key Takeaways</h3>
              {keyTakeaways.map((k, i) => (
                <input
                  key={i}
                  value={k}
                  onChange={(e) => {
                    const updated = [...keyTakeaways];
                    updated[i] = e.target.value;
                    setKeyTakeaways(updated);
                  }}
                />
              ))}
              <button onClick={() => setKeyTakeaways([...keyTakeaways, ""])}>
                + Add Takeaway
              </button>
            </div>
          ) : (
            keyTakeaways.length > 0 && (
              <div className="keyTakeawaysSection">
                <h3>✨ Key Takeaways</h3>
                <ul>{keyTakeaways.map((k, i) => <li key={i}>{k}</li>)}</ul>
              </div>
            )
          )}

          {updateMode ? (
            <>
              <h3>👥 Who Should Read:</h3>
              <textarea
                className="singlePostTextInput"
                value={whoShouldRead}
                onChange={(e) => setWhoShouldRead(e.target.value)}
              />
            </>
          ) : (
            post.whoShouldRead && (
              <div className="whoShouldRead">
                <h3>👥 Who Should Read:</h3>
                <p>{whoShouldRead}</p>
              </div>
            )
          )}

          {updateMode ? (
            <>
              <h3>💭 My Takeaway</h3>
              <textarea
                className="singlePostTextInput"
                value={myTakeaway}
                onChange={(e) => setMyTakeaway(e.target.value)}
              />
            </>
          ) : (
            post.myTakeaway && (
              <div className="myTakeaway">
                <h3>💭 My Takeaway</h3>
                <p>{myTakeaway}</p>
              </div>
            )
          )}

          {updateMode && (
            <div className="editActions">
              <button className="singlePostButton" onClick={handleUpdate}>
                💾 Save
              </button>
              <button
                className="singlePostButton cancel"
                onClick={() => setUpdateMode(false)}
              >
                ✖ Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
