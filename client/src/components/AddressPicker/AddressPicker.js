import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { MdMyLocation } from "react-icons/md";
import { LocationContext } from "../../context/LocationContext";
import "leaflet/dist/leaflet.css";
import "./AddressPicker.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* Helper: programmatically fly the map to a new center. */
const RecenterOn = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { duration: 0.4 });
  }, [center, map]);
  return null;
};

/**
 * Inline address picker. Renders a Leaflet map with a draggable marker for the
 * delivery pin, plus address text fields. Calls onChange({ line1, city, pincode, lat, lng }).
 */
const AddressPicker = ({ value, onChange }) => {
  const { location, detectLocation, detecting } = useContext(LocationContext);

  // Pin location (defaults: saved LocationContext → Bengaluru fallback)
  const initialPin = useMemo(() => {
    if (value?.lat != null && value?.lng != null) return [value.lat, value.lng];
    if (location?.lat != null && location?.lng != null) return [location.lat, location.lng];
    return [12.9716, 77.5946]; // Bengaluru default
  }, [value?.lat, value?.lng, location?.lat, location?.lng]);

  const [pin, setPin] = useState(initialPin);
  const [recenter, setRecenter] = useState(null);
  const markerRef = useRef(null);

  // Address text fields
  const [line1, setLine1] = useState(value?.line1 || "");
  const [city, setCity] = useState(value?.city || "");
  const [pincode, setPincode] = useState(value?.pincode || "");
  const [label, setLabel] = useState(value?.label || "Home");

  const emit = useCallback(
    (next) => onChange?.({ line1, city, pincode, label, lat: pin[0], lng: pin[1], ...next }),
    [onChange, line1, city, pincode, label, pin]
  );

  // Bubble changes up
  useEffect(() => {
    emit({});
    // eslint-disable-next-line
  }, [line1, city, pincode, label, pin]);

  const onMarkerDragEnd = () => {
    const m = markerRef.current;
    if (m) {
      const { lat, lng } = m.getLatLng();
      setPin([lat, lng]);
    }
  };

  const useMyLocation = async () => {
    try {
      const loc = await detectLocation();
      const next = [loc.lat, loc.lng];
      setPin(next);
      setRecenter(next);
    } catch {
      /* error already surfaced */
    }
  };

  return (
    <div className="addr-picker">
      <div className="addr-picker-head">
        <p className="addr-picker-title">Delivery address</p>
        <button
          type="button"
          className="addr-picker-locate"
          onClick={useMyLocation}
          disabled={detecting}
        >
          <MdMyLocation /> {detecting ? "Detecting…" : "Use my location"}
        </button>
      </div>

      <div className="addr-picker-map">
        <MapContainer
          center={initialPin}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: 240, width: "100%", borderRadius: 8 }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={pin}
            draggable
            eventHandlers={{ dragend: onMarkerDragEnd }}
            ref={markerRef}
          />
          {recenter && <RecenterOn center={recenter} />}
        </MapContainer>
        <p className="addr-picker-pin-hint">
          Drag the pin to your exact delivery location
        </p>
      </div>

      <div className="addr-picker-fields">
        <div className="addr-picker-row">
          <label>
            Save as
            <select value={label} onChange={(e) => setLabel(e.target.value)}>
              <option>Home</option>
              <option>Work</option>
              <option>Other</option>
            </select>
          </label>
        </div>
        <input
          type="text"
          placeholder="Street, building, flat number"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
        />
        <div className="addr-picker-row">
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            type="text"
            placeholder="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default AddressPicker;
