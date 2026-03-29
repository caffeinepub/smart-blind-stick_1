import { Link, useRouter } from "@tanstack/react-router";
import { MapPin, Menu, X, Zap } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const path = router.state.location.pathname;

  const links = [
    { to: "/", label: "Overview" },
    { to: "/tracking", label: "Live Tracking" },
  ];

  return (
    <header className="sticky top-0 z-50 nav-glass" data-ocid="nav.panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            data-ocid="nav.link"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #2E86C1, #1a5c8a)",
              }}
            >
              <CaneIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-widest text-primary uppercase leading-none">
                SMART BLIND
              </span>
              <span
                className="text-sm font-extrabold tracking-wide"
                style={{ color: "#0F172A" }}
              >
                STICK
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-xl text-sm font-semibold tracking-wide uppercase transition-all duration-200 ${
                  path === l.to
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground/70 hover:text-primary hover:bg-primary/10"
                }`}
                data-ocid="nav.link"
              >
                {l.label}
              </Link>
            ))}
            <span
              className="ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase"
              style={{
                background: "rgba(46,134,193,0.12)",
                color: "#2E86C1",
                border: "1px solid rgba(46,134,193,0.3)",
              }}
            >
              <Zap className="w-3 h-3" />
              Exhibition 2026
            </span>
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-xl hover:bg-primary/10 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {open && (
          <div className="md:hidden py-3 pb-4 space-y-1 border-t border-border/50">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wide transition-all ${
                  path === l.to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-primary/10"
                }`}
                onClick={() => setOpen(false)}
                data-ocid="nav.link"
              >
                {l.to === "/tracking" && <MapPin className="w-4 h-4" />}
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

function CaneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Smart Blind Stick cane icon</title>
      <path d="M9 3L6 21" />
      <path d="M6 3h6" />
      <path d="M6 10h4" />
      <circle cx="16" cy="18" r="3" />
      <path d="M13 18H9" />
    </svg>
  );
}
