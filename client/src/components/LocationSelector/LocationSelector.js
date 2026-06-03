import React, { useContext, useEffect, useRef, useState } from "react";
import { MdLocationOn, MdMyLocation, MdKeyboardArrowDown, MdClose } from "react-icons/md";
import { LocationContext } from "../../context/LocationContext";
import "./LocationSelector.css";

const LocationSelector = () => {
  const { location, detecting, error, setLocation, detectLocation } =
    useContext(LocationContext);

  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState("");
  const popRef = useRef(null);

  /* Close popover on outside click */
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleDetect = async () => {
    try {
      await detectLocation();
      setOpen(false);
    } catch {
      /* error surfaced via context */
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const trimmed = manual.trim();
    if (!trimmed) return;
    setLocation({
      lat: null,
      lng: null,
      address: trimmed,
      city: trimmed.split(",")[0] || trimmed,
    });
    setManual("");
    setOpen(false);
  };

  const label = location?.address
    ? location.address.length > 22
      ? location.address.slice(0, 22) + "…"
      : location.address
    : "Set location";

  return (
    <div className="loc-selector" ref={popRef}>
      <button
        className="loc-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Choose delivery location"
      >
        <MdLocationOn className="loc-trigger-icon" />
        <span className="loc-trigger-text">
          <span className="loc-trigger-eyebrow">Deliver to</span>
          <span className="loc-trigger-value">{label}</span>
        </span>
        <MdKeyboardArrowDown className={`loc-trigger-caret ${open ? "open" : ""}`} />
      </button>

      {open && (
        <div className="loc-pop" role="dialog" aria-label="Location selector">
          <button
            className="loc-pop-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <MdClose />
          </button>

          <button
            className="loc-detect-btn"
            onClick={handleDetect}
            disabled={detecting}
          >
            <MdMyLocation />
            {detecting ? "Detecting…" : "Use current location"}
          </button>

          {error && <p className="loc-error">{error}</p>}

          <div className="loc-divider"><span>or</span></div>

          <form onSubmit={handleManualSubmit} className="loc-manual-form">
            <input
              type="text"
              placeholder="Enter city, area, or pincode"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              autoFocus
            />
            <button type="submit" className="loc-manual-submit">
              Set
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
