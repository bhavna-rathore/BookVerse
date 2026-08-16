import { useContext, useState } from "react";
import { Context } from "../../context/Context";

export default function Comment({ comment, depth, onReply, onDelete }) {
  const { user } = useContext(Context);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const canDelete = user && (user.username === comment.username || user.role === "admin");

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onReply(replyText.trim(), comment._id);
    setReplyText("");
    setReplying(false);
  };

  return (
    <div className="comment" style={{ marginLeft: Math.min(depth, 4) * 24 }}>
      <div className="comment-body">
        <span className="comment-author">{comment.username}</span>
        <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
        <p className="comment-text">{comment.text}</p>
        <div className="comment-actions">
          {user && (
            <button type="button" className="comment-action-btn" onClick={() => setReplying((r) => !r)}>
              {replying ? "Cancel" : "Reply"}
            </button>
          )}
          {canDelete && (
            <button type="button" className="comment-action-btn comment-delete" onClick={() => onDelete(comment._id)}>
              {user.role === "admin" && user.username !== comment.username ? "Delete (admin)" : "Delete"}
            </button>
          )}
        </div>

        {replying && (
          <form className="comment-reply-form" onSubmit={submitReply}>
            <textarea
              className="comment-input"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.username}...`}
              rows={2}
              autoFocus
            />
            <button type="submit" className="comment-submit-btn">Post Reply</button>
          </form>
        )}
      </div>

      {comment.replies?.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <Comment key={reply._id} comment={reply} depth={depth + 1} onReply={onReply} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
