"use client";

import { useState } from "react";

interface Highlight {
  icon: string;
  title: string;
  description: string;
}

interface DayPlan {
  day: string;
  theme: string;
  activities: string;
}

interface HiddenGem {
  icon: string;
  title: string;
  description: string;
}

interface TravelPlan {
  destination: string;
  tagline: string;
  overview: string;
  best_time_to_visit: {
    months: string;
    why: string;
  };
  highlights: Highlight[];
  itinerary_suggestion: {
    duration: string;
    days: DayPlan[];
  };
  practical_tips: {
    getting_there: string;
    local_transport: string;
    where_to_stay: string;
    budget_estimate: {
      budget: string;
      mid_range: string;
      luxury: string;
    };
    food_scene: string;
  };
  hidden_gems: HiddenGem[];
  local_tips: string[];
  vibe_tags: string[];
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawData, setRawData] = useState<object | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setPlan(null);
    setRawData(null);
    setShowRaw(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error("Failed to get travel plan");

      const raw = await res.json();
      setRawData(raw);
      const data: TravelPlan = {
        destination: raw.destination || "",
        tagline: raw.tagline || "",
        overview: raw.overview || raw.summary || "",
        best_time_to_visit: raw.best_time_to_visit || { months: "", why: "" },
        highlights: raw.highlights || [],
        itinerary_suggestion: raw.itinerary_suggestion || { duration: "", days: [] },
        practical_tips: {
          getting_there: raw.practical_tips?.getting_there || raw.practical_tips?.transport || "",
          local_transport: raw.practical_tips?.local_transport || "",
          where_to_stay: raw.practical_tips?.where_to_stay || raw.practical_tips?.stay || "",
          budget_estimate: raw.practical_tips?.budget_estimate || { budget: "", mid_range: "", luxury: "" },
          food_scene: raw.practical_tips?.food_scene || "",
        },
        hidden_gems: raw.hidden_gems || (raw.hidden_gem ? [raw.hidden_gem] : []),
        local_tips: raw.local_tips || [],
        vibe_tags: raw.vibe_tags || [],
      };
      setPlan(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 font-sans relative overflow-x-hidden bg-white">
      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-orange-200/40 blur-[100px] animate-blob-1" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-sky-200/40 blur-[100px] animate-blob-2" />
        <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] rounded-full bg-rose-100/30 blur-[100px] animate-blob-3" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <header className={`text-center transition-all duration-700 ${plan ? "pt-10 pb-6" : "pt-32 pb-16"}`}>
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">✈️</span>
            <h1 className={`font-bold tracking-tight bg-gradient-to-r from-orange-500 via-rose-500 to-purple-500 bg-clip-text text-transparent transition-all duration-700 ${plan ? "text-3xl" : "text-6xl"}`}>
              TravelAI
            </h1>
          </div>
          {!plan && (
            <p className="text-gray-500 mt-2 text-xl max-w-lg mx-auto leading-relaxed">
              Discover destinations like never before. AI-crafted travel guides with local secrets.
            </p>
          )}
        </header>

        {/* Search */}
        <form onSubmit={handleSubmit} className={`max-w-2xl mx-auto transition-all duration-700 ${plan ? "mb-10" : "mb-20"}`}>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400/30 via-rose-400/30 to-purple-400/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center bg-white border border-gray-200 rounded-2xl shadow-sm group-focus-within:shadow-lg group-focus-within:border-gray-300 transition-all">
              <span className="pl-5 text-xl opacity-40">🌍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Where do you want to go? Ask anything..."
                className="flex-1 px-4 py-4.5 bg-transparent text-gray-900 placeholder-gray-400 text-lg focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="mr-2 px-7 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 rounded-xl font-semibold text-sm text-white hover:from-orange-600 hover:to-rose-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
              >
                {loading ? "Planning..." : "Explore ✨"}
              </button>
            </div>
          </div>
        </form>

        {/* Suggestions */}
        {!plan && !loading && !error && (
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
            {["Weekend in Goa 🏖️", "7 days in Japan 🗾", "Backpacking Vietnam 🎒", "Romantic Paris trip 🗼", "Adventure in Ladakh 🏔️"].map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-500 text-sm hover:bg-gray-100 hover:text-gray-700 transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-6 py-24">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-orange-200" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-500 animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">✈️</span>
            </div>
            <div className="text-center">
              <p className="text-gray-700 text-xl font-medium">Crafting your perfect trip...</p>
              <p className="text-gray-400 mt-2 text-sm">Our AI is exploring the best experiences for you</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto text-center py-8">
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-6 py-4">{error}</p>
          </div>
        )}

        {/* Results */}
        {plan && (
          <div className="space-y-10 pb-20 animate-fade-in">

            {/* Hero Overview */}
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-rose-50/50 to-purple-50" />
              <div className="absolute inset-0 border border-gray-200/80 rounded-3xl" />
              <div className="relative p-8 md:p-12">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {plan.vibe_tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-white/80 border border-gray-200 text-orange-600 text-xs font-medium shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                  {plan.destination}
                </h2>
                <p className="text-lg text-orange-600/80 italic mb-6">{plan.tagline}</p>
                <p className="text-gray-600 text-lg leading-relaxed max-w-4xl">
                  {plan.overview}
                </p>
                <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 border border-gray-200 shadow-sm">
                  <span className="text-lg">🗓️</span>
                  <div>
                    <span className="text-orange-600 font-semibold">{plan.best_time_to_visit.months}</span>
                    <span className="text-gray-500 ml-2 text-sm">— {plan.best_time_to_visit.why}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-1 rounded-full bg-gradient-to-r from-orange-500 to-rose-500" />
                Must-Do Experiences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {plan.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300"
                  >
                    <span className="text-4xl mb-4 block">{h.icon}</span>
                    <h4 className="font-bold text-gray-900 text-lg mb-2">{h.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{h.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Itinerary */}
            {plan.itinerary_suggestion.days.length > 0 && (
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <span className="w-10 h-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" />
                Suggested Itinerary
              </h3>
              {plan.itinerary_suggestion.duration && (
                <p className="text-gray-400 mb-6 ml-[52px]">Recommended: {plan.itinerary_suggestion.duration}</p>
              )}
              <div className="space-y-4 ml-4">
                {plan.itinerary_suggestion.days.map((day, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
                        {i + 1}
                      </div>
                      {i < plan.itinerary_suggestion.days.length - 1 && (
                        <div className="w-px flex-1 bg-gradient-to-b from-teal-200 to-transparent mt-2" />
                      )}
                    </div>
                    <div className="pb-6">
                      <h4 className="font-semibold text-gray-900">{day.day} — <span className="text-teal-600">{day.theme}</span></h4>
                      <p className="text-gray-500 text-sm leading-relaxed mt-1">{day.activities}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            )}

            {/* Practical Info */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                Practical Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">✈️</span>
                    <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Getting There</h4>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{plan.practical_tips.getting_there}</p>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🛺</span>
                    <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Local Transport</h4>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{plan.practical_tips.local_transport}</p>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🏨</span>
                    <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Where to Stay</h4>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{plan.practical_tips.where_to_stay}</p>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🍜</span>
                    <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Food Scene</h4>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{plan.practical_tips.food_scene}</p>
                </div>
              </div>

              {/* Budget */}
              <div className="mt-5 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💰</span>
                  <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Budget Breakdown</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Budget", emoji: "🎒", value: plan.practical_tips.budget_estimate.budget, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
                    { label: "Mid-Range", emoji: "🧳", value: plan.practical_tips.budget_estimate.mid_range, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                    { label: "Luxury", emoji: "👑", value: plan.practical_tips.budget_estimate.luxury, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                  ].map((tier, i) => (
                    <div key={i} className={`p-4 rounded-xl ${tier.bg} border ${tier.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span>{tier.emoji}</span>
                        <span className={`font-bold text-sm ${tier.color}`}>{tier.label}</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{tier.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Hidden Gems */}
            {plan.hidden_gems.length > 0 && (
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
                Hidden Gems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {plan.hidden_gems.map((gem, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 hover:shadow-md transition-all"
                  >
                    <span className="text-3xl mb-3 block">{gem.icon}</span>
                    <h4 className="font-bold text-amber-700 text-lg mb-2">{gem.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{gem.description}</p>
                  </div>
                ))}
              </div>
            </section>
            )}

            {/* Local Tips */}
            {plan.local_tips.length > 0 && (
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-1 rounded-full bg-gradient-to-r from-rose-400 to-pink-400" />
                Local Tips & Pro Advice
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.local_tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <span className="text-rose-500 mt-0.5 shrink-0">💡</span>
                    <p className="text-gray-600 text-sm leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </section>
            )}

            {/* Raw JSON */}
            {rawData && (
            <section>
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <span className={`transition-transform duration-200 ${showRaw ? "rotate-90" : ""}`}>▶</span>
                <span>🧑‍💻</span>
                <span>{showRaw ? "Hide" : "Show"} Raw API Response</span>
              </button>
              {showRaw && (
                <div className="mt-3 p-5 rounded-2xl bg-gray-50 border border-gray-200 overflow-x-auto">
                  <pre className="text-xs text-gray-600 leading-relaxed font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                </div>
              )}
            </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
