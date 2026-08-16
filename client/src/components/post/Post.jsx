import "./post.css"
import { Link } from "react-router-dom";
import { useContext } from "react";
import { Context } from "../../context/Context";
import { IMAGE_BASE_URL } from "../../api";

export default function Post({ post }) {
  const { theme, readerMode } = useContext(Context);
  const defaultCover = "https://cdn-icons-png.flaticon.com/512/29/29302.png";
  const imgSrc = post?.bookCover
    ? (/^https?:\/\//i.test(String(post.bookCover)) ? post.bookCover : IMAGE_BASE_URL + post.bookCover)
    : defaultCover;

  const rootClass = [
    "post",
    theme === "dark" ? "post--dark" : "post--light",
    readerMode ? "post--reader" : ""
  ].join(" ");

  return (
    <div className={rootClass}>
      <div className="postCover">
        <img
          className="postImg"
          src={imgSrc}
          alt={post?.bookTitle || "book cover"}
          loading="lazy"
        />
      </div>
      <Link to={`/post/${post?._id}`} className="link">
        <div className="postBody">
          <div className="postInfo">
            {post?.category && (
              <div className="postCats">
                <span className="postCat">{post.category}</span>
              </div>
            )}
            <span className="postTitle">{post?.bookTitle || post?.title}</span>
            <hr />
            <span className="postDate">{post?.createdAt ? new Date(post.createdAt).toDateString() : ""}</span>
          </div>
          <div className="postMeta">
            <div className="postAuthor"><strong>Author:</strong> {post?.author}</div>

            <div className="postRating">
              <strong>Rating:</strong>
              {Array.from({ length: Math.max(0, Math.min(5, post?.rating || 0)) }).map((_, i) => (
                <span key={i} className="star">★</span>
              ))}
              <span className="ratingValue">({post?.rating ?? "—"}/5)</span>
            </div>

            <div className="postSummary">
              <strong>Summary:</strong>
              <p>{post?.summary || post?.desc || "No summary provided."}</p>
            </div>

            {(post?.keyLearnings || post?.keyTakeaways)?.length > 0 && (
              <div className="postKeyLearnings">
                <strong>Key learnings / quotes:</strong>
                <ul>
                  {(post.keyLearnings || post.keyTakeaways || []).map((k, i) => <li key={i}>{k}</li>)}
                </ul>
              </div>
            )}

            {post?.whoShouldRead && (
              <div className="postAudience"><strong>Who should read this:</strong> {post.whoShouldRead}</div>
            )}

          </div>
        </div>
      </Link>
    </div>
  );
}


