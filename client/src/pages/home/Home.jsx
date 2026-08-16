import Header from '../../components/header/Header';
import Posts from "../../components/posts/Posts";
import Pagination from "../../components/pagination/Pagination";
import "./home.css";
import { useLocation } from "react-router";
import usePosts from "../../hooks/usePosts";

export default function Home() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const category = params.get("cat") || params.get("category") || undefined;
  const username = params.get("user") || undefined;

  const { posts, loading, page, setPage, hasMore } = usePosts({ category, username });

  return (
    <>
      <Header />
      <div className="home">
        {loading ? (
          <p className="homeStatus">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="homeStatus">No posts found.</p>
        ) : (
          <Posts posts={posts} />
        )}
      </div>
      {!loading && posts.length > 0 && (
        <Pagination page={page} hasMore={hasMore} onChange={setPage} />
      )}
    </>
  );
}
