import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdSearch, MdClose, MdRestaurant, MdRestaurantMenu } from "react-icons/md";
import "./SearchBar.css";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ restaurants: [], dishes: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  /* close on outside click */
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* debounced search */
  useEffect(() => {
    if (!query.trim()) {
      setResults({ restaurants: [], dishes: [] });
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=5`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setResults(data);
      } catch (err) {
        if (err.name !== "AbortError") setResults({ restaurants: [], dishes: [] });
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const submit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  const hasResults = results.restaurants.length + results.dishes.length > 0;

  return (
    <div className="sb" ref={wrapRef}>
      <form className="sb-input-wrap" onSubmit={submit} role="search">
        <MdSearch className="sb-icon" />
        <input
          type="text"
          placeholder="Search for restaurants or dishes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button
            type="button"
            className="sb-clear"
            onClick={() => {
              setQuery("");
              setResults({ restaurants: [], dishes: [] });
            }}
            aria-label="Clear search"
          >
            <MdClose />
          </button>
        )}
      </form>

      {open && query && (
        <div className="sb-dropdown" role="listbox">
          {loading && <div className="sb-state">Searching…</div>}

          {!loading && !hasResults && (
            <div className="sb-state">No results for "{query}"</div>
          )}

          {results.restaurants.length > 0 && (
            <div className="sb-group">
              <div className="sb-group-head">Restaurants</div>
              {results.restaurants.map((r) => (
                <Link
                  key={r._id}
                  to={`/restaurants/${r._id}`}
                  className="sb-row"
                  onClick={() => setOpen(false)}
                >
                  <div className="sb-row-thumb">
                    {r.image ? (
                      <img src={r.image} alt={r.name} />
                    ) : (
                      <MdRestaurant />
                    )}
                  </div>
                  <div className="sb-row-text">
                    <div className="sb-row-title">{r.name}</div>
                    <div className="sb-row-sub">
                      {(r.cuisines || []).slice(0, 3).join(" · ")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.dishes.length > 0 && (
            <div className="sb-group">
              <div className="sb-group-head">Dishes</div>
              {results.dishes.map((d) => {
                const rid = d.restaurantId?._id || d.restaurantId;
                const rname = d.restaurantId?.name;
                return (
                  <Link
                    key={d._id}
                    to={`/restaurants/${rid}`}
                    className="sb-row"
                    onClick={() => setOpen(false)}
                  >
                    <div className="sb-row-thumb">
                      {d.image ? (
                        <img src={d.image} alt={d.name} />
                      ) : (
                        <MdRestaurantMenu />
                      )}
                    </div>
                    <div className="sb-row-text">
                      <div className="sb-row-title">{d.name}</div>
                      <div className="sb-row-sub">
                        ₹{d.price}
                        {rname ? ` · ${rname}` : ""}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
