import React, { useContext, useState } from "react";
import "./Cart.css";
import { SiPhonepe, SiGooglepay } from "react-icons/si";
import { MdAccountBalance, MdCreditCard, MdClose } from "react-icons/md";
import { StoreContext } from "../../context/StoreContext";
import { NotificationContext } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import AddressPicker from "../../components/AddressPicker/AddressPicker";

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);

// Online options shown in the modal. They are all processed through Razorpay
// (the only configured gateway); `rzpMethod` pre-selects the method in checkout.
const ONLINE_OPTIONS = [
  { key: "phonepe", label: "PhonePe", icon: <SiPhonepe />, rzpMethod: "upi", color: "#5f259f" },
  { key: "gpay", label: "Google Pay", icon: <SiGooglepay />, rzpMethod: "upi", color: "#1a73e8" },
  { key: "razorpay", label: "Cards / Razorpay", icon: <MdCreditCard />, rzpMethod: undefined, color: "#0c2451" },
  { key: "netbanking", label: "Net Banking", icon: <MdAccountBalance />, rzpMethod: "netbanking", color: "#16a34a" },
];

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window.Razorpay !== "undefined") return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const Cart = () => {
  const {
    cartItemDetails,
    cartRestaurantId,
    cartRestaurantName,
    removeFromCart,
    clearCart,
    getTotalCartAmount,
  } = useContext(StoreContext);
  const { push } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("cod"); // 'cod' | 'online'
  const [showPayModal, setShowPayModal] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState(null); // { line1, city, pincode, label, lat, lng }

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, discount }
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const items = Object.values(cartItemDetails || {});
  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 20;
  const discount = coupon?.discount || 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discount);

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCoupon(null);
        setCouponError(data.error || "Could not apply coupon");
      } else {
        setCoupon({ code: data.code, discount: data.discount });
        setCouponError("");
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  const clearCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  // Validate before placing / before opening the online-payment modal.
  const canCheckout = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return false;
    }
    if (!address?.line1 || !address?.city) {
      push({ type: "error", message: "Please enter your delivery address." });
      return false;
    }
    return true;
  };

  // PLACE ORDER button: COD places immediately; Online opens the options modal.
  const handlePlaceClick = () => {
    if (!canCheckout()) return;
    if (paymentMethod === "cod") {
      placeOrder("cod");
    } else {
      setShowPayModal(true);
    }
  };

  // Online option chosen from the modal → place the order, then start Razorpay
  // (UPI for PhonePe/GPay, netbanking for Net Banking, all methods for Cards).
  const handleOnlineChoice = (option) => {
    setShowPayModal(false);
    if (isMobileDevice() && option.rzpMethod === "upi") {
      push({ type: "info", message: `Opening ${option.label}…` });
    } else if (option.rzpMethod === "upi") {
      push({ type: "info", message: "Scan the QR / approve the request to pay" });
    }
    placeOrder("razorpay", option);
  };

  /**
   * @param {"cod"|"razorpay"} gateway
   * @param {{label:string, rzpMethod?:string}} [option]  chosen online option
   */
  const placeOrder = async (gateway, option) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!address?.line1 || !address?.city) {
      push({ type: "error", message: "Please enter your delivery address." });
      return;
    }
    setPlacing(true);
    try {
      // 1. Create the order on our backend (always)
      const orderData = {
        items: items.map(({ _id, name, image, price, quantity }) => ({
          _id,
          name,
          image,
          price,
          description: "",
          category: "",
          quantity,
        })),
        totalAmount: subtotal + deliveryFee, // server re-validates coupon + applies discount
        deliveryFee,
        restaurantId: cartRestaurantId || undefined,
        paymentMethod: gateway, // "cod" | "razorpay" (online options all use Razorpay)
        couponCode: coupon?.code || undefined,
        deliveryAddress: {
          label: address.label || "Home",
          line1: address.line1,
          city: address.city,
          pincode: address.pincode || "",
          ...(address.lat != null && address.lng != null
            ? { location: { type: "Point", coordinates: [address.lng, address.lat] } }
            : {}),
        },
      };

      const placeRes = await fetch("/api/customer/placeorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderData, token }),
      });

      if (!placeRes.ok) {
        push({ type: "error", message: "Could not place order" });
        return;
      }
      const placed = await placeRes.json();
      const orderId = placed?.order?._id;

      // 2a. Cash on delivery → we're done
      if (gateway === "cod") {
        clearCart();
        push({ type: "success", message: "Order placed successfully", orderId });
        if (orderId) navigate(`/orders/${orderId}`);
        else navigate("/");
        return;
      }

      // 2b. Razorpay flow
      const ok = await loadRazorpayScript();
      if (!ok) {
        push({ type: "error", message: "Could not load Razorpay. Try again or use COD." });
        return;
      }

      const createRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, amount: grandTotal, orderId }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        push({ type: "error", message: err.error || "Could not start payment" });
        return;
      }
      const { razorpayOrderId, amount, currency, keyId } = await createRes.json();

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: cartRestaurantName || "FoodWorld",
        description: option ? `Order payment · ${option.label}` : "Order payment",
        order_id: razorpayOrderId,
        ...(option?.rzpMethod ? { prefill: { method: option.rzpMethod } } : {}),
        handler: async (response) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            }),
          });
          if (verifyRes.ok) {
            clearCart();
            push({ type: "success", message: "Payment successful", orderId });
            navigate(orderId ? `/orders/${orderId}` : "/");
          } else {
            push({ type: "error", message: "Payment verification failed" });
          }
        },
        modal: {
          ondismiss: () => {
            push({ type: "info", message: "Payment cancelled" });
          },
        },
        theme: { color: "#ff593c" },
      });
      rzp.open();
    } catch (err) {
      console.error("Order error:", err);
      push({ type: "error", message: "Something went wrong while placing your order" });
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-file">
        <p className="cart-empty">Your cart is empty. Browse some restaurants to get started.</p>
      </div>
    );
  }

  return (
    <div className="cart-file">
      {cartRestaurantName && (
        <div className="cart-restaurant-banner">
          Ordering from <strong>{cartRestaurantName}</strong>
        </div>
      )}

      <AddressPicker value={address} onChange={setAddress} />

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
        {items.map((item) => (
          <React.Fragment key={item._id}>
            <div className="cart-items-title cart-items-item">
              <img src={item.image} alt={item.name} />
              <p>{item.name}</p>
              <p>
                {item.price} <span className="rupees"> Rs</span>
              </p>
              <p>{item.quantity}</p>
              <p>
                {item.price * item.quantity}
                <span className="rupees"> Rs</span>
              </p>
              <p
                className="remove"
                onClick={() => removeFromCart(item._id)}
                title="Remove one"
              >
                X
              </p>
            </div>
            <hr />
          </React.Fragment>
        ))}
      </div>
      <hr />
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>

          <div className="cart-coupon">
            {!coupon ? (
              <>
                <div className="cart-coupon-row">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !couponInput.trim()}
                  >
                    {applyingCoupon ? "Applying…" : "Apply"}
                  </button>
                </div>
                {couponError && <p className="cart-coupon-error">{couponError}</p>}
              </>
            ) : (
              <div className="cart-coupon-applied">
                <span>
                  Coupon <strong>{coupon.code}</strong> applied: −₹{coupon.discount}
                </span>
                <button type="button" onClick={clearCoupon}>Remove</button>
              </div>
            )}
          </div>

          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>
                {subtotal} <span className="rupees"> Rs</span>
              </p>
            </div>
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>
                {deliveryFee} <span className="rupees"> Rs</span>
              </p>
            </div>
            {discount > 0 && (
              <div className="cart-total-details cart-discount-row">
                <p>Coupon ({coupon.code})</p>
                <p>
                  −{discount} <span className="rupees"> Rs</span>
                </p>
              </div>
            )}
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                {grandTotal} <span className="rupees"> Rs</span>
              </b>
            </div>
          </div>

          <div className="cart-payment-methods">
            <p className="cart-payment-label">Payment method</p>
            <label className="cart-payment-option">
              <input
                type="radio"
                name="pay"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              Cash on delivery
            </label>
            <label className="cart-payment-option">
              <input
                type="radio"
                name="pay"
                value="online"
                checked={paymentMethod === "online"}
                onChange={() => setPaymentMethod("online")}
              />
              Online payment
            </label>
          </div>
        </div>

        <button
          className="place-order-button"
          onClick={handlePlaceClick}
          disabled={placing}
        >
          {placing
            ? "PLACING…"
            : paymentMethod === "cod"
            ? "PLACE ORDER"
            : "PROCEED TO PAY"}
        </button>
      </div>

      {/* ===== Online payment options modal ===== */}
      {showPayModal && (
        <div className="pay-modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pay-modal-head">
              <h3>Choose a payment option</h3>
              <button
                className="pay-modal-close"
                onClick={() => setShowPayModal(false)}
                aria-label="Close"
              >
                <MdClose />
              </button>
            </div>
            <p className="pay-modal-amount">Paying ₹{grandTotal}</p>

            <div className="pay-options">
              {ONLINE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className="pay-option"
                  onClick={() => handleOnlineChoice(opt)}
                  disabled={placing}
                >
                  <span className="pay-option-icon" style={{ color: opt.color }}>
                    {opt.icon}
                  </span>
                  <span className="pay-option-label">{opt.label}</span>
                  <span className="pay-option-arrow">›</span>
                </button>
              ))}
            </div>

            <p className="pay-modal-note">
              Payments are processed securely via Razorpay (test mode).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
