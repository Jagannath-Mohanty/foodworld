import React, { useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount } =
    useContext(StoreContext);
  const navigate = useNavigate();
  const placeOrder = async () => {
    const token = localStorage.getItem("token");
    console.log(token);
    if (!token) {
      navigate("/login");
    }
    try {
      const orderData = {
        items: food_list.filter((item) => cartItems[item._id] > 0),
        totalAmount: getTotalCartAmount(),
      };
      console.log(orderData);

      const response = await fetch("/placeorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderData, token }),
      });

      if (response.ok) {
        window.alert("Order placed successfully");
        console.log(orderData);
        navigate("/");
      } else {
        window.alert("Somthing Went wrong .");
        console.error("Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
    }
  };
  return (
    <div className="cart-file">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Titles</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item, index) => {
          if (cartItems[item._id] > 0) {
            return (
              <>
                <div className="cart-items-title cart-items-item">
                  <img src={item.image} alt="" />
                  <p>{item.name}</p>
                  <p>
                    {item.price} <span className="rupees"> Rs</span>
                  </p>
                  <p>{cartItems[item._id]}</p>
                  <p>
                    {item.price * cartItems[item._id]}
                    <span className="rupees"> Rs</span>
                  </p>
                  <p
                    className="remove"
                    onClick={() => removeFromCart(item._id)}
                  >
                    X
                  </p>
                </div>
                <hr />
              </>
            );
          }
        })}
      </div>
      <hr />
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>
                {getTotalCartAmount()} <span className="rupees"> Rs</span>
              </p>
            </div>
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>
                {getTotalCartAmount() === 0 ? 0 : 20}
                <span className="rupees"> Rs</span>
              </p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                {getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 20}{" "}
                <span className="rupees"> Rs</span>
              </b>
            </div>
          </div>
          {/* <button className="place-order-button">PLACE ORDER</button> */}
        </div>
        {/* <p className="total-amount">TO PAY</p> */}
        <button className="place-order-button" onClick={placeOrder}>
          PLACE ORDER
        </button>
      </div>
    </div>
  );
};

export default Cart;
