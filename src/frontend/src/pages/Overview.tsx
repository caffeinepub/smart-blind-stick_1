import {
  AlertCircle,
  ArrowRight,
  Battery,
  Check,
  ChevronRight,
  Copy,
  Cpu,
  Eye,
  MapPin,
  MessageSquare,
  Radio,
  Shield,
  Target,
  Vibrate,
  Volume2,
  Wifi,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Footer } from "../components/Footer";

const objectives = [
  {
    num: "01",
    title: "Real-Time Obstacle Detection",
    desc: "Detect obstacles within 2 meters using HC-SR04 ultrasonic sensors with instant haptic and audio feedback.",
    icon: Target,
    color: "#2E86C1",
  },
  {
    num: "02",
    title: "Emergency Alert System",
    desc: "Instantly notify emergency contacts via SMS with precise GPS coordinates when the emergency button is pressed.",
    icon: AlertCircle,
    color: "#DC2626",
  },
  {
    num: "03",
    title: "Self-Defense Mechanism",
    desc: "Built-in 1000kV taser module provides personal safety for users in threatening situations.",
    icon: Shield,
    color: "#7C3AED",
  },
  {
    num: "04",
    title: "Passive Vehicle Visibility",
    desc: "Reflective strips alert approaching vehicle drivers of the blind person's presence during night-time.",
    icon: Eye,
    color: "#D97706",
  },
  {
    num: "05",
    title: "Long Battery Life",
    desc: "18650 lithium battery (3.7V) provides extended daily use with rechargeable capability.",
    icon: Battery,
    color: "#16A34A",
  },
];

const components = [
  {
    name: "HC-SR04 Ultrasonic Sensor",
    purpose: "Obstacle detection",
    how: "Emits ultrasonic waves and measures echo return time to calculate distance (up to 4m range, 2cm accuracy).",
    icon: Radio,
    accent: "#2E86C1",
  },
  {
    name: "Arduino UNO",
    purpose: "Main microcontroller board",
    how: "Processes sensor data, runs decision logic, and controls all outputs including buzzer, motor, and GSM module.",
    icon: Cpu,
    accent: "#0891B2",
  },
  {
    name: "Vibration Motor",
    purpose: "Haptic feedback alert",
    how: "Vibrates when obstacle is detected within threshold distance, providing silent tactile feedback to the user.",
    icon: Vibrate,
    accent: "#7C3AED",
  },
  {
    name: "Buzzer",
    purpose: "Audio alert",
    how: "Generates beeping sound when obstacle is detected — beep frequency increases as the obstacle gets closer.",
    icon: Volume2,
    accent: "#D97706",
  },
  {
    name: "GPS Module",
    purpose: "Location tracking",
    how: "Receives satellite signals to determine precise geographic coordinates, enabling real-time location tracking.",
    icon: MapPin,
    accent: "#16A34A",
  },
  {
    name: "GSM Module",
    purpose: "Emergency SMS communication",
    how: "Sends SMS with GPS location to registered mobile number when emergency button is pressed by the blind user.",
    icon: MessageSquare,
    accent: "#059669",
  },
  {
    name: "Emergency Switch/Button",
    purpose: "Trigger emergency alert",
    how: "When pressed, immediately sends the user's location via GSM to the pre-registered emergency contact number.",
    icon: AlertCircle,
    accent: "#DC2626",
  },
  {
    name: "Reflective Strips",
    purpose: "Vehicle alert / passive safety",
    how: "Reflects headlight beams from oncoming vehicles to alert drivers of the blind person's presence at night.",
    icon: Eye,
    accent: "#F59E0B",
  },
  {
    name: "1000kV Step-Up Boost Module (Taser)",
    purpose: "Self-defense mechanism",
    how: "Steps up low 3.7V battery voltage to high voltage (~1000kV equivalent pulse) for self-defense situations.",
    icon: Zap,
    accent: "#7C3AED",
  },
  {
    name: "18650 Lithium Battery (3.7V)",
    purpose: "Power source",
    how: "Rechargeable lithium-ion cell that powers the entire stick system, offering high energy density and long cycle life.",
    icon: Battery,
    accent: "#16A34A",
  },
];

