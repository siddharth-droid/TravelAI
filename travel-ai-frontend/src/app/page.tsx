"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import lzstring from "lz-string";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Highlight  { icon: string; title: string; description: string; }
interface DayPlan    { day: string; theme: string; activities: string; }
interface HiddenGem  { icon: string; title: string; description: string; }

interface TravelPlan {
  destination: string;
  tagline: string;
  overview: string;
  best_time_to_visit: { months: string; why: string };
  highlights: Highlight[];
  itinerary_suggestion: { duration: string; days: DayPlan[] };
  practical_tips: {
    getting_there: string;
    local_transport: string;
    where_to_stay: string;
    budget_estimate: { budget: string; mid_range: string; luxury: string };
    food_scene: string;
  };
  hidden_gems: HiddenGem[];
  local_tips: string[];
  vibe_tags: string[];
}

/* ── Static data ────────────────────────────────────────────────────────── */
const inspirationPrompts = [
  { label: "3 slow days in Kyoto",       sub: "temples, tea, morning shrines",        query: "3 slow days in Kyoto — quiet cafes, shrines, and temple gardens"                    },
  { label: "Old Delhi to Varanasi",       sub: "ghats, spice markets, chai stops",     query: "One week across Old Delhi and Varanasi — the ghats at dawn, old bazaars, street food" },
  { label: "Romantic Paris weekend",      sub: "boutique stays, no tourist traps",     query: "Romantic Paris long weekend with boutique stays and hidden bistros"                  },
  { label: "Ladakh adventure trek",       sub: "altitude, monasteries, raw Himalayas", query: "Adventure-heavy Ladakh plan with proper acclimatization days"                        },
  { label: "Kerala backwaters slow trip", sub: "houseboats, spice routes, coast",      query: "10 days in Kerala — backwater houseboats, Munnar tea hills, and Fort Kochi"         },
  { label: "10 days across Morocco",      sub: "medinas, desert camps, coastal towns", query: "10 days across Morocco — Marrakech medina, Sahara camp, Essaouira coast"            },
  { label: "Rajasthan royal circuit",     sub: "forts, desert, haveli stays",          query: "Two weeks across Rajasthan — Jaipur, Jodhpur, Jaisalmer, and Udaipur"              },
  { label: "Greek island-hopping",        sub: "Santorini, Naxos, Paros",              query: "Island-hopping in Greece — Santorini, Naxos, and Paros in 10 days"                 },
];

const loadingPhrases = [
  (dest: string) => `Researching ${dest}…`,
  () => "Finding the hidden gems…",
  () => "Building your itinerary…",
  () => "Talking to the locals…",
  () => "Almost ready…",
];

const destinationImages = [
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80",
];

/* ── Helpers ────────────────────────────────────────────────────────────── */
function normalizePlan(raw: Record<string, unknown>): TravelPlan {
  const pt = raw.practical_tips as Partial<TravelPlan["practical_tips"]> | undefined;
  return {
    destination: String(raw.destination || ""),
    tagline: String(raw.tagline || ""),
    overview: String(raw.overview || raw.summary || ""),
    best_time_to_visit: (raw.best_time_to_visit as TravelPlan["best_time_to_visit"]) || { months: "", why: "" },
    highlights: (raw.highlights as Highlight[]) || [],
    itinerary_suggestion: (raw.itinerary_suggestion as TravelPlan["itinerary_suggestion"]) || { duration: "", days: [] },
    practical_tips: {
      getting_there:  String(pt?.getting_there  || ""),
      local_transport: String(pt?.local_transport || ""),
      where_to_stay:  String(pt?.where_to_stay   || ""),
      budget_estimate: pt?.budget_estimate || { budget: "", mid_range: "", luxury: "" },
      food_scene:     String(pt?.food_scene      || ""),
    },
    hidden_gems: (raw.hidden_gems as HiddenGem[]) || [],
    local_tips:  (raw.local_tips  as string[])    || [],
    vibe_tags:   (raw.vibe_tags   as string[])    || [],
  };
}

