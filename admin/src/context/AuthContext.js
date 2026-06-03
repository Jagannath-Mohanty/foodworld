import { createContext, useCallback, useEffect, useMemo, useState } from "react";

export const AuthContext = createContext(null);

const STORAGE_KEY = "admin_token";

/* Decode `_id` out of the JWT payload without pulling in a library. */
const decode = (raw) => {
  try {
    const cleaned = raw.replace(/"/g, "");
    const payload = JSON.parse(
      atob(cleaned.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload;
  } catch {
    return null;
  }
};

const AuthContextProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    setUser(decode(token));
  }, [token]);

  const setToken = useCallback((next) => {
    if (next) {
      localStorage.setItem(STORAGE_KEY, next);
      setTokenState(next);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setTokenState(null);
    }
  }, []);

  const logout = useCallback(() => setToken(null), [setToken]);

  const value = useMemo(
    () => ({ token, user, isAuthed: !!token, setToken, logout }),
    [token, user, setToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;
