import React from "react";

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginTop: 18,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        Page {page} of {totalPages} · {total} total
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn btn-secondary btn-sm" disabled={!pagination.hasPrevPage} onClick={() => onPageChange(page - 1)}>
          Prev
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={!pagination.hasNextPage} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
