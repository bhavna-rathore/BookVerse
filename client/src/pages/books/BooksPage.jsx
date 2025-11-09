import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Post from '../../components/post/Post';
import './books.css';
import API from '../../api';

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/posts`);
        const data = Array.isArray(res.data) ? res.data : [];

        // Sort books based on selection
        const sorted = [...data].sort((a, b) => {
          if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
          if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
          return 0;
        });

        setBooks(sorted);
      } catch (err) {
        console.error('Failed to fetch books:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [sort]);

  return (
    <div className="books-page">
      <header className="books-header">
        <div className="header-content">
          <h1>Book Reviews</h1>
          <div className="controls">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </header>

      <main className="books-content">
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-books"></i>
            <h2>No books found</h2>
            <p>Be the first to add a book review!</p>
          </div>
        ) : (
          <div className="books-grid">
            {books.map(book => (
              <div key={book._id} className="book-card">
                <Post post={book} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}