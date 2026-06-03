import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

/* Leaflet's default icon images break when bundled — point them at the CDN. */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Simple colored pin via a div icon (pickup = orange, drop = green, you = blue).
const pin = (color) =>
  L.divIcon({
    className: "dl-pin",
    html: `<span style="background:${color};width:18px;height:18px;display:block;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
  });

const PICKUP_ICON = pin("#ff593c");
const DROP_ICON = pin("#16a34a");
const ME_ICON = pin("#1a73e8");

// GeoJSON coordinates are [lng, lat]; Leaflet wants [lat, lng].
const toLatLng = (coords) =>
  Array.isArray(coords) && coords.length === 2 ? [coords[1], coords[0]] : null;

// Keep all relevant points in view.
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    const pts = points.filter(Boolean);
    if (pts.length === 1) map.setView(pts[0], 14);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40] });
  }, [map, points]);
  return null;
};

/**
 * @param {{ pickup?: number[], drop?: number[], current?: {lat,lng} }} props
 *   pickup/drop are GeoJSON [lng, lat]; current is the agent's live position.
 */
const DeliveryMap = ({ pickup, drop, current }) => {
  const pickupLL = toLatLng(pickup);
  const dropLL = toLatLng(drop);
  const meLL = current ? [current.lat, current.lng] : null;

  const points = [pickupLL, dropLL, meLL].filter(Boolean);
  if (points.length === 0) {
    return (
      <div className="state" style={{ textAlign: "left" }}>
        No map coordinates yet — the restaurant and delivery address need lat/lng.
      </div>
    );
  }

  const route = [pickupLL, dropLL].filter(Boolean);

  return (
    <MapContainer
      center={points[0]}
      zoom={13}
      style={{ height: "320px", width: "100%", borderRadius: "12px" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pickupLL && (
        <Marker position={pickupLL} icon={PICKUP_ICON}>
          <Popup>Pickup — restaurant</Popup>
        </Marker>
      )}
      {dropLL && (
        <Marker position={dropLL} icon={DROP_ICON}>
          <Popup>Drop — customer</Popup>
        </Marker>
      )}
      {meLL && (
        <Marker position={meLL} icon={ME_ICON}>
          <Popup>You</Popup>
        </Marker>
      )}
      {route.length === 2 && (
        <Polyline positions={route} pathOptions={{ color: "#ff593c", weight: 4 }} />
      )}
      <FitBounds points={points} />
    </MapContainer>
  );
};

export default DeliveryMap;
