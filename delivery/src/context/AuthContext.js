import { createContext, useCallback, useMemo, useState } from "react";

export const AuthContext = createContext(null);

const TOKEN_KEY = "deliveryman_token";
const PROFILE_KEY = "deliveryman_profile";

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
  const [agent, setAgent] = useState(readProfile);

  const setSession = useCallback((nextToken, nextAgent) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setTokenState(nextToken);
    }
    if (nextAgent) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(nextAgent));
      setAgent(nextAgent);
    }
  }, []);

  const updateAgent = useCallback((patch) => {
    setAgent((prev) => {
      const next = { ...(prev || {}), ...patch };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setTokenState(null);
    setAgent(null);
  }, []);

  const value = useMemo(
    () => ({ token, agent, isAuthed: !!token, setSession, updateAgent, logout }),
    [token, agent, setSession, updateAgent, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;
