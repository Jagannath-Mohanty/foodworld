import React, { useEffect, useState } from "react";
import "./FoodDisplay.css";
import FoodItem from "../FoodItem/FoodItem";
import CartConflictModal from "../CartConflictModal/CartConflictModal";
import Pagination from "../Pagination/Pagination";

const FoodDisplay = ({ category }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/items?page=${page}&limit=12`)
      .then((res) => (res.ok ? res.json() : { items: [], pagination: null }))
      .then((data) => {
        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setPagination(data.pagination || null);
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [category]);

  // The home category strip uses static names; filter when one actually matches a
  // real category, otherwise fall back to showing everything.
  const matched =
    category && category !== "All"
      ? items.filter(
          (i) => i.categoryId?.name?.toLowerCase() === String(category).toLowerCase()
        )
      : [];
  const list = matched.length ? matched : items;

  return (
    <div className="food-display" id="food-display">
      <p>Top dishes near you</p>

      {loading ? (
        <div className="food-display-state">Loading dishes…</div>
      ) : list.length === 0 ? (
        <div className="food-display-state">No dishes available yet.</div>
      ) : (
        <>
          <div className="food-display-list">
            {list.map((item) => (
              <FoodItem key={item._id} item={item} />
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <CartConflictModal />
    </div>
  );
};

export default FoodDisplay;
