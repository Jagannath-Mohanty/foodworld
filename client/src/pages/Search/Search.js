import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MdSearch, MdStar, MdAdd, MdRemove } from "react-icons/md";
import { StoreContext } from "../../context/StoreContext";
import CartConflictModal from "../../components/CartConflictModal/CartConflictModal";
import Pagination from "../../components/Pagination/Pagination";
import "./Search.css";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);

  const [input, setInput] = useState(q);
  const [data, setData] = useState({ mode: "all", restaurants: [], categories: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // keep the input in sync when the URL query changes (e.g. from the navbar search)
  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/items?q=${encodeURIComponent(q)}&page=${page}&limit=12`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load items");
        const json = await res.json();
        setData(json);
        setPagination(json.pagination || null);
        setActiveCat("all"); // reset category filter on a new query
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [q, page]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    setSearchParams(input.trim() ? { q: input.trim() } : {});
  };

  const visibleItems = useMemo(() => {
    if (activeCat === "all") return data.items;
    return data.items.filter((it) => String(it.categoryId?._id) === activeCat);
  }, [data.items, activeCat]);

  const heading =
    data.mode === "restaurant" && data.restaurants[0]
      ? data.restaurants[0].name
      : q
      ? `Results for “${q}”`
      : "All dishes";

  return (
    <div className="search-page">
      <form className="search-bar-big" onSubmit={submit} role="search">
        <MdSearch className="search-bar-big-icon" />
        <input
          type="text"
          placeholder="Search dishes, categories or restaurants"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="search-bar-big-btn">Search</button>
      </form>

      {/* Restaurant banner when the query resolved to a restaurant */}
      {data.mode === "restaurant" && data.restaurants[0] && (
        <Link to={`/restaurants/${data.restaurants[0]._id}`} className="search-resto-banner">
          {data.restaurants[0].image && (
            <img src={data.restaurants[0].image} alt={data.restaurants[0].name} />
          )}
          <div>
            <h2>{data.restaurants[0].name}</h2>
            <p>{(data.restaurants[0].cuisines || []).slice(0, 4).join(" · ")}</p>
          </div>
        </Link>
      )}

      <h1 className="search-heading">{heading}</h1>

      {/* ===== Category section ===== */}
      {data.categories.length > 0 && (
        <div className="search-categories">
          <button
            className={`search-cat-chip ${activeCat === "all" ? "active" : ""}`}
            onClick={() => setActiveCat("all")}
          >
            All ({data.items.length})
          </button>
          {data.categories.map((c) => {
            const count = data.items.filter((it) => String(it.categoryId?._id) === String(c._id)).length;
            return (
              <button
                key={c._id}
                className={`search-cat-chip ${activeCat === String(c._id) ? "active" : ""}`}
                onClick={() => setActiveCat(String(c._id))}
              >
                {c.name}
                {data.mode === "category" && c.restaurantName ? ` · ${c.restaurantName}` : ""} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ===== Menu section ===== */}
      {loading ? (
        <div className="search-state">Loading…</div>
      ) : error ? (
        <div className="search-state search-state-error">{error}</div>
      ) : visibleItems.length === 0 ? (
        <div className="search-state">No dishes found{q ? ` for “${q}”` : ""}.</div>
      ) : (
        <>
          <div className="search-items">
            {visibleItems.map((item) => {
              const rid = item.restaurantId?._id || item.restaurantId;
              const rname = item.restaurantId?.name;
              const qty = cartItems[item._id] || 0;
              return (
                <article key={item._id} className="search-item">
                <div className="search-item-info">
                  <div className="search-item-head">
                    <span className={`search-veg-dot ${item.isVeg ? "" : "nonveg"}`} />
                    <h3>{item.name}</h3>
                  </div>
                  <p className="search-item-price">₹{item.price}</p>
                  {item.rating?.count > 0 && (
                    <p className="search-item-rating">
                      <MdStar /> {item.rating.average.toFixed(1)} ({item.rating.count})
                    </p>
                  )}
                  {item.description && <p className="search-item-desc">{item.description}</p>}
                  {rname && (
                    <Link to={`/restaurants/${rid}`} className="search-item-resto">
                      {rname}
                    </Link>
                  )}
                </div>
                <div className="search-item-action">
                  {item.image && <img src={item.image} alt={item.name} loading="lazy" />}
                  {qty === 0 ? (
                    <button
                      className="search-add-btn"
                      onClick={() => addToCart({ ...item, restaurantId: rid }, rid, rname)}
                    >
                      ADD
                    </button>
                  ) : (
                    <div className="search-qty">
                      <button onClick={() => removeFromCart(item._id)}><MdRemove /></button>
                      <span>{qty}</span>
                      <button onClick={() => addToCart({ ...item, restaurantId: rid }, rid, rname)}>
                        <MdAdd />
                      </button>
                    </div>
                  )}
                </div>
                </article>
              );
            })}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <CartConflictModal />
    </div>
  );
};

export default Search;
