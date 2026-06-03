import React, { useState } from "react";
import { MdStar, MdStarBorder } from "react-icons/md";
import "./RatingForm.css";

const RatingForm = ({ order, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Pick a star rating first");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/restaurants/${order.restaurantId._id || order.restaurantId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          orderId: order._id,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit review");
      onSubmitted?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="rf" onSubmit={submit}>
      <h2>Rate your order</h2>
      <p className="rf-sub">How was your experience with this order?</p>

      <div className="rf-stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              className={`rf-star ${active ? "rf-star-on" : ""}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              {active ? <MdStar /> : <MdStarBorder />}
            </button>
          );
        })}
      </div>

      <textarea
        className="rf-textarea"
        placeholder="Tell us more (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />

      {error && <p className="rf-error">{error}</p>}

      <button type="submit" className="rf-submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
};

export default RatingForm;
