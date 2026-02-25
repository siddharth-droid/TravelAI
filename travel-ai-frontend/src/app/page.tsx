"use client";

import { useState } from "react";

interface Highlight {
  icon: string;
  title: string;
  description: string;
}

interface TravelPlan {
  destination: string;
  summary: string;
  best_time_to_visit: string;
  highlights: Highlight[];
  practical_tips: {
    transport: string;
    stay: string;
    budget_estimate: string;
  };
  hidden_gem: {
    title: string;
    description: string;
  };
  vibe_tags: string[];
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setPlan(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        throw new Error("Failed to get travel plan");
      }

      const data: TravelPlan = await res.json();
      setPlan(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white font-sans relative overflow-x-hidden">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
            TravelAI
          </h1>
          <p className="text-gray-400 mt-3 text-lg">Your AI-powered travel planner</p>
        </header>

        {/* Search */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-16">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where do you want to go? Ask anything..."
              className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-lg focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Planning..." : "Explore"}
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
            </div>
            <p className="text-gray-400 text-lg animate-pulse">Crafting your perfect trip...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto text-center py-8">
            <p className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-6 py-4">{error}</p>
          </div>
        )}

        {/* Results */}
        {plan && (
          <div className="space-y-8 animate-fade-in">
            {/* Destination & Summary */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {plan.destination}
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                {plan.summary}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
                <span>🗓️</span>
                <span>{plan.best_time_to_visit}</span>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent" />
                Must-Do Experiences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plan.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
                  >
                    <span className="text-3xl mb-3 block">{h.icon}</span>
                    <h4 className="font-semibold text-white mb-2">{h.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{h.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Tips */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent" />
                Practical Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Getting Around", icon: "🚗", value: plan.practical_tips.transport },
                  { label: "Where to Stay", icon: "🏨", value: plan.practical_tips.stay },
                  { label: "Budget Estimate", icon: "💰", value: plan.practical_tips.budget_estimate },
                ].map((tip, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{tip.icon}</span>
                      <h4 className="font-semibold text-white text-sm uppercase tracking-wider">{tip.label}</h4>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{tip.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden Gem */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gradient-to-r from-amber-500 to-transparent" />
                Hidden Gem
              </h3>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] border border-amber-500/[0.15]">
                <h4 className="font-semibold text-amber-300 text-lg mb-2 flex items-center gap-2">
                  <span>💎</span>
                  {plan.hidden_gem.title}
                </h4>
                <p className="text-gray-300 leading-relaxed">{plan.hidden_gem.description}</p>
              </div>
            </div>

            {/* Vibe Tags */}
            <div className="flex flex-wrap gap-2 justify-center pt-4">
              {plan.vibe_tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-cyan-300 text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
