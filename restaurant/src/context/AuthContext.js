import { createContext, useCallback, useMemo, useState } from "react";

export const AuthContext = createContext(null);

const TOKEN_KEY = "restaurant_token";
const PROFILE_KEY = "restaurant_profile";

const readProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const AuthContextProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [restaurant, setRestaurant] = useState(readProfile);

  // Persist token + restaurant profile together on a successful OTP verification.
  const setSession = useCallback((nextToken, nextRestaurant) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setTokenState(nextToken);
    }
    if (nextRestaurant) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(nextRestaurant));
      setRestaurant(nextRestaurant);
    }
  }, []);

  // Merge fields into the stored profile (e.g. after onboarding / active toggle).
  const updateRestaurant = useCallback((patch) => {
    setRestaurant((prev) => {
      const next = { ...(prev || {}), ...patch };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setTokenState(null);
    setRestaurant(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      restaurant,
      isAuthed: !!token,
      // A freshly created listing has no name until the partner onboards it.
      isOnboarded: !!restaurant?.name,
      setSession,
      updateRestaurant,
      logout,
    }),
    [token, restaurant, setSession, updateRestaurant, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;
