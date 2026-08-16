import { useCallback, useEffect, useState } from "react";
import API from "../api";

// Fetch/create/delete for a single post's comment tree. Same shape as
// usePosts.js (loading state, error handling) for consistency.
export default function useComments(postId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await API.get(`/comments?postId=${postId}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addComment = async (text, parentId = null) => {
    await API.post("/comments", { postId, text, parentId });
    await refresh();
  };

  const deleteComment = async (commentId) => {
    await API.delete(`/comments/${commentId}`);
    await refresh();
  };

  return { comments, loading, addComment, deleteComment };
}
