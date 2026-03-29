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
  CheckCircle,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Footer } from "../components/Footer";
import {
  Status,
  useAddLocation,
  useDeleteLocation,
  useGetAllLocations,
  useGetStatistics,
  useToggleStatus,
} from "../hooks/useQueries";
import type { Location } from "../hooks/useQueries";

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}

const defaultDemo: Location[] = [
  {
    id: BigInt(1),
    latitude: 28.6139,
    longitude: 77.209,
    timestamp: BigInt(Date.now() * 1_000_000 - 3600 * 1e9),
    status: Status.Safe,
  },
  {
    id: BigInt(2),
    latitude: 19.076,
    longitude: 72.8777,
    timestamp: BigInt(Date.now() * 1_000_000 - 7200 * 1e9),
    status: Status.Emergency,
  },
  {
    id: BigInt(3),
    latitude: 12.9716,
    longitude: 77.5946,
    timestamp: BigInt(Date.now() * 1_000_000 - 10800 * 1e9),
    status: Status.Safe,
  },
];

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

  const handleAdd = async () => {
    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error("Please enter valid coordinates");
      return;
    }
    try {
      await addMutation.mutateAsync({ latitude, longitude });
      setLat("");
      setLng("");
      toast.success("Location entry added successfully!");
    } catch {
      toast.error("Failed to add location");
    }
  };

  const handleDelete = async (id: bigint) => {
    if (locations.length === 0) {
      setLocalDemoLocations((prev) => prev.filter((l) => l.id !== id));
      toast.success("Entry deleted");
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
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

  // Sample seed data for demo if empty
  const demoLocations: Location[] =
    locations.length === 0 ? localDemoLocations : locations;

  const mapCenter: [number, number] =
    demoLocations.length > 0
      ? [
          demoLocations[demoLocations.length - 1].latitude,
          demoLocations[demoLocations.length - 1].longitude,
        ]
      : [20.5937, 78.9629];

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
            Real-time GPS tracking dashboard for Smart Blind Stick demonstration
          </p>
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
              value: lastLoc
                ? `${lastLoc.latitude.toFixed(4)}, ${lastLoc.longitude.toFixed(4)}`
                : demoLocations.length > 0
                  ? `${demoLocations[demoLocations.length - 1].latitude.toFixed(4)}, ${demoLocations[demoLocations.length - 1].longitude.toFixed(4)}`
                  : "N/A",
              accent: "#16A34A",
              bg: "rgba(22,163,74,0.08)",
            },
            {
              icon: AlertTriangle,
              label: "Emergency Alerts",
              value:
                locations.length > 0
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

        {/* Map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card-float overflow-hidden mb-8"
          data-ocid="map.panel"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Live Map View</span>
            </div>
            <div
              className="flex items-center gap-3 text-xs"
              style={{ color: "#6B7280" }}
            >
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Safe
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Emergency
              </span>
            </div>
          </div>
          <div
            style={{ height: 420 }}
            className="relative rounded-xl overflow-hidden"
          >
            <iframe
              title="Live Location Map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter[1] - 5},${mapCenter[0] - 5},${mapCenter[1] + 5},${mapCenter[0] + 5}&layer=mapnik&marker=${mapCenter[0]},${mapCenter[1]}`}
              style={{ height: "100%", width: "100%", border: 0 }}
              loading="lazy"
            />
            {/* Overlay markers */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 pointer-events-none">
              {demoLocations.slice(-3).map((loc) => (
                <div
                  key={loc.id.toString()}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm"
                  style={{
                    background:
                      loc.status === Status.Emergency
                        ? "rgba(220,38,38,0.85)"
                        : "rgba(22,163,74,0.85)",
                    color: "white",
                  }}
                >
                  <span>{loc.status === Status.Emergency ? "🚨" : "✅"}</span>
                  <span>
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Management Panel + History */}
        <div className="grid lg:grid-cols-5 gap-6 mb-8">
          {/* Add Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 card-float p-6"
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

            {/* Quick coordinates */}
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

          {/* History Table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 card-float overflow-hidden"
            data-ocid="location_history.panel"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm">Location History</h3>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "rgba(46,134,193,0.1)", color: "#2E86C1" }}
              >
                {demoLocations.length} entries
              </span>
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
              ) : demoLocations.length === 0 ? (
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
                    Add your first location using the form
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
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demoLocations.map((loc, i) => (
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
                    ))}
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
