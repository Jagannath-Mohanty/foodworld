import React from "react";
import { Link } from "react-router-dom";
import { MdStar, MdAccessTime } from "react-icons/md";
import "./RestaurantCard.css";

const RestaurantCard = ({ restaurant }) => {
  const {
    _id,
    name,
    image,
    cuisines = [],
    rating = { average: 0, count: 0 },
    avgDeliveryTimeMins,
    priceForTwo,
    address,
    tags = [],
    isVegOnly,
  } = restaurant;

  return (
    <Link to={`/restaurants/${_id}`} className="rc-link">
      <article className="rc">
        <div className="rc-image-wrap">
          <img src={image} alt={name} className="rc-image" loading="lazy" />
          {tags.length > 0 && (
            <span className="rc-tag">{tags[0]}</span>
          )}
          {isVegOnly && <span className="rc-veg-badge">PURE VEG</span>}
        </div>

        <div className="rc-body">
          <div className="rc-row-1">
            <h3 className="rc-name">{name}</h3>
            {rating.count > 0 && (
              <span className="rc-rating">
                <MdStar /> {rating.average.toFixed(1)}
              </span>
            )}
          </div>

          <p className="rc-cuisines">
            {cuisines.slice(0, 3).join(" · ")}
          </p>

          <div className="rc-meta">
            {avgDeliveryTimeMins != null && (
              <span className="rc-meta-item">
                <MdAccessTime /> {avgDeliveryTimeMins} mins
              </span>
            )}
            {priceForTwo > 0 && (
              <span className="rc-meta-item">₹{priceForTwo} for two</span>
            )}
          </div>

          {address?.city && (
            <p className="rc-location">{address.city}</p>
          )}
        </div>
      </article>
    </Link>
  );
};

export default RestaurantCard;
