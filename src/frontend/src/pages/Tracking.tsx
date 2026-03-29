import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  Locate,
  MapPin,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Route,
  StopCircle,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Footer } from "../components/Footer";
import { useLeaflet } from "../hooks/useLeaflet";
import {
  Status,
  useAddLocation,
  useDeleteLocation,
  useGetAllLocations,
  useGetStatistics,
  useToggleStatus,
} from "../hooks/useQueries";
import type { Location } from "../hooks/useQueries";

// Leaflet accessed via window.L after CDN load
type LeafletLib = any;
const getL = (): LeafletLib => (window as any).L;

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MIN_DISTANCE_METERS = 30;

interface RegisteredDevice {
  id: string;
  phone: string;
  label: string;
}

const defaultDevices: RegisteredDevice[] = [
  { id: "dev-1", phone: "+91 98765 43210", label: "Blind Stick - Main" },
  { id: "dev-2", phone: "+91 87654 32109", label: "Blind Stick - Backup" },
];

const defaultDemo: Location[] = [
  {
    id: BigInt(1),
    latitude: 28.6139,
    longitude: 77.209,
    timestamp:
      BigInt(Date.now()) * BigInt(1_000_000) -
      BigInt(3600) * BigInt(1_000_000_000),
    status: Status.Safe,
  },
  {
    id: BigInt(2),
    latitude: 19.076,
    longitude: 72.8777,
    timestamp:
      BigInt(Date.now()) * BigInt(1_000_000) -
      BigInt(7200) * BigInt(1_000_000_000),
    status: Status.Emergency,
  },
  {
    id: BigInt(3),
    latitude: 12.9716,
    longitude: 77.5946,
    timestamp:
      BigInt(Date.now()) * BigInt(1_000_000) -
      BigInt(10800) * BigInt(1_000_000_000),
    status: Status.Safe,
  },
];

// Pre-populated phone numbers for demo entries
const defaultPhoneByEntryId: Record<string, string> = {
  "1": "+91 98765 43210",
  "2": "+91 87654 32109",
  "3": "+91 98765 43210",
};

