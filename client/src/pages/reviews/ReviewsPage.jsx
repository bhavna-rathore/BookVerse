import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Context } from '../../context/Context';
import Post from '../../components/post/Post';
import Pagination from '../../components/pagination/Pagination';
import usePosts from '../../hooks/usePosts';
import './reviews.css';

export default function ReviewsPage() {
  const { user } = useContext(Context);
  const [filter, setFilter] = useState('all');

  const {
    posts: reviews,
    loading,
    sort,
    setSort,
    page,
    setPage,
    hasMore,
  } = usePosts({ username: filter === 'mine' ? user?.username : undefined });

  return (
    <div className="reviews-page">
      <header className="reviews-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Book Reviews</h1>
            <p>{reviews.length} reviews shared by our community</p>
          </div>

          <div className="header-controls">
            <div className="filter-controls">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="control-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating">Highest Rated</option>
              </select>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="control-select"
              >
                <option value="all">All Reviews</option>
                {user && <option value="mine">My Reviews</option>}
              </select>
            </div>

            {user && (
              <Link to="/write" className="write-review-btn">
                <i className="fas fa-plus"></i>
                Write Review
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="reviews-content">
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-book-open empty-icon"></i>
            <h2>No reviews found</h2>
            {filter === 'mine' ? (
              <p>You haven't written any reviews yet.</p>
            ) : (
              <p>Be the first to share your thoughts!</p>
            )}
            {user && (
              <Link to="/write" className="write-review-btn">
                Write Your First Review
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="reviews-list">
              {reviews.map(review => (
                <Post key={review._id} post={review} />
              ))}
            </div>
            <Pagination page={page} hasMore={hasMore} onChange={setPage} />
          </>
        )}
      </main>
    </div>
  );
}
