import React, { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RestaurantCard from "../../components/RestaurantCard/RestaurantCard";
import { MdSearch } from "react-icons/md";
import { LocationContext } from "../../context/LocationContext";
import Pagination from "../../components/Pagination/Pagination";
import "./Restaurants.css";

const Restaurants = () => {
  const { location } = useContext(LocationContext);
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [vegOnly, setVegOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRestaurants = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (vegOnly) params.set("isVegOnly", "true");
        if (location?.lat != null && location?.lng != null) {
          params.set("lat", location.lat);
          params.set("lng", location.lng);
          params.set("radius", "10"); // km
        }
        params.set("page", String(page));
        params.set("limit", "12");

        const res = await fetch(`/api/restaurants?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load restaurants");
        const data = await res.json();
        setRestaurants(Array.isArray(data.items) ? data.items : []);
        setPagination(data.pagination || null);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(fetchRestaurants, 250); // debounce
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, vegOnly, page, location?.lat, location?.lng]);

  useEffect(() => {
    setPage(1);
  }, [query, vegOnly, location?.lat, location?.lng]);

  return (
    <div className="restaurants-page">
      <header className="restaurants-header">
        <h1>Restaurants near you</h1>
        <p>Discover the best food from local restaurants</p>
      </header>

      <div className="restaurants-toolbar">
        <div className="restaurants-search">
          <MdSearch className="restaurants-search-icon" />
          <input
            type="text"
            placeholder="Search restaurants or cuisines"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <label className="restaurants-veg-toggle">
          <input
            type="checkbox"
            checked={vegOnly}
            onChange={(e) => setVegOnly(e.target.checked)}
          />
          <span>Pure Veg</span>
        </label>
      </div>

      {error && <div className="restaurants-error">{error}</div>}

      {loading ? (
        <div className="restaurants-loading">Loading restaurants…</div>
      ) : restaurants.length === 0 ? (
        <div className="restaurants-empty">
          No restaurants match your search yet.
        </div>
      ) : (
        <>
          <div className="restaurants-grid">
            {restaurants.map((r) => (
              <RestaurantCard key={r._id} restaurant={r} />
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default Restaurants;
