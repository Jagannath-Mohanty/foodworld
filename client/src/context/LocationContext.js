import { createContext, useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "fw_location";

export const LocationContext = createContext(null);

const LocationContextProvider = ({ children }) => {
  const [location, setLocationState] = useState(null); // { lat, lng, address, city }
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");

  /* ---------- hydrate from localStorage ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLocationState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  /* ---------- persist on change ---------- */
  useEffect(() => {
    if (location) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [location]);

  /* ---------- setters ---------- */
  const setLocation = useCallback((loc) => {
    setLocationState(loc);
    setError("");
  }, []);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    setError("");
  }, []);

  /* ---------- browser geolocation ---------- */
  const detectLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        const msg = "Geolocation is not supported in this browser";
        setError(msg);
        reject(new Error(msg));
        return;
      }

      setDetecting(true);
      setError("");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: "Current location",
            city: null,
          };
          setLocationState(next);
          setDetecting(false);
          resolve(next);
        },
        (err) => {
          setDetecting(false);
          const msg =
            err.code === 1
              ? "Location permission denied"
              : err.code === 2
              ? "Location unavailable"
              : err.code === 3
              ? "Location request timed out"
              : "Failed to detect location";
          setError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
      );
    });
  }, []);

  const value = useMemo(
    () => ({
      location,
      detecting,
      error,
      setLocation,
      clearLocation,
      detectLocation,
    }),
    [location, detecting, error, setLocation, clearLocation, detectLocation]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContextProvider;
