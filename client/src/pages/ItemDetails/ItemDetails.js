import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { assets } from "../../assets/assets";
import "./ItemDetails.css";
import { FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ItemDetails = () => {
  const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);
  const { id } = useParams();
  const { food_list } = useContext(StoreContext);
  const [rating, setRating] = useState(null);
  const [review, setReview] = useState("");
  const navigate = useNavigate();

  const item = food_list.find((item) => item._id === id);

  if (!item) {
    return <div>Loading...</div>;
  }

  const { _id, name, price, description, image } = item;

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleReviewChange = (event) => {
    setReview(event.target.value);
  };

  const handleSubmit = () => {
    console.log("Rating:", rating);
    console.log("Review:", review);
    console.log("product-Id", _id);
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    } else {
      console.log("---------->>>>>> " + token);
    }

    navigate("/cart");
    const response = fetch("/rating", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        _id,
        name,
        rating,
        review,
        token,
      }),
    });
  };

  return (
    <div className="food-item-details">
      <div className="food-item-img-container">
        <img className="food-item-details-image" src={image} alt="" />

        {!cartItems[id] ? (
          <img
            className="add"
            onClick={() => addToCart(id)}
            src={assets.add_icon_white}
            alt=""
          />
        ) : (
          <div className="food-item-details-counter">
            <img
              onClick={() => removeFromCart(id)}
              src={assets.remove_icon_red}
              alt=""
            />
            <p>{cartItems[id]}</p>
            <img
              onClick={() => addToCart(id)}
              src={assets.add_icon_green}
              alt=""
            />
          </div>
        )}
      </div>
      <div className="food-item-details-info">
        <div className="food-item-details-name-rating">
          <p>{name}</p>

          <div className="star-rating">
            {[...Array(5)].map((_, index) => {
              const currentRating = index + 1;
              return (
                <FaStar
                  key={index}
                  className="star"
                  size={50}
                  color={currentRating <= rating ? "#ffc107" : "#e4e5e9"}
                  onClick={() => handleRatingChange(currentRating)}
                />
              );
            })}
          </div>
        </div>
        <p className="food-item-details-desc">{description}</p>
        <p className="food-item-details-price">{price} Rs</p>
        <div className="button-container">
          <input
            type="text"
            className="text-box"
            placeholder="Enter text here..."
            onChange={(event) => {
              handleReviewChange(event);
            }}
          />
          <button className="button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
