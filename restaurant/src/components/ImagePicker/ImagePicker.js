import React, { useRef, useState } from "react";

/**
 * File → base64 image picker. Reads the chosen file as a data URL
 * (data:image/...;base64,...) and hands it to `onChange`. The data URL is what
 * gets stored in the DB (image fields are plain strings) and rendered directly
 * via <img src={value}> — no upload server needed.
 */

const MAX_BYTES = 1.5 * 1024 * 1024; // 1.5 MB — keeps DB docs / payloads sane

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ImagePicker = ({ value, onChange, label = "Upload image", onError }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError?.("Please choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      onError?.("Image must be under 1.5 MB");
      return;
    }
    setBusy(true);
    try {
      onChange(await fileToBase64(file));
    } catch {
      onError?.("Could not read the image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 10,
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-alt)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
          fontSize: 11,
          color: "var(--color-text-muted)",
        }}
      >
        {value ? (
          <img
            src={value}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          "No image"
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Reading…" : value ? "Change" : label}
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handle} />
    </div>
  );
};

export default ImagePicker;
