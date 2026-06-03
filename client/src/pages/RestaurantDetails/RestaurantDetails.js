import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MdStar, MdAccessTime, MdLocationOn, MdAdd, MdRemove } from "react-icons/md";
import { StoreContext } from "../../context/StoreContext";
import CartConflictModal from "../../components/CartConflictModal/CartConflictModal";
import Pagination from "../../components/Pagination/Pagination";
import "./RestaurantDetails.css";

const RestaurantDetails = () => {
  const { id } = useParams();
  const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);

  const [restaurant, setRestaurant] = useState(null);
  const [grouped, setGrouped] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [rRes, mRes] = await Promise.all([
          fetch(`/api/restaurants/${id}`),
          fetch(`/api/restaurants/${id}/menu?page=${page}&limit=12`),
        ]);
        if (!rRes.ok) throw new Error("Restaurant not found");
        if (!mRes.ok) throw new Error("Menu unavailable");

        const r = await rRes.json();
        const m = await mRes.json();

        if (cancelled) return;
        setRestaurant(r);
        setGrouped(m.grouped || {});
        setPagination(m.pagination || null);
        const firstCat = Object.keys(m.grouped || {})[0];
        if (firstCat) setActiveCategory(firstCat);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, page]);

  useEffect(() => {
    setPage(1);
  }, [id]);

  if (loading) {
    return <div className="rd-state">Loading restaurant…</div>;
  }
  if (error || !restaurant) {
    return <div className="rd-state rd-state-error">{error || "Restaurant not found"}</div>;
  }

  const categories = Object.keys(grouped);

  return (
    <div className="rd-page">
      {/* ===== Hero ===== */}
      <div className="rd-hero">
        <img
          src={restaurant.coverImage || restaurant.image}
          alt={restaurant.name}
          className="rd-hero-image"
        />
        <div className="rd-hero-overlay" />
        <div className="rd-hero-content">
          <h1>{restaurant.name}</h1>
          <p className="rd-cuisines">
            {(restaurant.cuisines || []).join(" · ")}
          </p>
          <p className="rd-address">
            <MdLocationOn /> {restaurant.address?.street}, {restaurant.address?.city}
          </p>
        </div>
      </div>

      {/* ===== Info strip ===== */}
      <div className="rd-info-strip">
        {restaurant.rating?.count > 0 && (
          <div className="rd-info-item">
            <span className="rd-info-icon rd-info-icon-green">
              <MdStar />
            </span>
            <div>
              <div className="rd-info-value">{restaurant.rating.average.toFixed(1)}</div>
              <div className="rd-info-label">{restaurant.rating.count} ratings</div>
            </div>
          </div>
        )}
        {restaurant.avgDeliveryTimeMins && (
          <div className="rd-info-item">
            <span className="rd-info-icon">
              <MdAccessTime />
            </span>
            <div>
              <div className="rd-info-value">{restaurant.avgDeliveryTimeMins} mins</div>
              <div className="rd-info-label">Delivery time</div>
            </div>
          </div>
        )}
        {restaurant.priceForTwo > 0 && (
          <div className="rd-info-item">
            <div>
              <div className="rd-info-value">₹{restaurant.priceForTwo}</div>
              <div className="rd-info-label">Cost for two</div>
            </div>
          </div>
        )}
      </div>

      {/* ===== Category pills ===== */}
      {categories.length > 0 && (
        <div className="rd-category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`rd-pill ${activeCategory === cat ? "rd-pill-active" : ""}`}
              onClick={() => {
                setActiveCategory(cat);
                document.getElementById(`cat-${cat}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ===== Menu sections ===== */}
      <div className="rd-menu">
        {categories.length === 0 && (
          <p className="rd-state">No menu items yet.</p>
        )}

        {categories.map((cat) => (
          <section key={cat} id={`cat-${cat}`} className="rd-menu-section">
            <h2>{cat}</h2>
            <div className="rd-menu-items">
              {grouped[cat].map((item) => {
                const qty = cartItems[item._id] || 0;
                return (
                  <div key={item._id} className="rd-menu-item">
                    <div className="rd-menu-item-info">
                      <div className="rd-menu-item-head">
                        <span className={`rd-veg-dot ${item.isVeg ? "" : "rd-nonveg"}`} />
                        <h3>{item.name}</h3>
                      </div>
                      <p className="rd-menu-item-price">₹{item.price}</p>
                      {item.rating?.count > 0 && (
                        <p className="rd-menu-item-rating">
                          <MdStar /> {item.rating.average.toFixed(1)} ({item.rating.count})
                        </p>
                      )}
                      <p className="rd-menu-item-desc">{item.description}</p>
                    </div>
                    <div className="rd-menu-item-action">
                      <div className="rd-menu-item-image-wrap">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="rd-menu-item-image"
                            loading="lazy"
                          />
                        )}
                        {qty === 0 ? (
                          <button
                            className="rd-add-btn"
                            onClick={() =>
                              addToCart(
                                { ...item, restaurantId: restaurant._id },
                                restaurant._id,
                                restaurant.name
                              )
                            }
                          >
                            ADD
                          </button>
                        ) : (
                          <div className="rd-qty">
                            <button onClick={() => removeFromCart(item._id)}>
                              <MdRemove />
                            </button>
                            <span>{qty}</span>
                            <button
                              onClick={() =>
                                addToCart(
                                  { ...item, restaurantId: restaurant._id },
                                  restaurant._id,
                                  restaurant.name
                                )
                              }
                            >
                              <MdAdd />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      <CartConflictModal />
    </div>
  );
};

export default RestaurantDetails;
