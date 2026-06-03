import React, { useContext } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { Link } from "react-router-dom";

const FoodItem = ({ item }) => {
  const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);

  const id = item._id;
  const restaurantId = item.restaurantId?._id || item.restaurantId;
  const restaurantName = item.restaurantId?.name;
  const qty = cartItems[id] || 0;

  const handleAdd = () =>
    addToCart({ ...item, restaurantId }, restaurantId, restaurantName);

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <Link to={`/item-details/${id}`}>
          {item.image ? (
            <img className="food-item-image" src={item.image} alt={item.name} />
          ) : (
            <div className="food-item-image food-item-image-placeholder">
              No image
            </div>
          )}
        </Link>

        {!qty ? (
          <img
            className="add"
            onClick={handleAdd}
            src={assets.add_icon_white}
            alt="Add"
          />
        ) : (
          <div className="food-item-counter">
            <img
              onClick={() => removeFromCart(id)}
              src={assets.remove_icon_red}
              alt="Remove"
            />
            <p>{qty}</p>
            <img onClick={handleAdd} src={assets.add_icon_green} alt="Add" />
          </div>
        )}
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{item.name}</p>
          <img src={assets.rating_starts} alt="" />
        </div>
        <p className="food-item-desc">{item.description}</p>
        <p className="food-item-price">{item.price} Rs</p>
        {restaurantName && (
          <Link to={`/restaurants/${restaurantId}`} className="food-item-resto">
            {restaurantName}
          </Link>
        )}
      </div>
    </div>
  );
};

export default FoodItem;