function encodePlan(plan: TravelPlan): string {
  try {
    return lzstring.compressToEncodedURIComponent(JSON.stringify(plan));
  } catch { return ""; }
}

function decodePlan(compressed: string): TravelPlan | null {
  try {
    const json = lzstring.decompressFromEncodedURIComponent(compressed);
    return json ? JSON.parse(json) as TravelPlan : null;
  } catch { return null; }
}

/* ── Typewriter hook ─────────────────────────────────────────────────────── */
function useTypewriter(destination: string, active: boolean): string {
  const [text, setText]           = useState("");
  const [msgIndex, setMsgIndex]   = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase]         = useState<"typing" | "hold" | "erasing">("typing");

  useEffect(() => {
    if (!active) {
      setText(""); setMsgIndex(0); setCharIndex(0); setPhase("typing");
      return;
    }
    const fullText = loadingPhrases[msgIndex % loadingPhrases.length](destination);

    if (phase === "typing") {
      if (charIndex < fullText.length) {
        const t = setTimeout(() => {
          setText(fullText.slice(0, charIndex + 1));
          setCharIndex(c => c + 1);
        }, 36);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("hold"), 1600);
        return () => clearTimeout(t);
      }
    }
    if (phase === "hold") {
      const t = setTimeout(() => setPhase("erasing"), 200);
      return () => clearTimeout(t);
    }
    if (phase === "erasing") {
      if (charIndex > 0) {
        const t = setTimeout(() => {
          setText(fullText.slice(0, charIndex - 1));
          setCharIndex(c => c - 1);
        }, 16);
        return () => clearTimeout(t);
      } else {
        setMsgIndex(m => m + 1);
        setPhase("typing");
      }
    }
  }, [active, phase, charIndex, msgIndex, destination]);

  return text;
}


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [query,            setQuery]            = useState("");
  const [plan,             setPlan]             = useState<TravelPlan | null>(null);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [copyState,        setCopyState]        = useState<"idle"|"copied">("idle");
  const [isShared,         setIsShared]         = useState(false);
  const [loadingDest,      setLoadingDest]      = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const typewriterText = useTypewriter(loadingDest, loading);

  const hasGeneratedPlan = Boolean(plan);

  /* Read shared plan from URL hash on mount */
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const loaded = decodePlan(hash);
      if (loaded) { setPlan(loaded); setIsShared(true); }
    }
  }, []);

  const heroImage = useMemo(() => {
    if (!plan) return destinationImages[0];
    return destinationImages[plan.destination.length % destinationImages.length];
  }, [plan]);

  /* Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Derive a clean destination label for the loading UI
    const destGuess = query
      .split("—")[0]
      .replace(/^\d+\s*(slow\s*)?(days?|weeks?)\s*(in|across|through|around)\s*/i, "")
      .replace(/^(food-first|romantic|adventure-heavy|island-hopping in)\s*/i, "")
      .trim() || query.split(" ").slice(0, 3).join(" ");
    setLoadingDest(destGuess);
    setLoading(true);
    setError("");
    setPlan(null);
    setIsShared(false);
    window.history.replaceState({}, "", window.location.pathname);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("Failed");
      setPlan(normalizePlan(await res.json()));
    } catch {
      setError("Something went wrong. Please check the backend and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Share */
  const handleShare = useCallback(() => {
    if (!plan) return;
    const compressed = encodePlan(plan);
    if (!compressed) return;
    const url = `${window.location.origin}${window.location.pathname}#${compressed}`;

    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 2500);
      } catch {
        window.prompt("Copy this link:", url);
      } finally {
        document.body.removeChild(ta);
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 2500);
      }).catch(fallback);
    } else {
      fallback();
    }
  }, [plan]);

  /* Prompt card click */
  const pickPrompt = (promptQuery: string) => {
    setQuery(promptQuery);
    inputRef.current?.focus();
  };

  /* ── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <main style={{ background: "var(--surface-0)", color: "var(--text-primary)", minHeight: "100vh" }}>

      {/* Shared banner */}
      {isShared && (
        <div className="sticky top-0 z-50 flex items-center justify-between px-5 py-2.5"
          style={{ background: "var(--surface-dark)" }}>
          <span className="text-xs" style={{ color: "var(--text-inverse-dim)" }}>
            Viewing a shared itinerary
          </span>
          <button onClick={() => { setPlan(null); setIsShared(false); window.history.replaceState({}, "", window.location.pathname); }}
            className="rounded-lg px-3 py-1 text-xs font-medium transition"
            style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-inverse)" }}>
            Plan my own →
          </button>
        </div>
      )}

      {/* ── LANDING STATE ──────────────────────────────────────────────── */}
      {!hasGeneratedPlan && !loading && (
        <LandingState
          query={query}
          setQuery={setQuery}
          inputRef={inputRef}
          onSubmit={handleSubmit}
          onPickPrompt={pickPrompt}
          error={error}
        />
      )}

      {/* ── LOADING STATE ──────────────────────────────────────────────── */}
      {loading && (
        <LoadingState typewriterText={typewriterText} destination={loadingDest} />
      )}

      {/* ── PLAN STATE ─────────────────────────────────────────────────── */}
      {hasGeneratedPlan && !loading && (
        <PlanLayout
          plan={plan!}
          query={query}
          setQuery={setQuery}
          inputRef={inputRef}
          loading={loading}
          onSubmit={handleSubmit}
          heroImage={heroImage}
          copyState={copyState}
          onShare={handleShare}
          error={error}
        />
      )}

    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LANDING STATE