// ─── Pulsing blue dot CSS (injected once) ────────────────────────────────────
const PULSE_STYLE_ID = "leaflet-pulse-style";
function ensurePulseStyle() {
  if (document.getElementById(PULSE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PULSE_STYLE_ID;
  style.textContent = `
    .device-pulse-dot {
      width: 16px; height: 16px;
      background: #2563eb;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 0 rgba(37,99,235,0.7);
      animation: pulse-ring 1.8s ease-out infinite;
      position: relative;
    }
    .device-pulse-dot::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 2px solid rgba(37,99,235,0.4);
      animation: pulse-ring 1.8s ease-out infinite 0.4s;
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.6); }
      70%  { box-shadow: 0 0 0 14px rgba(37,99,235,0); }
      100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Live Map Component ───────────────────────────────────────────────────────
interface LiveMapProps {
  locations: Location[];
  deviceLocation: { lat: number; lng: number; accuracy: number } | null;
  isTracking: boolean;
}

function LiveMap({ locations, deviceLocation, isTracking }: LiveMapProps) {
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const deviceMarkerRef = useRef<any>(null);
  const locationMarkersRef = useRef<any[]>([]);
  const accuracyCircleRef = useRef<any>(null);
  const leafletLoaded = useLeaflet();

  // Init map
  useEffect(() => {
    if (!leafletLoaded || !mapDivRef.current) return;
    const L = getL();
    ensurePulseStyle();

    L.Icon.Default.prototype._getIconUrl = undefined;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(mapDivRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletLoaded]);

  // Update location markers whenever locations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !leafletLoaded) return;
    const L = getL();

    for (const m of locationMarkersRef.current) m.remove();
    locationMarkersRef.current = [];

    for (const loc of locations) {
      const isEmergency = loc.status === Status.Emergency;
      const circle = L.circleMarker([loc.latitude, loc.longitude], {
        radius: 10,
        fillColor: isEmergency ? "#dc2626" : "#16a34a",
        color: "white",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      circle.bindPopup(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:160px">
          <b style="color:${isEmergency ? "#dc2626" : "#16a34a"}">
            ${isEmergency ? "🚨 Emergency" : "✅ Safe"}
          </b><br/>
          <span style="font-size:11px;color:#6b7280">
            ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}
          </span><br/>
          <span style="font-size:11px;color:#6b7280">${formatTimestamp(loc.timestamp)}</span>
        </div>`,
      );

      locationMarkersRef.current.push(circle);
    }
  }, [locations, leafletLoaded]);

  // Update device location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !leafletLoaded) return;
    const L = getL();

    if (deviceMarkerRef.current) {
      deviceMarkerRef.current.remove();
      deviceMarkerRef.current = null;
    }
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    if (!deviceLocation) return;

    accuracyCircleRef.current = L.circle(
      [deviceLocation.lat, deviceLocation.lng],
      {
        radius: deviceLocation.accuracy,
        color: "#2563eb",
        fillColor: "#2563eb",
        fillOpacity: 0.08,
        weight: 1,
      },
    ).addTo(map);

    const icon = L.divIcon({
      html: `<div class="device-pulse-dot"></div>`,
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    deviceMarkerRef.current = L.marker(
      [deviceLocation.lat, deviceLocation.lng],
      { icon },
    )
      .addTo(map)
      .bindPopup(
        `<b style="color:#2563eb">📡 Your Location</b><br/>
         <span style="font-size:11px">${deviceLocation.lat.toFixed(6)}, ${deviceLocation.lng.toFixed(6)}</span><br/>
         <span style="font-size:11px;color:#6b7280">Accuracy: ±${Math.round(deviceLocation.accuracy)}m</span>`,
      );

    if (isTracking) {
      map.setView(
        [deviceLocation.lat, deviceLocation.lng],
        Math.max(map.getZoom(), 15),
      );
    }
  }, [deviceLocation, isTracking, leafletLoaded]);

  return (
    <div style={{ position: "relative", height: 450 }}>
      {!leafletLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "#f0f4f8" }}
        >
          <div className="flex flex-col items-center gap-3">
            <RefreshCw
              className="w-8 h-8 animate-spin"
              style={{ color: "#2E86C1" }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: "#6B7280" }}
            >
              Loading map...
            </span>
          </div>
        </div>
      )}
      <div ref={mapDivRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

// ─── Journey Route Map Component ─────────────────────────────────────────────
interface RouteMapProps {
  points: Array<{
    lat: number;
    lng: number;
    label: string;
    isEmergency?: boolean;
  }>;
}

function JourneyRouteMap({ points }: RouteMapProps) {
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const leafletLoaded = useLeaflet();

  useEffect(() => {
    if (!leafletLoaded || !mapDivRef.current) return;
    const L = getL();

    const map = L.map(mapDivRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !leafletLoaded) return;
    const L = getL();

    map.eachLayer((layer: any) => {
      if (!(layer instanceof L.TileLayer)) layer.remove();
    });

    if (points.length === 0) return;

    const latlngs = points.map((p) => [p.lat, p.lng]);

    if (points.length >= 2) {
      L.polyline(latlngs, {
        color: "#2563eb",
        weight: 5,
        opacity: 0.9,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);

      L.polyline(latlngs, {
        color: "#60a5fa",
        weight: 2,
        opacity: 0.6,
        dashArray: "6 8",
      }).addTo(map);
    }

    points.forEach((pt, i) => {
      const isFirst = i === 0;
      const isLast = i === points.length - 1;
      const color = isFirst
        ? "#16a34a"
        : isLast
          ? "#dc2626"
          : pt.isEmergency
            ? "#f97316"
            : "#2563eb";
      const radius = isFirst || isLast ? 12 : 8;

      const circle = L.circleMarker([pt.lat, pt.lng], {
        radius,
        fillColor: color,
        color: "white",
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.95,
      }).addTo(map);

      const stopLabel = isFirst
        ? "▶ Start"
        : isLast
          ? "⬛ End"
          : `Stop ${i + 1}`;
      circle.bindTooltip(stopLabel, {
        permanent: isFirst || isLast,
        direction: "top",
        className: "leaflet-route-tooltip",
      });

      circle.bindPopup(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif">
          <b style="color:${color}">${stopLabel}</b><br/>
          <span style="font-size:11px;color:#6b7280">${pt.lat.toFixed(5)}, ${pt.lng.toFixed(5)}</span>
        </div>`,
      );
    });

    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, leafletLoaded]);

  if (points.length < 2) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4"
        style={{ background: "#f8fafc", height: 380 }}
        data-ocid="route_map.empty_state"
      >
        <Route className="w-12 h-12 opacity-20" />
        <div className="text-center">
          <p className="font-semibold text-sm" style={{ color: "#374151" }}>
            Start tracking to see your route
          </p>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
            Your path will appear here as a connected line once you have 2+
            stops
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: 380 }}>
      {!leafletLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "#f0f4f8" }}
        >
          <RefreshCw
            className="w-8 h-8 animate-spin"
            style={{ color: "#2E86C1" }}
          />
        </div>
      )}
      <div ref={mapDivRef} style={{ height: "100%", width: "100%" }} />
      <style>{`
        .leaflet-route-tooltip {
          background: rgba(15,23,42,0.9) !important;
          color: white !important;
          border: none !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          padding: 3px 8px !important;
          border-radius: 6px !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        .leaflet-route-tooltip::before {
          border-top-color: rgba(15,23,42,0.9) !important;
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Tracking() {
  const { data: locations = [], isLoading: locLoading } = useGetAllLocations();
  const { data: stats } = useGetStatistics();
  const addMutation = useAddLocation();
  const deleteMutation = useDeleteLocation();
  const toggleMutation = useToggleStatus();

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [status, setStatus] = useState<"Safe" | "Emergency">("Safe");
  const [localDemoLocations, setLocalDemoLocations] =
    useState<Location[]>(defaultDemo);

  // ── Phone / Device tracking state ──────────────────────────────────────────
  const [registeredDevices, setRegisteredDevices] =
    useState<RegisteredDevice[]>(defaultDevices);
  const [newPhone, setNewPhone] = useState("");
  const [newPhoneLabel, setNewPhoneLabel] = useState("");
  const [selectedPhone, setSelectedPhone] = useState(defaultDevices[0].phone);
  const [phoneByEntryId, setPhoneByEntryId] = useState<Record<string, string>>(
    defaultPhoneByEntryId,
  );
  const [deviceFilter, setDeviceFilter] = useState<string>("all");

  const registerDevice = () => {
    const phone = newPhone.trim();
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }
    const label =
      newPhoneLabel.trim() || `Device ${registeredDevices.length + 1}`;
    const id = `dev-${Date.now()}`;
    setRegisteredDevices((prev) => [...prev, { id, phone, label }]);
    setNewPhone("");
    setNewPhoneLabel("");
    toast.success(`Device "${label}" registered!`);
  };

  const removeDevice = (id: string) => {
    setRegisteredDevices((prev) => prev.filter((d) => d.id !== id));
    toast.success("Device removed");
  };

  // ── GPS / tracking state ───────────────────────────────────────────────────
  const [isTracking, setIsTracking] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [autoLogEnabled, setAutoLogEnabled] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const lastLoggedRef = useRef<{ lat: number; lng: number } | null>(null);
  const autoIdRef = useRef(100);

  const [todayJourney, setTodayJourney] = useState<
    Array<{
      id: string;
      lat: number;
      lng: number;
      timestamp: number;
      type: "auto" | "manual";
    }>
  >([]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("GPS not supported on this device/browser");
      return;
    }
    setGpsError(null);
    setIsTracking(true);
    toast.success("Live GPS tracking started");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setDeviceLocation({ lat: latitude, lng: longitude, accuracy });
        setGpsError(null);

        if (autoLogEnabled) {
          const last = lastLoggedRef.current;
          const shouldLog =
            !last ||
            haversineDistance(last.lat, last.lng, latitude, longitude) >=
              MIN_DISTANCE_METERS;

          if (shouldLog) {
            lastLoggedRef.current = { lat: latitude, lng: longitude };
            const now = Date.now();
            const entryId = `auto-${autoIdRef.current++}`;
            setTodayJourney((prev) => [
              ...prev,
              {
                id: entryId,
                lat: latitude,
                lng: longitude,
                timestamp: now,
                type: "auto",
              },
            ]);
            addMutation.mutate({ latitude, longitude });
          }
        }
      },
      (err) => {
        setGpsError(err.message);
        toast.error(`GPS error: ${err.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast.success("GPS tracking stopped");
  };

  const fillFromDevice = () => {
    if (deviceLocation) {
      setLat(deviceLocation.lat.toFixed(6));
      setLng(deviceLocation.lng.toFixed(6));
      toast.success("Filled from your current device location");
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
          toast.success("Filled from your current device location");
        },
        (err) => toast.error(`Could not get location: ${err.message}`),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleAdd = async () => {
    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error("Please enter valid coordinates");
      return;
    }
    try {
      const approxKey = `manual-${Date.now()}`;
      await addMutation.mutateAsync({ latitude, longitude });
      // Store phone for this manual entry using timestamp key
      if (selectedPhone && selectedPhone !== "none") {
        setPhoneByEntryId((prev) => ({ ...prev, [approxKey]: selectedPhone }));
      }
      setTodayJourney((prev) => [
        ...prev,
        {
          id: approxKey,
          lat: latitude,
          lng: longitude,
          timestamp: Date.now(),
          type: "manual",
        },
      ]);
      setLat("");
      setLng("");
      toast.success("Location entry added!");
    } catch {
      toast.error("Failed to add location");
    }
  };

  const handleDelete = async (id: bigint) => {
    if (locations.length === 0) {
      setLocalDemoLocations((prev) => prev.filter((l) => l.id !== id));
      setPhoneByEntryId((prev) => {
        const next = { ...prev };
        delete next[id.toString()];
        return next;
      });
      toast.success("Entry deleted");
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      setPhoneByEntryId((prev) => {
        const next = { ...prev };
        delete next[id.toString()];
        return next;
      });
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (id: bigint) => {
    if (locations.length === 0) {
      setLocalDemoLocations((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                status:
                  l.status === Status.Emergency
                    ? Status.Safe
                    : Status.Emergency,
              }
            : l,
        ),
      );
      toast.success("Status updated");
      return;
    }
    try {
      await toggleMutation.mutateAsync(id);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const totalCount = stats ? Number(stats.totalCount) : 0;
  const emergencyCount = stats ? Number(stats.emergencyCount) : 0;
  const lastLoc = stats?.lastLocation;

  const demoLocations: Location[] =
    locations.length === 0 ? localDemoLocations : locations;

  // Filter by device
  const filteredLocations =
    deviceFilter === "all"
      ? demoLocations
      : demoLocations.filter(
          (loc) => phoneByEntryId[loc.id.toString()] === deviceFilter,
        );

  const todayStr = new Date().toDateString();
  const todayEntries = todayJourney.filter(
    (e) => new Date(e.timestamp).toDateString() === todayStr,
  );

  const routePoints = [
    ...demoLocations
      .slice()
      .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
      .map((loc) => ({
        lat: loc.latitude,
        lng: loc.longitude,
        label: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
        isEmergency: loc.status === Status.Emergency,
      })),
    ...todayJourney
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((e) => ({
        lat: e.lat,
        lng: e.lng,
        label: e.type === "auto" ? "Auto stop" : "Manual stop",
        isEmergency: false,
      })),
  ];

  if (deviceLocation) {
    routePoints.push({
      lat: deviceLocation.lat,
      lng: deviceLocation.lng,
      label: "📡 You (live)",
      isEmergency: false,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Demo Banner */}
      <div
        className="py-3 px-4 text-center"
        style={{ background: "linear-gradient(135deg, #0F172A, #1a3a5c)" }}
      >
        <div className="flex items-center justify-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 pulse-dot inline-block flex-shrink-0" />
          <span
            className="text-xs sm:text-sm font-bold tracking-widest uppercase"
            style={{ color: "#A9D3EE" }}
          >
            LIVE DEMONSTRATION MODE — National Level Science Exhibition 2026
          </span>
          <Activity
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "#16A34A" }}
          />
        </div>
      </div>

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1
            className="text-3xl sm:text-4xl font-black mb-2"
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              color: "#0F172A",
            }}
          >
            Live <span className="gradient-text">Location Tracking</span>
          </h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Real-time GPS tracking — automatically logs every location as the
            person moves
          </p>
        </motion.div>

        {/* GPS Control Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-float p-5 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: isTracking
                    ? "rgba(22,163,74,0.15)"
                    : "rgba(46,134,193,0.12)",
                }}
              >
                <Locate
                  className="w-4 h-4"
                  style={{ color: isTracking ? "#16A34A" : "#2E86C1" }}
                />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
                  Device GPS
                </p>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  {isTracking
                    ? deviceLocation
                      ? `${deviceLocation.lat.toFixed(5)}, ${deviceLocation.lng.toFixed(5)} (±${Math.round(deviceLocation.accuracy)}m)`
                      : "Acquiring signal..."
                    : "Not tracking"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <span
                className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none"
                style={{ color: "#6B7280" }}
              >
                <div
                  className="w-9 h-5 rounded-full relative transition-colors cursor-pointer"
                  style={{ background: autoLogEnabled ? "#16A34A" : "#D1D5DB" }}
                  onClick={() => setAutoLogEnabled((v) => !v)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setAutoLogEnabled((v) => !v)
                  }
                  role="switch"
                  aria-checked={autoLogEnabled}
                  tabIndex={0}
                >
                  <span
                    className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all"
                    style={{
                      left: autoLogEnabled ? "calc(100% - 18px)" : "2px",
                    }}
                  />
                </div>
                Auto-log entries
              </span>

              {isTracking ? (
                <Button
                  size="sm"
                  onClick={stopTracking}
                  className="text-xs font-bold gap-1.5"
                  style={{ background: "#DC2626" }}
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  Stop Tracking
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={startTracking}
                  className="text-xs font-bold gap-1.5 glow-btn"
                  style={{
                    background: "linear-gradient(135deg, #16A34A, #15803d)",
                  }}
                >
                  <Locate className="w-3.5 h-3.5" />
                  Start Live Tracking
                </Button>
              )}
            </div>
          </div>

          {gpsError && (
            <div
              className="mt-3 text-xs px-3 py-2 rounded-lg"
              style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}
            >
              ⚠️ GPS Error: {gpsError}
            </div>
          )}

          {isTracking && (
            <div className="mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs" style={{ color: "#16A34A" }}>
                Tracking active — auto-logging every {MIN_DISTANCE_METERS}m
                moved
              </span>
            </div>
          )}
        </motion.div>

        {/* Stats Row */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          data-ocid="stats.panel"
        >
          {[
            {
              icon: Navigation,
              label: "Total Check-ins",
              value:
                locations.length > 0
                  ? totalCount.toString()
                  : demoLocations.length.toString(),
              accent: "#2E86C1",
              bg: "rgba(46,134,193,0.08)",
            },
            {
              icon: MapPin,
              label: "Last Known Location",
              value: deviceLocation
                ? `${deviceLocation.lat.toFixed(4)}, ${deviceLocation.lng.toFixed(4)}`
                : lastLoc
                  ? `${lastLoc.latitude.toFixed(4)}, ${lastLoc.longitude.toFixed(4)}`
                  : demoLocations.length > 0
                    ? `${demoLocations[demoLocations.length - 1].latitude.toFixed(4)}, ${demoLocations[demoLocations.length - 1].longitude.toFixed(4)}`
                    : "N/A",
              accent: "#16A34A",
              bg: "rgba(22,163,74,0.08)",
            },
            {
              icon: AlertTriangle,
              label: "Today's Journey Stops",
              value:
                todayEntries.length > 0
                  ? todayEntries.length.toString()
                  : locations.length > 0
                    ? emergencyCount.toString()
                    : demoLocations
                        .filter((l) => l.status === Status.Emergency)
                        .length.toString(),
              accent: "#DC2626",
              bg: "rgba(220,38,38,0.08)",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-float p-5"
              data-ocid={`stats.card.${(i + 1) as 1 | 2 | 3}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: stat.bg }}
                >
                  <stat.icon
                    className="w-4 h-4"
                    style={{ color: stat.accent }}
                  />
                </div>
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#6B7280" }}
                >
                  {stat.label}
                </span>
              </div>
              <div
                className="text-3xl font-black"
                style={{ color: stat.accent }}
              >
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── LIVE MAP ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card-float overflow-hidden mb-6"
          data-ocid="map.panel"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Live Map View</span>
              {isTracking && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse"
                  style={{
                    background: "rgba(22,163,74,0.15)",
                    color: "#16A34A",
                  }}
                >
                  🔴 LIVE
                </span>
              )}
              {deviceLocation && !isTracking && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "rgba(37,99,235,0.12)",
                    color: "#2563eb",
                  }}
                >
                  📡 Device Located
                </span>
              )}
            </div>
            <div
              className="flex items-center gap-3 text-xs"
              style={{ color: "#6B7280" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />{" "}
                You
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />{" "}
                Safe
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />{" "}
                Emergency
              </span>
            </div>
          </div>
          <LiveMap
            locations={demoLocations}
            deviceLocation={deviceLocation}
            isTracking={isTracking}
          />
        </motion.div>

        {/* ── JOURNEY ROUTE MAP ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card-float overflow-hidden mb-8"
          data-ocid="route_map.panel"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4" style={{ color: "#3b82f6" }} />
              <span className="font-bold text-sm">Journey Route Map</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  color: "#3b82f6",
                }}
              >
                {routePoints.length} stop{routePoints.length !== 1 ? "s" : ""}{" "}
                visited
              </span>
            </div>
            <div
              className="hidden sm:flex items-center gap-3 text-xs"
              style={{ color: "#6B7280" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />{" "}
                Start
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />{" "}
                Route
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />{" "}
                End
              </span>
            </div>
          </div>
          <JourneyRouteMap points={routePoints} />
        </motion.div>

        {/* Today's Journey Timeline */}
        {todayEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-float p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(37,99,235,0.12)" }}
                >
                  <Navigation
                    className="w-4 h-4"
                    style={{ color: "#2563EB" }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Today's Journey</h3>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    {formatDate(BigInt(Date.now()) * BigInt(1_000_000))}
                  </p>
                </div>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "rgba(37,99,235,0.1)", color: "#2563EB" }}
              >
                {todayEntries.length} stops
              </span>
            </div>

            <div className="relative pl-6">
              <div
                className="absolute left-2 top-0 bottom-0 w-0.5 rounded-full"
                style={{
                  background: "linear-gradient(to bottom, #2563EB, #16A34A)",
                }}
              />
              {todayEntries.map((entry, i) => (
                <div key={entry.id} className="relative mb-4 last:mb-0">
                  <div
                    className="absolute -left-4 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                    style={{
                      background: entry.type === "auto" ? "#2563EB" : "#16A34A",
                      top: "2px",
                    }}
                  />
                  <div
                    className="rounded-xl p-3"
                    style={{
                      background: "rgba(37,99,235,0.05)",
                      border: "1px solid rgba(37,99,235,0.1)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span
                          className="text-xs font-bold"
                          style={{ color: "#0F172A" }}
                        >
                          Stop {i + 1}
                        </span>
                        <span
                          className="ml-2 text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background:
                              entry.type === "auto"
                                ? "rgba(37,99,235,0.1)"
                                : "rgba(22,163,74,0.1)",
                            color:
                              entry.type === "auto" ? "#2563EB" : "#16A34A",
                          }}
                        >
                          {entry.type === "auto" ? "📡 Auto" : "✏️ Manual"}
                        </span>
                      </div>
                      <span
                        className="text-xs font-mono"
                        style={{ color: "#6B7280" }}
                      >
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <p
                      className="text-xs font-mono mt-1"
                      style={{ color: "#374151" }}
                    >
                      {entry.lat.toFixed(6)}, {entry.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Management Panel + History */}
        <div className="grid lg:grid-cols-5 gap-6 mb-8">
          {/* Left Column: Registered Devices + Add Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* ── Registered Devices Panel ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="card-float p-6"
              data-ocid="registered_devices.panel"
            >
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.12)" }}
                >
                  <Phone className="w-4 h-4" style={{ color: "#7c3aed" }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Registered Devices</h3>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    SIM card phone numbers
                  </p>
                </div>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{
                    background: "rgba(124,58,237,0.12)",
                    color: "#7c3aed",
                  }}
                >
                  {registeredDevices.length}
                </span>
              </div>

              {/* Register new device */}
              <div className="space-y-2 mb-4">
                <Input
                  placeholder="Phone number (e.g. +91 98765 43210)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="text-xs"
                  data-ocid="registered_devices.input"
                  onKeyDown={(e) => e.key === "Enter" && registerDevice()}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Label (e.g. Blind Stick - Main)"
                    value={newPhoneLabel}
                    onChange={(e) => setNewPhoneLabel(e.target.value)}
                    className="text-xs flex-1"
                    data-ocid="registered_devices.label_input"
                    onKeyDown={(e) => e.key === "Enter" && registerDevice()}
                  />
                  <Button
                    size="sm"
                    onClick={registerDevice}
                    className="shrink-0 text-xs font-bold gap-1"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                    }}
                    data-ocid="registered_devices.button"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Register
                  </Button>
                </div>
              </div>

              {/* Device list */}
              {registeredDevices.length === 0 ? (
                <div
                  className="text-center py-6"
                  data-ocid="registered_devices.empty_state"
                >
                  <Phone className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    No devices registered yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {registeredDevices.map((device, idx) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{
                        background: "rgba(124,58,237,0.05)",
                        border: "1px solid rgba(124,58,237,0.15)",
                      }}
                      data-ocid={`registered_devices.item.${idx + 1}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(124,58,237,0.12)" }}
                        >
                          <Phone
                            className="w-3 h-3"
                            style={{ color: "#7c3aed" }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-xs font-bold truncate"
                            style={{ color: "#0F172A" }}
                          >
                            {device.label}
                          </p>
                          <p
                            className="text-xs font-mono"
                            style={{ color: "#7c3aed" }}
                          >
                            {device.phone}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDevice(device.id)}
                        className="p-1 rounded-lg hover:bg-red-50 transition-colors shrink-0 ml-2"
                        style={{ color: "#DC2626" }}
                        title="Remove device"
                        data-ocid={`registered_devices.delete_button.${idx + 1}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Add Location Form ──────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card-float p-6"
              data-ocid="add_location.panel"
            >
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(46,134,193,0.12)" }}
                >
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-bold text-sm">Add Location Entry</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label
                    className="text-xs font-semibold uppercase tracking-wide mb-1.5 block"
                    style={{ color: "#6B7280" }}
                  >
                    Latitude
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 28.6139"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="text-sm"
                    data-ocid="add_location.input"
                  />
                </div>
                <div>
                  <Label
                    className="text-xs font-semibold uppercase tracking-wide mb-1.5 block"
                    style={{ color: "#6B7280" }}
                  >
                    Longitude
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 77.2090"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="text-sm"
                    data-ocid="add_location.input"
                  />
                </div>
                <div>
                  <Label
                    className="text-xs font-semibold uppercase tracking-wide mb-1.5 block"
                    style={{ color: "#6B7280" }}
                  >
                    Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as "Safe" | "Emergency")}
                  >
                    <SelectTrigger data-ocid="add_location.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Safe">✅ Safe</SelectItem>
                      <SelectItem value="Emergency">🚨 Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Device (Phone Number) selector */}
                <div>
                  <Label
                    className="text-xs font-semibold uppercase tracking-wide mb-1.5 block"
                    style={{ color: "#6B7280" }}
                  >
                    Device (Phone Number)
                  </Label>
                  {registeredDevices.length > 0 ? (
                    <Select
                      value={selectedPhone}
                      onValueChange={setSelectedPhone}
                    >
                      <SelectTrigger data-ocid="add_location.device_select">
                        <div className="flex items-center gap-2">
                          <Phone
                            className="w-3.5 h-3.5"
                            style={{ color: "#7c3aed" }}
                          />
                          <SelectValue placeholder="Select a device" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— No device —</SelectItem>
                        {registeredDevices.map((d) => (
                          <SelectItem key={d.id} value={d.phone}>
                            {d.label} · {d.phone}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          ✎ Enter custom number...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                  {(selectedPhone === "custom" ||
                    registeredDevices.length === 0) && (
                    <Input
                      className="text-xs mt-2"
                      placeholder="+91 98765 43210"
                      value={selectedPhone === "custom" ? "" : selectedPhone}
                      onChange={(e) => setSelectedPhone(e.target.value)}
                      data-ocid="add_location.phone_input"
                    />
                  )}
                  {selectedPhone &&
                    selectedPhone !== "custom" &&
                    selectedPhone !== "none" && (
                      <p
                        className="text-xs mt-1 flex items-center gap-1"
                        style={{ color: "#7c3aed" }}
                      >
                        <Phone className="w-3 h-3" />
                        {selectedPhone}
                      </p>
                    )}
                </div>

                <Button
                  variant="outline"
                  className="w-full text-xs font-semibold gap-2"
                  onClick={fillFromDevice}
                  type="button"
                >
                  <Locate className="w-3.5 h-3.5" />
                  Use My Current Location
                </Button>

                <Button
                  className="w-full text-sm font-bold py-5 glow-btn"
                  style={{
                    background: "linear-gradient(135deg, #2E86C1, #1a5c8a)",
                  }}
                  onClick={handleAdd}
                  disabled={addMutation.isPending}
                  data-ocid="add_location.submit_button"
                >
                  {addMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {addMutation.isPending ? "Adding..." : "Add Entry"}
                </Button>
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "#6B7280" }}
                >
                  Quick Demo Coords
                </p>
                <div className="space-y-1.5">
                  {[
                    { city: "New Delhi", lat: "28.6139", lng: "77.2090" },
                    { city: "Mumbai", lat: "19.0760", lng: "72.8777" },
                    { city: "Bengaluru", lat: "12.9716", lng: "77.5946" },
                  ].map((c) => (
                    <button
                      key={c.city}
                      type="button"
                      className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors hover:bg-primary/10"
                      style={{ color: "#2E86C1" }}
                      onClick={() => {
                        setLat(c.lat);
                        setLng(c.lng);
                      }}
                    >
                      📍 {c.city} ({c.lat}, {c.lng})
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* History Table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 card-float overflow-hidden"
            data-ocid="location_history.panel"
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm">Location History</h3>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{
                    background: "rgba(46,134,193,0.1)",
                    color: "#2E86C1",
                  }}
                >
                  {filteredLocations.length} entries
                </span>
              </div>

              {/* Device filter bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <Phone
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: "#7c3aed" }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#6B7280" }}
                >
                  Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setDeviceFilter("all")}
                  className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors"
                  style={{
                    background:
                      deviceFilter === "all"
                        ? "rgba(46,134,193,0.15)"
                        : "rgba(0,0,0,0.04)",
                    color: deviceFilter === "all" ? "#2E86C1" : "#6B7280",
                    border: `1px solid ${deviceFilter === "all" ? "rgba(46,134,193,0.4)" : "transparent"}`,
                  }}
                  data-ocid="location_history.filter.tab"
                >
                  All Devices
                </button>
                {registeredDevices.map((dev) => (
                  <button
                    key={dev.id}
                    type="button"
                    onClick={() => setDeviceFilter(dev.phone)}
                    className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors"
                    style={{
                      background:
                        deviceFilter === dev.phone
                          ? "rgba(124,58,237,0.15)"
                          : "rgba(0,0,0,0.04)",
                      color: deviceFilter === dev.phone ? "#7c3aed" : "#6B7280",
                      border: `1px solid ${deviceFilter === dev.phone ? "rgba(124,58,237,0.4)" : "transparent"}`,
                    }}
                    data-ocid={"location_history.filter.tab"}
                  >
                    {dev.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-auto">
              {locLoading ? (
                <div
                  className="p-6 space-y-3"
                  data-ocid="location_history.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : filteredLocations.length === 0 ? (
                <div
                  className="p-10 text-center"
                  data-ocid="location_history.empty_state"
                >
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#6B7280" }}
                  >
                    No location entries yet
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                    Start tracking or add a location manually
                  </p>
                </div>
              ) : (
                <Table data-ocid="location_history.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Timestamp</TableHead>
                      <TableHead className="text-xs">Lat</TableHead>
                      <TableHead className="text-xs">Lng</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">
                        <span className="flex items-center gap-1">
                          <Phone
                            className="w-3 h-3"
                            style={{ color: "#7c3aed" }}
                          />
                          Device
                        </span>
                      </TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocations.map((loc, i) => {
                      const phone = phoneByEntryId[loc.id.toString()];
                      const device = registeredDevices.find(
                        (d) => d.phone === phone,
                      );
                      return (
                        <TableRow
                          key={loc.id.toString()}
                          data-ocid={`location_history.row.${i + 1}`}
                        >
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatTimestamp(loc.timestamp)}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {loc.latitude.toFixed(4)}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {loc.longitude.toFixed(4)}
                          </TableCell>
                          <TableCell>
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={
                                loc.status === Status.Emergency
                                  ? {
                                      background: "rgba(220,38,38,0.12)",
                                      color: "#DC2626",
                                      border: "1px solid rgba(220,38,38,0.3)",
                                    }
                                  : {
                                      background: "rgba(22,163,74,0.12)",
                                      color: "#16A34A",
                                      border: "1px solid rgba(22,163,74,0.3)",
                                    }
                              }
                            >
                              {loc.status === Status.Emergency
                                ? "🚨 Emergency"
                                : "✅ Safe"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {phone ? (
                              <div className="flex flex-col">
                                <span
                                  className="text-xs font-mono"
                                  style={{ color: "#7c3aed" }}
                                >
                                  {phone}
                                </span>
                                {device && (
                                  <span
                                    className="text-xs"
                                    style={{ color: "#9CA3AF" }}
                                  >
                                    {device.label}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: "#D1D5DB" }}>—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-blue-50"
                                style={{ color: "#2E86C1" }}
                                onClick={() => handleToggle(loc.id)}
                                disabled={toggleMutation.isPending}
                                title="Toggle status"
                                data-ocid={`location_history.toggle.${i + 1}`}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-red-50"
                                style={{ color: "#DC2626" }}
                                onClick={() => handleDelete(loc.id)}
                                disabled={deleteMutation.isPending}
                                title="Delete entry"
                                data-ocid={`location_history.delete_button.${i + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
