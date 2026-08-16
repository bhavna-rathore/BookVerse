import { useContext, useState } from "react";
import { Context } from "../../context/Context";
import useComments from "../../hooks/useComments";
import Comment from "./Comment";
import "./comments.css";

export default function CommentSection({ postId }) {
  const { user } = useContext(Context);
  const { comments, loading, addComment, deleteComment } = useComments(postId);
  const [text, setText] = useState("");

  const submitTopLevel = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addComment(text.trim(), null);
    setText("");
  };

  const countAll = (nodes) =>
    nodes.reduce((sum, n) => sum + 1 + countAll(n.replies || []), 0);

  return (
    <div className="commentSection">
      <h3 className="commentSectionTitle">
        💬 Discussion {comments.length > 0 && `(${countAll(comments)})`}
      </h3>

      {user ? (
        <form className="comment-reply-form" onSubmit={submitTopLevel}>
          <textarea
            className="comment-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts on this review..."
            rows={3}
          />
          <button type="submit" className="comment-submit-btn">Post Comment</button>
        </form>
      ) : (
        <p className="comment-login-prompt">Log in to join the discussion.</p>
      )}

      {loading ? (
        <p className="comment-loading">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="comment-empty">No comments yet — be the first to share your thoughts.</p>
      ) : (
        <div className="comment-list">
          {comments.map((c) => (
            <Comment key={c._id} comment={c} depth={0} onReply={addComment} onDelete={deleteComment} />
          ))}
        </div>
      )}
    </div>
  );
}