══════════════════════════════════════════════════════════════════════════ */
function LandingState({
  query, setQuery, inputRef, onSubmit, onPickPrompt, error
}: {
  query: string;
  setQuery: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onPickPrompt: (s: string) => void;
  error: string;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav bar — minimal */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          {/* Wordmark — not a box with letters */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="var(--text-primary)" strokeWidth="1.4"/>
            <path d="M5 11 C7 7, 15 7, 17 11 C15 15, 7 15, 5 11Z" stroke="var(--accent)" strokeWidth="1.3" fill="none"/>
            <circle cx="11" cy="11" r="1.8" fill="var(--accent)"/>
          </svg>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            TravelAI
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-sans)" }}>
          AI itinerary studio
        </span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 md:py-20 animate-fade-in">
        {/* Headline */}
        <div className="text-center max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] mb-6"
            style={{ color: "var(--text-tertiary)" }}>
            Plan smarter. Travel better.
          </p>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "clamp(40px, 8vw, 80px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}>
            Where are you<br />going next?
          </h1>
          <p className="mt-5 text-base leading-7 max-w-lg mx-auto"
            style={{ color: "var(--text-secondary)" }}>
            Describe your trip in plain language. Get a full itinerary, hidden gems,
            local tips, and a budget guide — in seconds.
          </p>
        </div>

        {/* Search — the hero CTA */}
        <form onSubmit={onSubmit} className="w-full max-w-2xl mt-10">
          <div className="landing-input-wrap rounded-2xl overflow-hidden"
            style={{
              background: "white",
              border: "1.5px solid var(--border-medium)",
              boxShadow: "0 4px 24px rgba(26,23,19,0.07), 0 1px 4px rgba(26,23,19,0.04)",
            }}>
            <div className="flex flex-col sm:flex-row">
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="5 days in Barcelona — food, art, coastal walks…"
                className="travel-input flex-1 px-5 py-4 text-sm bg-transparent outline-none"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-sans)", minHeight: 54, fontSize: "14px" }}
                autoFocus
              />
              <button
                disabled={!query.trim()}
                className="px-7 py-4 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed sm:rounded-none sm:rounded-r-[14px]"
                style={{ background: "var(--text-primary)", color: "white", minHeight: 54, whiteSpace: "nowrap" }}
              >
                Plan my trip
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm px-1" style={{ color: "var(--accent-text)" }}>{error}</p>
          )}
        </form>

        {/* Inspiration cards — edition tile */}
        <div className="mt-10 w-full max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-6 text-center"
            style={{ color: "var(--text-tertiary)" }}>
            Need a starting point?
          </p>
          <div className="inspiration-scroll">
            {inspirationPrompts.map((p, i) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onPickPrompt(p.query)}
                className="inspo-card"
                data-num={String(i + 1).padStart(2, "0")}
                aria-label={`Use prompt: ${p.label}`}
              >
                <span className="inspo-sub">{p.sub}</span>
                <span className="inspo-title">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ambient decorative line — not a stock photo */}
        <div className="mt-16 flex items-center gap-3 opacity-30">
          {["Rome", "Tokyo", "Lisbon", "Bali", "Marrakech", "Patagonia"].map((city, i) => (
            <span key={city} style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: i % 2 === 0 ? "13px" : "11px",
              color: "var(--text-secondary)",
            }}>
              {city}{i < 5 ? " ·" : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOADING STATE
══════════════════════════════════════════════════════════════════════════ */
function LoadingState({ typewriterText, destination }: { typewriterText: string; destination: string }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen animate-fade-in">

      {/* ── Sidebar — pulsing destination name ── */}
      <aside className="lg:w-[280px] lg:shrink-0 border-b lg:border-b-0 lg:border-r px-6 py-6 flex flex-col gap-6"
        style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="var(--text-primary)" strokeWidth="1.4"/>
            <path d="M5 11 C7 7, 15 7, 17 11 C15 15, 7 15, 5 11Z" stroke="var(--accent)" strokeWidth="1.3" fill="none"/>
            <circle cx="11" cy="11" r="1.8" fill="var(--accent)"/>
          </svg>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px", letterSpacing: "-0.01em" }}>TravelAI</span>
        </div>

        {/* Destination — pulsing name, not a skeleton bar */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3"
            style={{ color: "var(--text-tertiary)" }}>Destination</p>
          {destination ? (
            <p className="animate-pulse-warm leading-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "clamp(20px, 3vw, 28px)",
                color: "var(--text-secondary)",
              }}>
              {destination}
            </p>
          ) : (
            <div className="skeleton h-8 w-3/4 rounded-lg" />
          )}
          {/* Tagline skeleton lines */}
          <div className="mt-3 space-y-1.5">
            <div className="skeleton h-3 rounded" style={{ width: "90%" }} />
            <div className="skeleton h-3 rounded" style={{ width: "68%" }} />
          </div>
        </div>

        {/* Stats grid skeletons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)" }}>
            <div className="skeleton h-2 w-12 rounded mb-3" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)" }}>
            <div className="skeleton h-2 w-14 rounded mb-3" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
        </div>

        {/* Vibe tag skeletons */}
        <div>
          <div className="skeleton h-2 w-8 rounded mb-3" />
          <div className="flex flex-wrap gap-2">
            {[48, 62, 54, 42].map(w => (
              <div key={w} className="skeleton h-6 rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Budget card skeleton — dark background */}
        <div className="rounded-2xl p-5" style={{ background: "var(--surface-dark)" }}>
          <div className="h-2 w-16 rounded mb-5"
            style={{ background: "rgba(255,255,255,0.12)", backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.06) 75%)", backgroundSize: "300px 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
          <div className="space-y-5">
            {[60, 72, 52].map(w => (
              <div key={w}>
                <div className="h-2 w-10 rounded mb-2"
                  style={{ background: "rgba(255,255,255,0.08)", backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "300px 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
                <div className="h-5 rounded"
                  style={{ width: w, background: "rgba(255,255,255,0.08)", backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "300px 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main area skeletons ── */}
      <div className="flex-1 min-w-0 px-5 py-8 md:px-8 lg:py-8">

        {/* Typewriter status */}
        <div className="mb-8 flex items-center gap-3" style={{ minHeight: 28 }}>
          <span className="rounded-full shrink-0 animate-pulse-warm"
            style={{ width: 7, height: 7, background: "var(--accent)", display: "inline-block" }} />
          <span className="cursor-blink" style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "15px",
            color: "var(--text-secondary)",
            minWidth: "1ch",
          }}>
            {typewriterText}
          </span>
        </div>

        {/* Hero skeleton */}
        <div className="skeleton rounded-2xl mb-5" style={{ height: 280 }} />

        {/* Info trio */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {[0, 1, 2].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>

        {/* Section header skeleton */}
        <div className="mb-5">
          <div className="skeleton h-2.5 w-20 rounded mb-3" />
          <div className="skeleton h-7 w-36 rounded" />
        </div>

        {/* Day card skeletons */}
        <div className="space-y-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center shrink-0 pt-1" style={{ width: 30 }}>
                <div className="rounded-full animate-pulse-warm"
                  style={{ width: 10, height: 10, background: "var(--accent-light)", border: "2px solid white", boxShadow: "0 0 0 3px var(--accent-light)", marginTop: 5 }} />
                {i < 2 && <div className="mt-2 flex-1 w-px" style={{ background: "var(--border-subtle)", minHeight: 60 }} />}
              </div>
              <div className="flex-1 rounded-[18px] p-5"
                style={{ background: "white", border: "1px solid var(--border-medium)", boxShadow: "0 2px 14px rgba(26,23,19,0.065)" }}>
                <div className="skeleton h-2.5 w-12 rounded mb-3" />
                <div className="skeleton h-5 w-48 rounded mb-3" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3 rounded" style={{ width: "92%" }} />
                  <div className="skeleton h-3 rounded" style={{ width: "76%" }} />
                  <div className="skeleton h-3 rounded" style={{ width: "58%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature panel skeletons */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {[false, true].map((acc, idx) => (
            <div key={idx} className="rounded-2xl p-5"
              style={{ background: acc ? "var(--surface-1)" : "white", border: "1px solid var(--border-subtle)" }}>
              <div className="skeleton h-5 w-36 rounded mb-5" />
              {[0, 1, 2].map(j => (
                <div key={j} className="border-t pt-4 first:border-t-0 first:pt-0"
                  style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="skeleton h-3.5 w-28 rounded mb-2" />
                  <div className="skeleton h-3 rounded mb-1" style={{ width: "82%" }} />
                  <div className="skeleton h-3 rounded" style={{ width: "60%" }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PLAN LAYOUT (two-column with sidebar)
══════════════════════════════════════════════════════════════════════════ */
function PlanLayout({
  plan, query, setQuery, inputRef, loading, onSubmit,
  heroImage, copyState, onShare, error,
}: {
  plan: TravelPlan;
  query: string;
  setQuery: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  heroImage: string;
  copyState: "idle" | "copied";
  onShare: () => void;
  error: string;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="border-b lg:sticky lg:top-0 lg:h-screen lg:w-[300px] lg:shrink-0 lg:border-b-0 lg:border-r lg:overflow-y-auto"
        style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex flex-col px-6 py-6 gap-6">
          {/* Logo — wordmark only */}
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke="var(--text-primary)" strokeWidth="1.4"/>
              <path d="M5 11 C7 7, 15 7, 17 11 C15 15, 7 15, 5 11Z" stroke="var(--accent)" strokeWidth="1.3" fill="none"/>
              <circle cx="11" cy="11" r="1.8" fill="var(--accent)"/>
            </svg>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px", letterSpacing: "-0.01em" }}>TravelAI</span>
          </div>

          {/* Destination — the hero of the sidebar */}
          <div className="animate-slide-up">
            <h1 className="leading-tight" style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "clamp(22px, 3vw, 32px)",
              color: "var(--text-primary)",
            }}>
              {plan.destination}
            </h1>
            <p className="mt-2 text-sm leading-6" style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "var(--text-secondary)",
              fontSize: "13px",
            }}>
              {plan.tagline}
            </p>
          </div>

          {/* Duration + Window */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Duration", value: plan.itinerary_suggestion.duration || "Flexible" },
              { label: "Best window", value: plan.best_time_to_visit.months || "Anytime" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-4"
                style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
                  style={{ color: "var(--text-tertiary)" }}>{label}</p>
                <p className="text-sm font-semibold leading-5"
                  style={{ color: "var(--text-primary)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Vibe tags */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3"
              style={{ color: "var(--text-tertiary)" }}>Vibe</p>
            <div className="flex flex-wrap gap-2">
              {plan.vibe_tags.map(tag => (
                <span key={tag} className="rounded-full px-3 py-1 text-xs"
                  style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                  {tag.replace(/^#/, "")}
                </span>
              ))}
            </div>
          </div>

          {/* Budget dark card */}
          <div className="rounded-2xl p-5" style={{ background: "var(--surface-dark)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-5"
              style={{ color: "var(--text-inverse-dim)" }}>Budget guide</p>
            {[
              ["Budget",    plan.practical_tips.budget_estimate.budget],
              ["Mid-range", plan.practical_tips.budget_estimate.mid_range],
              ["Luxury",    plan.practical_tips.budget_estimate.luxury],
            ].map(([label, value]) => (
              <div key={label} className="mb-4 last:mb-0">
                <p className="text-[10px] uppercase tracking-[0.16em] mb-1"
                  style={{ color: "var(--text-inverse-dim)" }}>{label}</p>
                <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "15px", color: "var(--text-inverse)" }}>
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <section className="flex-1 min-w-0">
        <div className="mx-auto max-w-4xl px-5 py-5 md:px-8 lg:py-8">

          {/* Sticky search */}
          <div className="sticky top-0 z-20 -mx-5 border-b px-5 py-4 backdrop-blur md:-mx-8 md:px-8"
            style={{ background: "rgba(250,248,244,0.96)", borderColor: "var(--border-subtle)" }}>
            <form onSubmit={onSubmit}>
              <div className="flex flex-col gap-3 rounded-2xl p-3 md:flex-row md:items-center"
                style={{ background: "white", border: "1px solid var(--border-subtle)", boxShadow: "0 1px 4px rgba(26,23,19,0.05)" }}>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Try another destination…"
                  className="travel-input min-h-10 flex-1 rounded-xl px-4 text-sm transition"
                  style={{ background: "var(--surface-1)", border: "1px solid transparent", color: "var(--text-primary)" }}
                />
                <button
                  disabled={loading || !query.trim()}
                  className="min-h-10 rounded-xl px-5 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "var(--text-primary)", color: "white" }}>
                  {loading ? <span className="animate-pulse-warm inline-block">Building…</span> : "Generate itinerary"}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="mt-4 rounded-xl px-5 py-4 text-sm"
              style={{ background: "#fef0ed", border: "1px solid #e8bbaf", color: "#8b3020" }}>
              {error}
            </div>
          )}

          {/* Plan content */}
          <div className="animate-fade-in">
            {/* Hero */}
            <div className="mt-6 overflow-hidden rounded-2xl" style={{ background: "var(--surface-dark)" }}>
              <div className="relative overflow-hidden" style={{ minHeight: 300 }}>
                <img
                  src={heroImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
                  style={{ minHeight: 300 }}
                />
                <div className="absolute inset-0 hero-overlay" />
                <div className="relative z-10 p-8 md:p-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] mb-4"
                    style={{ color: "#decfb6" }}>Your route is ready</p>
                  <h2 className="leading-none" style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: "clamp(36px, 6vw, 68px)",
                    letterSpacing: "-0.02em",
                    color: "var(--text-inverse)",
                  }}>
                    {plan.destination}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7" style={{ color: "#f0e6d6" }}>
                    {plan.overview}
                  </p>
                  {/* Share button */}
                  <button onClick={onShare}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition"
                    style={{
                      background: copyState === "copied" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      color: copyState === "copied" ? "#b8f0c8" : "var(--text-inverse)",
                    }}>
                    {copyState === "copied" ? (
                      <><CheckIcon /> Link copied!</>
                    ) : (
                      <><ShareIcon /> Share itinerary</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Info trio */}
            <div className="mt-5 grid gap-4 sm:grid-cols-3 items-start">
              <InfoBlock title="Best time to visit" kicker={plan.best_time_to_visit.months} body={plan.best_time_to_visit.why} />
              <InfoBlock title="Where to stay" body={plan.practical_tips.where_to_stay} />
              <InfoBlock title="Food scene"    body={plan.practical_tips.food_scene} />
            </div>

            {/* Itinerary */}
            <div className="mt-8">
              <Eyebrow>Day by day</Eyebrow>
              <h3 className="mt-2 mb-6" style={{ fontFamily: "var(--font-serif)", fontSize: "26px" }}>
                Itinerary
              </h3>
              {plan.itinerary_suggestion.days.map((day, i) => (
                <DayCard
                  key={`${day.day}-${i}`}
                  day={day}
                  index={i}
                  isLast={i === plan.itinerary_suggestion.days.length - 1}
                  image={destinationImages[(i + 1) % destinationImages.length]}
                />
              ))}
            </div>

            {/* Highlights + Hidden gems */}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FeaturePanel title="Must-do experiences" items={plan.highlights} />
              <FeaturePanel title="Hidden gems" items={plan.hidden_gems} accent />
            </div>

            {/* Practical row */}
            <div className="mt-5 mb-16 grid gap-4 sm:grid-cols-3 items-start">
              <InfoBlock title="Getting there"   body={plan.practical_tips.getting_there} />
              <InfoBlock title="Local transport" body={plan.practical_tips.local_transport} />
              <TipsPanel tips={plan.local_tips} />
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
══════════════════════════════════════════════════════════════════════════ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: "var(--text-tertiary)" }}>{children}</p>
  );
}

function InfoBlock({ title, body, kicker }: { title: string; body: string; kicker?: string }) {
  return (
    <article className="card-flat p-5">
      <Eyebrow>{title}</Eyebrow>
      {kicker && <p className="mt-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{kicker}</p>}
      <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{body || "Details pending."}</p>
    </article>
  );
}

function DayCard({ day, index, isLast, image }: {
  day: DayPlan; index: number; isLast: boolean; image: string;
}) {
  return (
    <div className="relative flex gap-4 pb-6">
      <div className="relative flex flex-col items-center shrink-0 pt-1" style={{ width: 30 }}>
        <div className="timeline-dot" />
        {!isLast && (
          <div className="mt-2 flex-1 w-px" style={{ background: "var(--border-subtle)", minHeight: 36 }} />
        )}
      </div>
      <article className="card-raised flex-1 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
              style={{ color: "var(--accent)" }}>{day.day}</p>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", color: "var(--text-primary)", lineHeight: 1.25 }}>
              {day.theme}
            </h4>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{day.activities}</p>
          </div>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="hidden h-20 w-28 shrink-0 rounded-xl object-cover sm:block"
          />
        </div>
      </article>
    </div>
  );
}

function FeaturePanel({ title, items, accent }: {
  title: string; items: Highlight[] | HiddenGem[]; accent?: boolean;
}) {
  return (
    <section className="rounded-2xl p-5"
      style={{ background: accent ? "var(--surface-1)" : "white", border: "1px solid var(--border-subtle)" }}>
      <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", color: "var(--text-primary)" }}>{title}</h3>
      <div className="mt-4 space-y-5">
        {items.map((item, i) => (
          <article key={`${item.title}-${i}`}
            className="border-t pt-4 first:border-t-0 first:pt-0"
            style={{ borderColor: "var(--border-subtle)" }}>
            <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{item.title}</h4>
            <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TipsPanel({ tips }: { tips: string[] }) {
  return (
    <section className="card-flat p-5">
      <Eyebrow>Local tips</Eyebrow>
      <ul className="mt-4 space-y-3">
        {tips.map((tip, i) => (
          <li key={`tip-${i}`} className="flex gap-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Inline SVG icons — no library dependency ───────────────────────────── */
function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M7.5 5.5L5 8C4.17 8.83 4.17 10.17 5 11C5.83 11.83 7.17 11.83 8 11L10 9C10.83 8.17 10.83 6.83 10 6"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M5.5 7.5L8 5C8.83 4.17 8.83 2.83 8 2C7.17 1.17 5.83 1.17 5 2L3 4C2.17 4.83 2.17 6.17 3 7"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 6.5L5.5 10L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
