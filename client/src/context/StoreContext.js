import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { food_list } from "../assets/assets";

export const StoreContext = createContext(null);

const STORAGE_KEY = "fw_cart_v2";

/* Shape:
 * cart = {
 *   restaurantId: string | null,
 *   restaurantName: string | null,
 *   items: { [itemId]: { quantity, name, price, image, restaurantId } }
 * }
 */
const emptyCart = { restaurantId: null, restaurantName: null, items: {} };

const StoreContextProvider = (props) => {
  const [cart, setCart] = useState(emptyCart);
  const [pendingConflict, setPendingConflict] = useState(null); // { item, restaurantId, restaurantName }

  /* ---------- hydrate from localStorage ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  /* ---------- persist on change ---------- */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  /* ---------- helpers ---------- */

  // Given any input (a MenuItem object, or a legacy food_list id), return a uniform item snapshot.
  const resolveItem = (itemOrId) => {
    if (itemOrId && typeof itemOrId === "object") {
      return {
        _id: itemOrId._id,
        name: itemOrId.name,
        price: itemOrId.price,
        image: itemOrId.image,
        restaurantId: itemOrId.restaurantId || null,
      };
    }
    // Legacy path: lookup in static food_list
    const found = food_list.find((p) => p._id === itemOrId);
    if (found) {
      return {
        _id: found._id,
        name: found.name,
        price: found.price,
        image: found.image,
        restaurantId: null,
      };
    }
    return { _id: itemOrId, name: "", price: 0, image: "", restaurantId: null };
  };

  /* ---------- mutations ---------- */

  // Direct add (no conflict check). Use when you've already resolved any conflict.
  const performAdd = useCallback((itemSnap, restaurantId, restaurantName) => {
    setCart((prev) => {
      const existing = prev.items[itemSnap._id];
      const newQty = (existing?.quantity || 0) + 1;
      return {
        restaurantId: restaurantId ?? prev.restaurantId,
        restaurantName: restaurantName ?? prev.restaurantName,
        items: {
          ...prev.items,
          [itemSnap._id]: { ...itemSnap, quantity: newQty },
        },
      };
    });
  }, []);

  /**
   * Add an item to the cart.
   * @returns { ok: boolean, conflict?: { currentRestaurantName } }
   * If the cart already has items from a different restaurant, returns ok:false with
   * conflict details so the caller can prompt the user.
   */
  const addToCart = useCallback(
    (itemOrId, restaurantId, restaurantName) => {
      const itemSnap = resolveItem(itemOrId);
      const targetRestaurantId = restaurantId ?? itemSnap.restaurantId;

      // Cross-restaurant block (only when both sides have a restaurantId)
      if (
        cart.restaurantId &&
        targetRestaurantId &&
        cart.restaurantId !== targetRestaurantId
      ) {
        setPendingConflict({
          item: itemSnap,
          restaurantId: targetRestaurantId,
          restaurantName,
        });
        return { ok: false, conflict: { currentRestaurantName: cart.restaurantName } };
      }

      performAdd(itemSnap, targetRestaurantId, restaurantName);
      return { ok: true };
    },
    [cart.restaurantId, cart.restaurantName, performAdd]
  );

  // Clear cart and add the previously-blocked item.
  const replaceCartAndAdd = useCallback(() => {
    if (!pendingConflict) return;
    const { item, restaurantId, restaurantName } = pendingConflict;
    setCart({
      restaurantId,
      restaurantName: restaurantName ?? null,
      items: { [item._id]: { ...item, quantity: 1 } },
    });
    setPendingConflict(null);
  }, [pendingConflict]);

  const cancelConflict = useCallback(() => setPendingConflict(null), []);

  const removeFromCart = useCallback((itemId) => {
    setCart((prev) => {
      const existing = prev.items[itemId];
      if (!existing) return prev;
      const newQty = existing.quantity - 1;
      const items = { ...prev.items };
      if (newQty <= 0) {
        delete items[itemId];
      } else {
        items[itemId] = { ...existing, quantity: newQty };
      }
      const hasAny = Object.keys(items).length > 0;
      return {
        restaurantId: hasAny ? prev.restaurantId : null,
        restaurantName: hasAny ? prev.restaurantName : null,
        items,
      };
    });
  }, []);

  const clearCart = useCallback(() => setCart(emptyCart), []);

  /* ---------- derived values ---------- */

  // Legacy adapter: { [itemId]: quantity } — keeps FoodItem.js working without changes
  const cartItems = useMemo(() => {
    const out = {};
    for (const [id, info] of Object.entries(cart.items)) {
      out[id] = info.quantity;
    }
    return out;
  }, [cart.items]);

  const getTotalCartAmount = useCallback(() => {
    let total = 0;
    for (const info of Object.values(cart.items)) {
      total += (info.price || 0) * info.quantity;
    }
    return total;
  }, [cart.items]);

  const getTotalCartItem = useCallback(() => {
    let total = 0;
    for (const info of Object.values(cart.items)) {
      total += info.quantity;
    }
    return total;
  }, [cart.items]);

  const contextValue = {
    // legacy surface (keep working)
    food_list,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    getTotalCartItem,

    // new restaurant-aware surface
    cart,
    cartRestaurantId: cart.restaurantId,
    cartRestaurantName: cart.restaurantName,
    cartItemDetails: cart.items,
    clearCart,

    // conflict resolution
    pendingConflict,
    replaceCartAndAdd,
    cancelConflict,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