const arduinoCode = `#define trigPin 13
#define echoPin 12
#define motor 7
#define buzzer 6

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(motor, OUTPUT);
  pinMode(buzzer, OUTPUT);
}

void loop() {
  long duration, distance;

  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);
  distance = (duration / 2) / 29.1;

  if (distance < 70) {        // distance below 70cm
    digitalWrite(motor, HIGH); // activate vibration motor
    digitalWrite(buzzer, HIGH); // activate buzzer
  } else {
    digitalWrite(motor, LOW);  // deactivate motor
    digitalWrite(buzzer, LOW); // deactivate buzzer
  }

  delay(500);
}`;

const gpsGsmCode = `#include <SoftwareSerial.h>
#include <TinyGPS.h>
#include <Wire.h>

SoftwareSerial Gsm(7, 8);           // RX, TX pins for GSM module
char phone_no[] = "+91883058xxxx";  // Put Your phone number
TinyGPS gps;
int buttonState;
unsigned long buttonPressTime;
bool isSMSsent = false;

void setup() {
  Serial.begin(9600);
  Gsm.begin(9600);

  Gsm.print("AT+CMGF=1\\r");
  delay(100);

  Gsm.print("AT+CNMI=2,2,0,0,0\\r");
  delay(100);

  pinMode(4, INPUT_PULLUP);
}

void loop() {
  bool newData = false;
  unsigned long chars;
  unsigned short sentences, failed;

  for (unsigned long start = millis(); millis() - start < 1000;) {
    while (Serial.available()) {
      char c = Serial.read();
      Serial.print(c);  // Output GPS data to the Serial Monitor
      if (gps.encode(c))
        newData = true;  // Check if there is new GPS data
    }
  }

  buttonState = digitalRead(4);

  if (buttonState == LOW) {  // Button is pressed
    if (!isSMSsent) {
      buttonPressTime = millis();

      float flat, flon;
      unsigned long age;
      gps.f_get_position(&flat, &flon, &age);

      Gsm.print("AT+CMGF=1\\r");
      delay(400);
      Gsm.print("AT+CMGS=\\"")
      Gsm.print(phone_no);
      Gsm.println("\\"");
      Gsm.println("Alert I Need help...");
      Gsm.print("http://maps.google.com/maps?q=loc:");
      Gsm.print(flat == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flat, 6);
      Gsm.print(",");
      Gsm.print(flon == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flon, 6);
      delay(200);
      Gsm.println((char)26);
      delay(200);

      Serial.println("SMS Sent");
      isSMSsent = true;
    }
  } else {
    isSMSsent = false;
    delay(10);
  }

  Serial.println(failed);
}`;

const codeLines = arduinoCode.split("\n").map((line, n) => ({
  key: `line-${n + 1}`,
  text: line,
  num: n + 1,
}));

const gpsGsmCodeLines = gpsGsmCode.split("\n").map((line, n) => ({
  key: `gsm-line-${n + 1}`,
  text: line,
  num: n + 1,
}));

const wiringRows = [
  { component: "SR04 Ultrasonic", pin: "TRIG", arduino: "Digital Pin 13" },
  { component: "SR04 Ultrasonic", pin: "ECHO", arduino: "Digital Pin 12" },
  { component: "SR04 Ultrasonic", pin: "VCC", arduino: "5V" },
  { component: "SR04 Ultrasonic", pin: "GND", arduino: "GND" },
  { component: "Buzzer", pin: "Positive (+)", arduino: "Digital Pin 6" },
  { component: "Buzzer", pin: "Negative (\u2212)", arduino: "GND" },
  {
    component: "Vibration Motor",
    pin: "Positive (+)",
    arduino: "Digital Pin 7",
  },
  { component: "Vibration Motor", pin: "Negative (\u2212)", arduino: "GND" },
];

