import "./pagination.css";

export default function Pagination({ page, hasMore, onChange }) {
  if (page === 1 && !hasMore) return null;

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ← Prev
      </button>
      <span className="pagination-page">Page {page}</span>
      <button
        className="pagination-btn"
        disabled={!hasMore}
        onClick={() => onChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}
