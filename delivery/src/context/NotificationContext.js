import { createContext, useCallback, useState } from "react";

export const NotificationContext = createContext(null);

const NotificationContextProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration ?? 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ toasts, push, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContextProvider;
