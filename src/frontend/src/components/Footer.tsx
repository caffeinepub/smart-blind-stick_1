import { Mail, Zap } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer
      className="mt-auto"
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1a3a5c 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #2E86C1, #1a5c8a)",
                }}
              >
                <CaneIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-extrabold tracking-wide text-sm uppercase">
                Smart Blind Stick
              </span>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(169,211,238,0.7)" }}
            >
              An Arduino UNO-based assistive technology device designed to help
              visually impaired individuals navigate safely and independently.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase"
                style={{
                  background: "rgba(46,134,193,0.2)",
                  color: "#A9D3EE",
                  border: "1px solid rgba(46,134,193,0.3)",
                }}
              >
                <Zap className="w-3 h-3" /> National Level Exhibition 2026
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Project Overview", href: "/" },
                { label: "Live Tracking", href: "/tracking" },
                { label: "Components", href: "/#components" },
                { label: "Objectives", href: "/#objectives" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(169,211,238,0.7)" }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-4">
              Technology Stack
            </h4>
            <ul className="space-y-2">
              {[
                "Arduino UNO Microcontroller",
                "HC-SR04 Ultrasonic Sensor",
                "GPS + GSM Modules",
                "ICP Blockchain (Motoko)",
                "React + TypeScript Frontend",
              ].map((t) => (
                <li
                  key={t}
                  className="text-sm"
                  style={{ color: "rgba(169,211,238,0.7)" }}
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Creator Info */}
        <div
          className="border-t pt-6 mb-4"
          style={{ borderColor: "rgba(169,211,238,0.15)" }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div>
                <p className="text-white font-semibold text-sm">
                  Made by Anuvhab Bhowmik
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(169,211,238,0.6)" }}
                >
                  Sub Theme:{" "}
                  <span style={{ color: "#A9D3EE" }}>Health and Hygiene</span>
                  &nbsp;·&nbsp; Region:{" "}
                  <span style={{ color: "#A9D3EE" }}>Silchar</span>
                  &nbsp;·&nbsp;
                  <span style={{ color: "#A9D3EE" }}>
                    Kendriya Vidyalaya ONGC Agartala
                  </span>
                </p>
              </div>
            </div>
            <a
              href="mailto:anuvhabbhowmik@gmail.com"
              className="flex items-center gap-2 text-sm transition-colors hover:text-white"
              style={{ color: "rgba(169,211,238,0.7)" }}
            >
              <Mail className="w-4 h-4" />
              anuvhabbhowmik@gmail.com
            </a>
          </div>
        </div>

        <div
          className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "rgba(169,211,238,0.1)" }}
        >
          <p className="text-xs" style={{ color: "rgba(169,211,238,0.5)" }}>
            © {year}. Built with ❤️ using{" "}
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline"
              style={{ color: "rgba(169,211,238,0.7)" }}
            >
              caffeine.ai
            </a>
          </p>
          <div className="flex items-center gap-3">
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: "rgba(46,134,193,0.15)", color: "#A9D3EE" }}
            >
              National Science Exhibition Project
            </span>
          </div>
        </div>
      </div>
    </footer>
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
