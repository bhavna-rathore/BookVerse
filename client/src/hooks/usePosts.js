import { useCallback, useEffect, useState } from "react";
import API from "../api";

const PAGE_SIZE = 12;

// Shared data-fetching for any "list of book posts" screen. Pulled out of
// BooksPage/ReviewsPage, which used to each reimplement fetch+sort+filter.
export default function usePosts({ username, category, search } = {}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Any change to the filter/sort criteria means the current page is no
  // longer meaningful — go back to page 1 rather than showing a stale page 3.
  useEffect(() => {
    setPage(1);
  }, [username, category, search, sort]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // sort is passed to the API and applied before pagination — sorting an
      // already-paginated page client-side would only reorder the current
      // page, not the full result set.
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
      if (username) params.set("user", username);
      if (category) params.set("category", category);
      if (search) params.set("search", search);

      const res = await API.get(`/posts?${params.toString()}`);
      const data = Array.isArray(res.data) ? res.data : [];

      setPosts(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [username, category, search, sort, page]);

  useEffect(() => {
    let cancelled = false;
    // refresh() sets state internally; the cancelled flag just stops a late
    // response from a previous effect run from clobbering a newer one.
    (async () => {
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { posts, loading, sort, setSort, page, setPage, hasMore, refresh };
}
