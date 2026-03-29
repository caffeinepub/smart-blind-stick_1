import { useEffect, useState } from "react";

// Dynamically loads Leaflet from CDN (avoids modifying frozen package.json)
// Returns { leafletLoaded } — use window.L once loaded

const LEAFLET_VERSION = "1.9.4";
const CDN_BASE = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist`;

let loadPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Inject CSS
    if (!document.querySelector("link[data-leaflet-css]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${CDN_BASE}/leaflet.css`;
      link.setAttribute("data-leaflet-css", "1");
      document.head.appendChild(link);
    }

    // If already loaded
    if ((window as any).L) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `${CDN_BASE}/leaflet.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useLeaflet() {
  const [loaded, setLoaded] = useState(() => !!(window as any).L);

  useEffect(() => {
    if ((window as any).L) {
      setLoaded(true);
      return;
    }
    loadLeaflet()
      .then(() => setLoaded(true))
      .catch((err) => console.error(err));
  }, []);

  return loaded;
}
