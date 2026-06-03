import React, { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import "./CartConflictModal.css";

const CartConflictModal = () => {
  const { pendingConflict, cartRestaurantName, replaceCartAndAdd, cancelConflict } =
    useContext(StoreContext);

  if (!pendingConflict) return null;

  const newName = pendingConflict.restaurantName || "this restaurant";
  const currentName = cartRestaurantName || "another restaurant";

  return (
    <div className="ccm-backdrop" role="dialog" aria-modal="true">
      <div className="ccm">
        <h3>Items already in cart</h3>
        <p>
          Your cart contains items from <strong>{currentName}</strong>. Replace
          them with items from <strong>{newName}</strong>?
        </p>
        <div className="ccm-actions">
          <button className="ccm-btn ccm-btn-secondary" onClick={cancelConflict}>
            Keep current cart
          </button>
          <button className="ccm-btn ccm-btn-primary" onClick={replaceCartAndAdd}>
            Yes, start fresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartConflictModal;
