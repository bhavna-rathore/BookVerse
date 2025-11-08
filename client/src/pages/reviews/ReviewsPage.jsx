import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../context/Context';
import Post from '../../components/post/Post';
import './reviews.css';

export default function ReviewsPage() {
  const { user } = useContext(Context);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [filter, setFilter] = useState('all');
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/posts`);
        let data = Array.isArray(res.data) ? res.data : [];

        // Apply filters
        if (filter === 'mine' && user) {
          data = data.filter(review => review.username === user.username);
        }

        // Apply sorting
        data.sort((a, b) => {
          switch (sort) {
            case 'oldest':
              return new Date(a.createdAt) - new Date(b.createdAt);
            case 'rating':
              return (b.rating || 0) - (a.rating || 0);
            case 'newest':
            default:
              return new Date(b.createdAt) - new Date(a.createdAt);
          }
        });

        setReviews(data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [sort, filter, user]);

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
          <div className="reviews-list">
            {reviews.map(review => (
              <Post key={review._id} post={review} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}