const gpsGsmWiringRows = [
  { component: "NEO-6M GPS", pin: "TX", arduino: "RX0 (Pin 0)" },
  { component: "NEO-6M GPS", pin: "RX", arduino: "TX1 (Pin 1)" },
  { component: "NEO-6M GPS", pin: "VCC", arduino: "VCC" },
  { component: "NEO-6M GPS", pin: "GND", arduino: "GND" },
  { component: "SIM800L GSM", pin: "VCC", arduino: "5V" },
  { component: "SIM800L GSM", pin: "TX", arduino: "D3" },
  { component: "SIM800L GSM", pin: "RX", arduino: "D2" },
  { component: "SIM800L GSM", pin: "GND", arduino: "GND" },
  { component: "18650 Battery", pin: "Positive (+)", arduino: "5V / VCC" },
  { component: "18650 Battery", pin: "Negative (−)", arduino: "GND" },
  {
    component: "Push Button",
    pin: "Pin + 10KΩ resistor",
    arduino: "D4 (pull-up to 5V)",
  },
  { component: "Push Button", pin: "Other leg", arduino: "GND" },
];

function SyntaxLine({ line }: { line: string }) {
  // Simple tokenizer: color #define, comments, function names, numbers
  const parts: { text: string; color: string }[] = [];

  // Comment
  const commentIdx = line.indexOf("//");
  const mainPart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : "";

  // Tokenise main part
  const defineMatch = mainPart.match(/^(#define)(\s+)(\w+)(\s+)(\d+)(.*)$/);
  const voidMatch = mainPart.match(/^(void\s+)(\w+)(\s*\()(.*)$/);
  const funcCallMatch = mainPart.match(/^(\s*)(\w+)(\()(.*)$/);

  if (defineMatch) {
    parts.push(
      { text: defineMatch[1], color: "#22D3EE" },
      { text: defineMatch[2], color: "#E2E8F0" },
      { text: defineMatch[3], color: "#A9D3EE" },
      { text: defineMatch[4], color: "#E2E8F0" },
      { text: defineMatch[5], color: "#FB923C" },
      { text: defineMatch[6], color: "#E2E8F0" },
    );
  } else if (voidMatch) {
    parts.push(
      { text: voidMatch[1], color: "#22D3EE" },
      { text: voidMatch[2], color: "#FDE047" },
      { text: voidMatch[3], color: "#E2E8F0" },
      { text: voidMatch[4], color: "#E2E8F0" },
    );
  } else if (
    funcCallMatch &&
    [
      "digitalWrite",
      "pinMode",
      "pulseIn",
      "delayMicroseconds",
      "delay",
    ].includes(funcCallMatch[2])
  ) {
    parts.push(
      { text: funcCallMatch[1], color: "#E2E8F0" },
      { text: funcCallMatch[2], color: "#FDE047" },
      { text: "(", color: "#E2E8F0" },
      { text: funcCallMatch[4], color: "#E2E8F0" },
    );
  } else {
    parts.push({ text: mainPart, color: "#E2E8F0" });
  }

  if (commentPart) {
    parts.push({ text: commentPart, color: "#4ADE80" });
  }

  return (
    <span>
      {parts.map((p) => (
        <span
          key={`${p.color}-${p.text.slice(0, 8)}`}
          style={{ color: p.color }}
        >
          {p.text}
        </span>
      ))}
    </span>
  );
}

export default function Overview() {
  const [copied, setCopied] = useState(false);
  const [copiedGsm, setCopiedGsm] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGsm = () => {
    navigator.clipboard.writeText(gpsGsmCode);
    setCopiedGsm(true);
    setTimeout(() => setCopiedGsm(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden hero-gradient">
        {/* BG image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              "url(/assets/generated/hero-smart-blind-stick.dim_1400x700.jpg)",
          }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(26,58,92,0.75) 50%, rgba(15,23,42,0.88) 100%)",
          }}
        />

        {/* Floating shapes */}
        <div
          className="absolute top-20 right-10 w-64 h-64 rounded-full opacity-10 float-anim"
          style={{
            background: "radial-gradient(circle, #2E86C1, transparent)",
          }}
        />
        <div
          className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-8 float-slow-anim"
          style={{
            background: "radial-gradient(circle, #A9D3EE, transparent)",
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-blue-400 opacity-60 float-anim"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-cyan-300 opacity-50 float-slow-anim"
          style={{ animationDelay: "2s" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{
                background: "rgba(46,134,193,0.2)",
                color: "#A9D3EE",
                border: "1px solid rgba(46,134,193,0.4)",
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              National Level Science Exhibition 2026
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none mb-6"
              style={{ fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}
            >
              <span className="gradient-text-white">Smart</span>
              <br />
              <span className="gradient-text">Blind Stick</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl leading-relaxed mb-8 max-w-xl"
              style={{ color: "rgba(169,211,238,0.9)" }}
            >
              Empowering visually impaired individuals with Arduino-powered
              smart navigation — obstacle detection, GPS tracking, emergency
              alerts, and self-defense in one revolutionary assistive device.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href="#introduction"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white transition-all glow-btn"
                style={{
                  background: "linear-gradient(135deg, #2E86C1, #1a5c8a)",
                }}
                data-ocid="hero.primary_button"
              >
                Explore Project <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/tracking"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold transition-all glass"
                style={{ color: "#A9D3EE" }}
                data-ocid="hero.secondary_button"
              >
                <MapPin className="w-4 h-4" /> Live Tracking
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-6 mt-12 pt-8"
              style={{ borderTop: "1px solid rgba(169,211,238,0.15)" }}
            >
              {[
                { val: "10+", label: "Components" },
                { val: "2m", label: "Detection Range" },
                { val: "GPS", label: "Live Tracking" },
                { val: "1000kV", label: "Self-Defense" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-black gradient-text">
                    {s.val}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "rgba(169,211,238,0.6)" }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section id="introduction" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
                style={{ background: "rgba(46,134,193,0.1)", color: "#2E86C1" }}
              >
                About The Project
              </span>
              <h2
                className="text-3xl sm:text-4xl font-black mb-6"
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  color: "#0F172A",
                }}
              >
                Empowering <span className="gradient-text">Independence</span>
              </h2>
              <p
                className="text-base leading-relaxed mb-4"
                style={{ color: "#6B7280" }}
              >
                The{" "}
                <strong style={{ color: "#111827" }}>Smart Blind Stick</strong>{" "}
                is an Arduino UNO-based assistive technology device designed to
                help visually impaired people navigate their surroundings safely
                and independently.
              </p>
              <p
                className="text-base leading-relaxed mb-6"
                style={{ color: "#6B7280" }}
              >
                Using an array of sensors and communication modules, the stick
                provides real-time obstacle detection through haptic and audio
                feedback, emergency location sharing via SMS, and passive
                visibility through reflective strips — all powered by a
                rechargeable lithium battery.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: Shield,
                    label: "Safety First",
                    desc: "Multi-layer protection system",
                  },
                  {
                    icon: Wifi,
                    label: "Connected",
                    desc: "GPS + GSM communication",
                  },
                  {
                    icon: Battery,
                    label: "All-Day Use",
                    desc: "Long-life 18650 battery",
                  },
                  {
                    icon: Cpu,
                    label: "Smart Logic",
                    desc: "Arduino UNO processing",
                  },
                ].map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(234,244,251,0.8)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(46,134,193,0.15)" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "#2E86C1" }} />
                    </div>
                    <div>
                      <div
                        className="text-xs font-bold"
                        style={{ color: "#111827" }}
                      >
                        {label}
                      </div>
                      <div className="text-xs" style={{ color: "#6B7280" }}>
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div
                className="rounded-3xl p-8 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #0F172A 0%, #1a3a5c 100%)",
                }}
              >
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"
                  style={{
                    background: "radial-gradient(circle, #2E86C1, transparent)",
                  }}
                />
                <h3 className="text-xl font-bold text-white mb-6">
                  System Architecture
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      layer: "Sensor Layer",
                      desc: "HC-SR04 Ultrasonic + GPS",
                      color: "#2E86C1",
                    },
                    {
                      layer: "Processing Layer",
                      desc: "Arduino UNO Controller",
                      color: "#A9D3EE",
                    },
                    {
                      layer: "Output Layer",
                      desc: "Buzzer + Vibration Motor",
                      color: "#16A34A",
                    },
                    {
                      layer: "Communication Layer",
                      desc: "GSM Module + Emergency Button",
                      color: "#DC2626",
                    },
                    {
                      layer: "Safety Layer",
                      desc: "Taser + Reflective Strips",
                      color: "#F59E0B",
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={item.layer}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          background: item.color,
                          boxShadow: `0 0 8px ${item.color}80`,
                        }}
                      />
                      <div>
                        <div
                          className="text-xs font-bold"
                          style={{ color: item.color }}
                        >
                          {item.layer}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "rgba(169,211,238,0.7)" }}
                        >
                          {item.desc}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section
        id="objectives"
        className="py-20"
        style={{ background: "linear-gradient(180deg, #EAF4FB 0%, #fff 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(46,134,193,0.1)", color: "#2E86C1" }}
            >
              Project Goals
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black"
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                color: "#0F172A",
              }}
            >
              Our <span className="gradient-text">Objectives</span>
            </h2>
          </motion.div>

          <div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-ocid="objectives.list"
          >
            {objectives.map((obj, i) => (
              <motion.div
                key={obj.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card-float p-6 group"
                data-ocid={`objectives.item.${i + 1}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${obj.color}18` }}
                  >
                    <obj.icon
                      className="w-6 h-6"
                      style={{ color: obj.color }}
                    />
                  </div>
                  <div
                    className="text-4xl font-black opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{ color: obj.color }}
                  >
                    {obj.num}
                  </div>
                </div>
                <h3
                  className="font-bold text-base mb-2"
                  style={{ color: "#111827" }}
                >
                  {obj.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#6B7280" }}
                >
                  {obj.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Components */}
      <section id="components" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(46,134,193,0.1)", color: "#2E86C1" }}
            >
              Hardware
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black"
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                color: "#0F172A",
              }}
            >
              System <span className="gradient-text">Components</span>
            </h2>
            <p
              className="text-sm mt-3 max-w-xl mx-auto"
              style={{ color: "#6B7280" }}
            >
              All 10 hardware components working in harmony to create the Smart
              Blind Stick.
            </p>
          </motion.div>

          <div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-ocid="components.list"
          >
            {components.map((comp, i) => (
              <motion.div
                key={comp.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                className="rounded-2xl bg-card shadow-card overflow-hidden group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                style={{ borderTop: `3px solid ${comp.accent}` }}
                data-ocid={`components.item.${i + 1}`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${comp.accent}18` }}
                    >
                      <comp.icon
                        className="w-5 h-5"
                        style={{ color: comp.accent }}
                      />
                    </div>
                    <h3
                      className="font-extrabold text-sm leading-tight"
                      style={{ color: "#111827" }}
                    >
                      {comp.name}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: comp.accent }}
                      >
                        Purpose
                      </span>
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: "#374151" }}
                      >
                        {comp.purpose}
                      </p>
                    </div>
                    <div>
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: "#6B7280" }}
                      >
                        How it works
                      </span>
                      <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{ color: "#6B7280" }}
                      >
                        {comp.how}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Arduino Code Section */}
      <section
        id="code"
        className="py-20"
        style={{
          background: "linear-gradient(180deg, #F1F5F9 0%, #E8F4FD 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(46,134,193,0.1)", color: "#2E86C1" }}
            >
              Source Code
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black mb-3"
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                color: "#0F172A",
              }}
            >
              Arduino <span className="gradient-text">Source Code</span>
            </h2>
            <p
              className="text-sm max-w-xl mx-auto"
              style={{ color: "#6B7280" }}
            >
              The obstacle detection logic running on the Arduino UNO —
              continuously reads distance from the ultrasonic sensor and
              triggers the vibration motor and buzzer when an obstacle is within
              70 cm.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Pin Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {[
                { pin: "Pin 13", label: "trigPin", color: "#22D3EE" },
                { pin: "Pin 12", label: "echoPin", color: "#A9D3EE" },
                { pin: "Pin 7", label: "motor", color: "#A78BFA" },
                { pin: "Pin 6", label: "buzzer", color: "#FDE047" },
              ].map((p) => (
                <div
                  key={p.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
                  style={{
                    background: "rgba(15,23,42,0.85)",
                    border: `1px solid ${p.color}40`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: p.color }}
                  />
                  <span style={{ color: p.color }}>{p.label}</span>
                  <span style={{ color: "rgba(226,232,240,0.5)" }}>=</span>
                  <span style={{ color: "#FB923C" }}>{p.pin}</span>
                </div>
              ))}
            </div>

            {/* Code block */}
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: "#0D1117",
                border: "1px solid rgba(46,134,193,0.25)",
              }}
            >
              {/* Terminal top bar */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
                  <span
                    className="ml-3 text-xs font-mono"
                    style={{ color: "rgba(169,211,238,0.5)" }}
                  >
                    smart_blind_stick.ino
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={{
                    background: copied
                      ? "rgba(74,222,128,0.15)"
                      : "rgba(46,134,193,0.15)",
                    color: copied ? "#4ADE80" : "#A9D3EE",
                    border: copied
                      ? "1px solid rgba(74,222,128,0.3)"
                      : "1px solid rgba(46,134,193,0.3)",
                  }}
                  data-ocid="code.button"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Code content */}
              <div className="overflow-x-auto">
                <pre
                  className="p-6 text-sm leading-relaxed"
                  style={{
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                  }}
                >
                  <code>
                    {codeLines.map((cl) => (
                      <div key={cl.key} className="flex">
                        <span
                          className="select-none w-8 text-right mr-5 flex-shrink-0 text-xs pt-0.5"
                          style={{ color: "rgba(255,255,255,0.15)" }}
                        >
                          {cl.num}
                        </span>
                        <SyntaxLine line={cl.text} />
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Circuit Diagram Section */}
      <section id="diagram" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(46,134,193,0.1)", color: "#2E86C1" }}
            >
              Wiring Reference
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black mb-3"
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                color: "#0F172A",
              }}
            >
              Circuit <span className="gradient-text">Diagram</span>
            </h2>
            <p
              className="text-sm max-w-xl mx-auto"
              style={{ color: "#6B7280" }}
            >
              Complete wiring schematic showing how the Arduino UNO connects to
              each sensor and actuator component.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div
              className="w-full rounded-3xl overflow-hidden p-2"
              style={{
                background:
                  "linear-gradient(135deg, rgba(46,134,193,0.08) 0%, rgba(169,211,238,0.12) 50%, rgba(46,134,193,0.06) 100%)",
                border: "1px solid rgba(46,134,193,0.2)",
                boxShadow:
                  "0 20px 60px rgba(46,134,193,0.12), 0 4px 20px rgba(0,0,0,0.08)",
              }}
            >
              <img
                src="/assets/generated/circuit-diagram-wired.dim_900x600.png"
                alt="Smart Blind Stick Circuit Diagram — Arduino UNO connected to HC-SR04, Vibration Motor, and Buzzer"
                className="w-full rounded-2xl"
                style={{ display: "block" }}
              />
            </div>
            <p
              className="mt-4 text-xs text-center max-w-2xl font-mono"
              style={{ color: "#6B7280" }}
            >
              Arduino UNO wiring: SR04 TRIG→Pin 13, ECHO→Pin 12, VCC→5V, GND→GND
              | Buzzer +→Pin 6, GND→GND | Vibration Motor +→Pin 7, GND→GND
            </p>

            {/* Wiring Summary Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full mt-8 rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(46,134,193,0.25)",
                boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
              }}
            >
              <table
                className="w-full text-xs"
                style={{ fontFamily: "'Fira Code', 'Courier New', monospace" }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "linear-gradient(135deg, #1a3a5c 0%, #2E86C1 100%)",
                    }}
                  >
                    {["Component", "Pin", "Arduino UNO"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-bold uppercase tracking-wider"
                        style={{ color: "#A9D3EE", fontSize: "0.7rem" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wiringRows.map((row, i) => (
                    <tr
                      key={`${row.component}-${row.pin}`}
                      style={{
                        background:
                          i % 2 === 0
                            ? "rgba(15,23,42,0.92)"
                            : "rgba(26,47,72,0.88)",
                        borderBottom: "1px solid rgba(46,134,193,0.1)",
                      }}
                    >
                      <td className="px-5 py-2.5" style={{ color: "#A9D3EE" }}>
                        {row.component}
                      </td>
                      <td className="px-5 py-2.5" style={{ color: "#FDE047" }}>
                        {row.pin}
                      </td>
                      <td className="px-5 py-2.5" style={{ color: "#4ADE80" }}>
                        {row.arduino}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* GPS & GSM System Section */}
      <section
        id="gps-gsm"
        className="py-20"
        style={{
          background: "linear-gradient(180deg, #F1F5F9 0%, #E8F4FD 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}
            >
              Emergency Alert System
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black mb-3"
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                color: "#0F172A",
              }}
            >
              GPS &amp; GSM <span className="gradient-text">System</span>
            </h2>
            <p
              className="text-sm max-w-xl mx-auto"
              style={{ color: "#6B7280" }}
            >
              The Arduino Nano reads live GPS coordinates via NEO-6M and fires
              an SMS with a Google Maps link through the SIM800L GSM module
              whenever the emergency button is pressed.
            </p>
          </motion.div>

          {/* GPS/GSM Arduino Code Sub-section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-16"
          >
            <div className="mb-6">
              <h3
                className="text-xl font-black mb-2"
                style={{ color: "#0F172A" }}
              >
                GPS &amp; GSM Arduino Code
              </h3>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Emergency alert system — reads GPS coordinates via NEO-6M and
                sends an SMS with a Google Maps location link using SIM800L GSM
                when the emergency button is pressed.
              </p>
            </div>

            {/* Pin Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {[
                { pin: "Pin 7", label: "gsmRX", color: "#22D3EE" },
                { pin: "Pin 8", label: "gsmTX", color: "#FDE047" },
                { pin: "Pin 4", label: "emergencyBtn", color: "#F87171" },
                { pin: "Pin 0/1", label: "gpsSerial", color: "#4ADE80" },
              ].map((p) => (
                <div
                  key={p.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
                  style={{
                    background: "rgba(15,23,42,0.85)",
                    border: `1px solid ${p.color}40`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: p.color }}
                  />
                  <span style={{ color: p.color }}>{p.label}</span>
                  <span style={{ color: "rgba(226,232,240,0.5)" }}>=</span>
                  <span style={{ color: "#FB923C" }}>{p.pin}</span>
                </div>
              ))}
            </div>

            {/* GPS/GSM Code block */}
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: "#0D1117",
                border: "1px solid rgba(220,38,38,0.25)",
              }}
            >
              {/* Terminal top bar */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
                  <span
                    className="ml-3 text-xs font-mono"
                    style={{ color: "rgba(169,211,238,0.5)" }}
                  >
                    gps_gsm_alert.ino
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyGsm}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={{
                    background: copiedGsm
                      ? "rgba(74,222,128,0.15)"
                      : "rgba(220,38,38,0.15)",
                    color: copiedGsm ? "#4ADE80" : "#FCA5A5",
                    border: copiedGsm
                      ? "1px solid rgba(74,222,128,0.3)"
                      : "1px solid rgba(220,38,38,0.3)",
                  }}
                  data-ocid="gps-gsm-code.button"
                >
                  {copiedGsm ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Code content */}
              <div className="overflow-x-auto">
                <pre
                  className="p-6 text-sm leading-relaxed"
                  style={{
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                  }}
                >
                  <code>
                    {gpsGsmCodeLines.map((cl) => (
                      <div key={cl.key} className="flex">
                        <span
                          className="select-none w-8 text-right mr-5 flex-shrink-0 text-xs pt-0.5"
                          style={{ color: "rgba(255,255,255,0.15)" }}
                        >
                          {cl.num}
                        </span>
                        <span style={{ color: "#E2E8F0" }}>{cl.text}</span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          </motion.div>

          {/* GPS/GSM Circuit Diagram Sub-section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="mb-6">
              <h3
                className="text-xl font-black mb-2"
                style={{ color: "#0F172A" }}
              >
                GPS &amp; GSM Circuit Diagram
              </h3>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Wiring schematic for Arduino Nano with SIM800L GSM and NEO-6M
                GPS modules — press the emergency button to trigger an SMS alert
                with live GPS coordinates.
              </p>
            </div>

            <div
              className="flex flex-col items-center bg-white rounded-3xl p-6 shadow-sm"
              style={{ border: "1px solid rgba(220,38,38,0.15)" }}
            >
              <div
                className="w-full rounded-3xl overflow-hidden p-2"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(220,38,38,0.06) 0%, rgba(251,191,36,0.08) 50%, rgba(220,38,38,0.04) 100%)",
                  border: "1px solid rgba(220,38,38,0.2)",
                  boxShadow:
                    "0 20px 60px rgba(220,38,38,0.08), 0 4px 20px rgba(0,0,0,0.06)",
                }}
              >
                <img
                  src="/assets/generated/gps-gsm-circuit-v2.dim_900x600.png"
                  alt="GPS GSM Circuit Diagram — Arduino Nano with SIM800L and NEO-6M GPS"
                  className="w-full rounded-2xl"
                  style={{ display: "block" }}
                />
              </div>
              <p
                className="mt-4 text-xs text-center max-w-2xl font-mono"
                style={{ color: "#6B7280" }}
              >
                Arduino Nano wiring: NEO-6M GPS TX→RX0, RX→TX1, VCC→VCC |
                SIM800L TX→D3, RX→D2, VCC→5V | 18650 Battery +→5V, -→GND |
                Button + 10K pull-up → D4
              </p>

              {/* GPS/GSM Wiring Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full mt-8 rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(220,38,38,0.25)",
                  boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
                }}
              >
                <table
                  className="w-full text-xs"
                  style={{
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          "linear-gradient(135deg, #7f1d1d 0%, #DC2626 100%)",
                      }}
                    >
                      {["Component", "Pin", "Arduino Nano"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left font-bold uppercase tracking-wider"
                          style={{ color: "#FCA5A5", fontSize: "0.7rem" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gpsGsmWiringRows.map((row, i) => (
                      <tr
                        key={`${row.component}-${row.pin}`}
                        style={{
                          background:
                            i % 2 === 0
                              ? "rgba(15,23,42,0.92)"
                              : "rgba(26,47,72,0.88)",
                          borderBottom: "1px solid rgba(220,38,38,0.1)",
                        }}
                      >
                        <td
                          className="px-5 py-2.5"
                          style={{ color: "#FCA5A5" }}
                        >
                          {row.component}
                        </td>
                        <td
                          className="px-5 py-2.5"
                          style={{ color: "#FDE047" }}
                        >
                          {row.pin}
                        </td>
                        <td
                          className="px-5 py-2.5"
                          style={{ color: "#4ADE80" }}
                        >
                          {row.arduino}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Conclusion */}
      <section id="conclusion" className="py-20 conclusion-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
                style={{
                  background: "rgba(169,211,238,0.15)",
                  color: "#A9D3EE",
                }}
              >
                Impact & Scope
              </span>
              <h2
                className="text-3xl sm:text-4xl font-black text-white mb-6"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
              >
                Project Impact &
                <br />
                <span className="gradient-text">Future Scope</span>
              </h2>
              <p
                className="text-base leading-relaxed mb-6"
                style={{ color: "rgba(169,211,238,0.85)" }}
              >
                The Smart Blind Stick addresses the daily navigation challenges
                faced by over 285 million visually impaired individuals
                worldwide. By combining affordable Arduino hardware with
                intelligent sensor fusion, we've created a practical,
                cost-effective solution for safer independent mobility.
              </p>
              <a
                href="/tracking"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all glow-btn"
                style={{
                  background: "linear-gradient(135deg, #2E86C1, #1a5c8a)",
                }}
                data-ocid="conclusion.primary_button"
              >
                View Live Demo <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold" style={{ color: "#A9D3EE" }}>
                Future Scope
              </h3>
              {[
                {
                  icon: Wifi,
                  title: "IoT Cloud Integration",
                  desc: "Real-time data sync to cloud dashboard for caregivers",
                },
                {
                  icon: Cpu,
                  title: "AI Obstacle Recognition",
                  desc: "Deep learning to classify obstacle types (stairs, doors, vehicles)",
                },
                {
                  icon: MapPin,
                  title: "Mobile App Companion",
                  desc: "Dedicated app for family monitoring and route history",
                },
                {
                  icon: Radio,
                  title: "Advanced Sensors",
                  desc: "LiDAR and depth cameras for 3D spatial awareness",
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(169,211,238,0.1)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(46,134,193,0.25)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#A9D3EE" }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{title}</div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(169,211,238,0.7)" }}
                    >
                      {desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
