import React from 'react';
import Post from '../../components/post/Post';
import Pagination from '../../components/pagination/Pagination';
import usePosts from '../../hooks/usePosts';
import './books.css';

export default function BooksPage() {
  const { posts: books, loading, sort, setSort, page, setPage, hasMore } = usePosts();

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
          <>
            <div className="books-grid">
              {books.map(book => (
                <div key={book._id} className="book-card">
                  <Post post={book} />
                </div>
              ))}
            </div>
            <Pagination page={page} hasMore={hasMore} onChange={setPage} />
          </>
        )}
      </main>
    </div>
  );
}
