import React, { useState, useRef } from "react";
import { downloadRagReport } from "../api/rag.api";
import { useTheme } from "../layout/MainLayout"; // adjust path as needed

export default function RagPage() {
  const { dark } = useTheme();

  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("aws");
  const [topK, setTopK] = useState(5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [deliberationLog, setDeliberationLog] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const abortControllerRef = useRef(null);

  // t(darkClass, lightClass) — inline theme helper
  const t = (d, l) => (dark ? d : l);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleAsk = async () => {
    if (!query.trim()) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError("");
    setResult(null);
    setDeliberationLog([]);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/rag/stream/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, provider, top_k: topK }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Failed to fetch");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: !done });
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          const data = JSON.parse(line);
          if (data.error) { setError(data.error); break; }

          if (data.phase === "Metadata") {
            setResult((prev) => ({ ...prev, sources: data.sources }));
          } else if (data.delta) {
            const isArbiter = data.phase === "Arbiter";
            setDeliberationLog((prev) => {
              const existingIdx = prev.findIndex((item) => item.phase === data.phase);
              if (existingIdx !== -1) {
                const newLog = [...prev];
                newLog[existingIdx] = { ...newLog[existingIdx], content: (newLog[existingIdx].content || "") + data.delta };
                return newLog;
              }
              return [...prev, { phase: data.phase, content: data.delta, status: "Thinking..." }];
            });
            if (isArbiter) {
              setResult((prev) => ({ ...(prev || {}), answer: (prev?.answer || "") + data.delta }));
            }
          } else if (data.phase === "Arbiter" && data.status === "Completed") {
            setResult((prev) => ({ ...prev, answer: data.content }));
          } else {
            setDeliberationLog((prev) => {
              const existing = prev.findIndex((item) => item.phase === data.phase);
              if (existing !== -1) {
                const newLog = [...prev];
                newLog[existing] = { ...newLog[existing], ...data };
                return newLog;
              }
              return [...prev, data];
            });
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Generation stopped by user.");
      } else {
        setError("Failed to fetch response from AI");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDownload = async () => {
    if (!result?.answer) { setError("First click Ask AI, then download the report."); return; }
    setDownloading(true);
    setError("");
    try {
      await downloadRagReport({
        title: "Cloud Security RAG Report",
        url: window.location.href,
        provider,
        query,
        answer: result.answer,
        sources: result.sources || [],
      });
    } catch (err) {
      setError("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const uniqueSources = result?.sources
    ? Array.from(new Map(result.sources.map((s) => [s.source, s])).values())
    : [];

  const isActivePhase = (log) =>
    ["Thinking...", "Drafting Response...", "Critiquing...", "Finalizing Outcome..."].includes(log.status);

  // Per-phase color maps (dot color always bright, text/bg/border adapt to theme)
  const phaseDot = { Analyst: "bg-cyan-400", Architect: "bg-purple-400", Reviewer: "bg-amber-400", Arbiter: "bg-emerald-400" };
  const phaseText = {
    Analyst: t("text-cyan-400", "text-cyan-600"),
    Architect: t("text-purple-400", "text-purple-600"),
    Reviewer: t("text-amber-400", "text-amber-600"),
    Arbiter: t("text-emerald-400", "text-emerald-600")
  };
  const phaseBg = {
    Analyst: t("bg-cyan-500/5", "bg-cyan-50"),
    Architect: t("bg-purple-500/5", "bg-purple-50"),
    Reviewer: t("bg-amber-500/5", "bg-amber-50"),
    Arbiter: t("bg-emerald-500/5", "bg-emerald-50")
  };
  const phaseBorder = {
    Analyst: t("border-cyan-500/30", "border-cyan-300"),
    Architect: t("border-purple-500/30", "border-purple-300"),
    Reviewer: t("border-amber-500/30", "border-amber-300"),
    Arbiter: t("border-emerald-500/30", "border-emerald-300")
  };

  // Shared card style
  const card = `rounded-2xl border overflow-hidden ${t("bg-gray-900 border-gray-800 shadow-xl", "bg-white border-gray-200 shadow-sm")}`;
  const cardHeader = `px-5 py-4 border-b flex items-center gap-2 ${t("border-gray-800 bg-gray-900", "border-gray-100 bg-gray-50")}`;
  const inputBase = `w-full p-4 rounded-xl text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all duration-200 font-medium border ${t("bg-gray-950 border-gray-700 text-gray-100 placeholder-gray-600 focus:border-indigo-500/50", "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400")}`;
  const selectBase = `text-sm font-semibold px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer ${t("bg-gray-950 border-gray-700 text-gray-200", "bg-white border-gray-200 text-gray-800")}`;
  const labelBase = `text-[10px] font-bold uppercase tracking-wider px-1 ${t("text-gray-500", "text-gray-400")}`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─── Main Content ─── */}
        <div className="lg:col-span-8 space-y-5">

          {/* Query Card */}
          <div className={card}>
            <div className={cardHeader}>
              <svg className={`w-4 h-4 ${t("text-indigo-400", "text-indigo-500")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              <span className={`text-xs font-semibold uppercase tracking-wider ${t("text-gray-400", "text-gray-500")}`}>Query Input</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Textarea */}
              <div className="relative">
                <textarea
                  className={inputBase}
                  rows={4}
                  placeholder="Ask a cloud security question... (Press Enter to submit, Shift+Enter for new line)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                {query.trim() && (
                  <div className={`absolute bottom-3 right-3 text-[10px] font-medium ${t("text-gray-600", "text-gray-400")}`}>
                    Enter ↵ to submit
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className={labelBase}>Platform</label>
                  <select className={selectBase} value={provider} onChange={(e) => setProvider(e.target.value)} disabled={loading}>
                    <option value="aws">☁️ AWS</option>
                    <option value="azure">🔷 Azure</option>
                    <option value="gcp">🌐 Google Cloud</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className={labelBase}>Context Depth</label>
                  <select className={selectBase} value={topK} onChange={(e) => setTopK(Number(e.target.value))} disabled={loading}>
                    {[3, 5, 7, 10].map((k) => (<option key={k} value={k}>Top {k} results</option>))}
                  </select>
                </div>

                <div className="flex-1" />

                {/* Download */}
                <button
                  onClick={handleDownload}
                  disabled={!result?.answer || downloading}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${t("bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700", "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200")}`}
                >
                  {downloading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Exporting...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Download Report</>
                  )}
                </button>

                {/* Ask AI / Stop button */}
                {loading ? (
                  <button
                    onClick={handleStop}
                    className={`flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md ${t("shadow-red-900/40", "shadow-red-200")}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                    Stop Deliberating
                  </button>
                ) : (
                  <button
                    onClick={handleAsk}
                    disabled={!query.trim()}
                    className={`flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md ${t("shadow-indigo-900/40", "shadow-indigo-200")}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Ask AI Advisor
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${t("bg-red-950/50 border-red-800/60 text-red-300", "bg-red-50 border-red-200 text-red-700")}`}>
              <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${t("text-red-400", "text-red-500")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Skeleton */}
          {loading && !result?.answer && (
            <div className={card}>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${t("text-indigo-400", "text-indigo-500")}`}>Synthesizing Intelligence...</span>
                </div>
                {[100, 83, 67, 100, 75].map((w, i) => (
                  <div key={i} className={`h-3 rounded-full animate-pulse ${t("bg-gray-800", "bg-gray-100")}`} style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Answer */}
          {result?.answer && (
            <div className="space-y-5">
              <div className={card}>
                <div className={`px-5 py-3.5 border-b flex items-center justify-between ${t("border-gray-800 bg-emerald-950/30", "border-gray-100 bg-emerald-50")}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shadow-lg ${t("bg-emerald-400 shadow-emerald-500/50", "bg-emerald-500 shadow-emerald-300")}`}></div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${t("text-emerald-400", "text-emerald-700")}`}>Synthesized Intelligence</span>
                  </div>
                  <span className={`text-[10px] font-medium ${t("text-gray-500", "text-gray-400")}`}>{provider.toUpperCase()} · Top {topK}</span>
                </div>
                <div className="p-6">
                  <p className={`whitespace-pre-wrap leading-relaxed text-sm font-medium ${t("text-gray-200", "text-gray-800")}`}>{result.answer}</p>
                </div>
              </div>

              {/* Sources */}
              {uniqueSources.length > 0 && (
                <div className={card}>
                  <div className={cardHeader}>
                    <svg className={`w-3.5 h-3.5 ${t("text-gray-500", "text-gray-400")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <span className={`text-xs font-bold uppercase tracking-wider ${t("text-gray-500", "text-gray-400")}`}>Knowledge Base Sources</span>
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${t("bg-gray-800 text-gray-400", "bg-gray-100 text-gray-500")}`}>{uniqueSources.length}</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {uniqueSources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.source}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group ${t("bg-gray-800/60 hover:bg-gray-800 border-gray-700/50 hover:border-indigo-500/40", "bg-gray-50 hover:bg-indigo-50 border-gray-200 hover:border-indigo-300")}`}
                      >
                        <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-[11px] font-bold border transition-all ${t("bg-indigo-950 border-indigo-800/60 text-indigo-400 group-hover:border-indigo-500/60", "bg-indigo-50 border-indigo-200 text-indigo-600 group-hover:border-indigo-400")}`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold line-clamp-1 transition-colors ${t("text-gray-300 group-hover:text-white", "text-gray-700 group-hover:text-indigo-700")}`}>
                            {src.title || "External reference"}
                          </p>
                          <p className={`text-[10px] mt-0.5 truncate ${t("text-gray-600", "text-gray-400")}`}>{src.source}</p>
                        </div>
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${t("text-gray-600 group-hover:text-indigo-400", "text-gray-300 group-hover:text-indigo-500")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Sidebar: Agent Feed ─── */}
        <div className="lg:col-span-4">
          <div className="sticky top-[69px]">
            <div className={card}>

              {/* Feed Header */}
              <div className={`px-5 py-4 border-b flex items-center justify-between ${t("border-gray-800 bg-gray-900", "border-gray-100 bg-gray-50")}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${loading ? "bg-indigo-500 animate-ping" : deliberationLog.length > 0 ? "bg-emerald-500" : t("bg-gray-700", "bg-gray-300")}`}></div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${t("text-gray-400", "text-gray-500")}`}>Agent Protocol Feed</span>
                </div>
                <div className="flex items-center gap-3">
                  {loading && <span className={`text-[10px] font-bold animate-pulse uppercase tracking-widest ${t("text-indigo-400", "text-indigo-500")}`}>Live</span>}
                  {!loading && deliberationLog.length > 0 && <span className={`text-[10px] font-bold uppercase tracking-widest ${t("text-emerald-500", "text-emerald-600")}`}>Complete</span>}
                  <button
                    onClick={() => setIsFullScreen(true)}
                    className={`p-1.5 rounded-lg transition-colors ${t("hover:bg-gray-800 text-gray-400 hover:text-gray-200", "hover:bg-gray-100 text-gray-400 hover:text-gray-600")}`}
                    title="Expand to Full Screen"
                    aria-label="Expand to Full Screen"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Feed Body */}
              <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto space-y-3">

                {/* Empty state */}
                {deliberationLog.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${t("bg-gray-800 border-gray-700", "bg-gray-100 border-gray-200")}`}>
                      <svg className={`w-5 h-5 ${t("text-gray-600", "text-gray-400")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                      </svg>
                    </div>
                    <p className={`text-xs font-semibold ${t("text-gray-600", "text-gray-500")}`}>Agents standing by</p>
                    <p className={`text-[10px] mt-1.5 leading-relaxed ${t("text-gray-700", "text-gray-400")}`}>Submit a query to begin<br />the deliberation process</p>
                  </div>
                )}

                {/* Log items */}
                {deliberationLog.map((log, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border overflow-hidden transition-all duration-500 ${isActivePhase(log)
                      ? `${phaseBg[log.phase] || t("bg-indigo-500/5", "bg-indigo-50")} ${phaseBorder[log.phase] || t("border-indigo-500/30", "border-indigo-300")}`
                      : t("bg-gray-800/50 border-gray-700/60", "bg-gray-50 border-gray-200")
                      }`}
                  >
                    {/* Phase header */}
                    <div className={`px-3.5 py-2.5 flex items-center gap-2 border-b ${t("border-white/5", "border-black/5")}`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${phaseDot[log.phase] || "bg-indigo-400"} ${isActivePhase(log) ? "animate-pulse" : ""}`}></div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${phaseText[log.phase] || t("text-indigo-400", "text-indigo-600")}`}>{log.phase}</span>
                      {log.status && (
                        <span className={`ml-auto text-[9px] font-semibold ${isActivePhase(log) ? `animate-pulse ${t("text-gray-400", "text-gray-500")}` : t("text-gray-600", "text-gray-400")}`}>
                          {log.status}
                        </span>
                      )}
                    </div>

                    {/* Phase content */}
                    <div className="px-3.5 py-3">
                      {log.content ? (
                        <p className={`text-[11px] font-mono leading-relaxed line-clamp-6 ${t("text-gray-400", "text-gray-600")}`}>{log.content}</p>
                      ) : (
                        <div className="flex gap-1.5 items-center py-2">
                          <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${t("bg-indigo-500", "bg-indigo-400")}`}></div>
                          <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${t("bg-indigo-500", "bg-indigo-400")}`}></div>
                          <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${t("bg-indigo-500", "bg-indigo-400")}`}></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading placeholders */}
                {loading && deliberationLog.length === 0 && (
                  <div className="space-y-3">
                    {["Analyst", "Architect", "Reviewer"].map((phase) => (
                      <div key={phase} className={`rounded-xl border overflow-hidden ${t("border-gray-700/60 bg-gray-800/30", "border-gray-200 bg-gray-50")}`}>
                        <div className={`px-3.5 py-2.5 border-b flex items-center gap-2 ${t("border-white/5", "border-black/5")}`}>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${t("bg-gray-700", "bg-gray-300")}`}></div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${t("text-gray-700", "text-gray-400")}`}>{phase}</span>
                        </div>
                        <div className="px-3.5 py-3 space-y-1.5">
                          <div className={`h-2 rounded animate-pulse w-full ${t("bg-gray-800", "bg-gray-200")}`}></div>
                          <div className={`h-2 rounded animate-pulse w-3/4 ${t("bg-gray-800", "bg-gray-200")}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feed footer */}
              <div className={`px-4 py-3 border-t flex items-center justify-between ${t("border-gray-800 bg-gray-950/50", "border-gray-100 bg-gray-50")}`}>
                <p className={`text-[9px] font-semibold uppercase tracking-wider ${t("text-gray-600", "text-gray-400")}`}>Multi-Agent Synthesis Engine v3.1</p>
                <span className={`text-[9px] font-medium ${t("text-gray-700", "text-gray-400")}`}>Cross-peer validated</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Full Screen Overlay ─── */}
      {isFullScreen && (
        <div className={`fixed inset-0 z-50 flex flex-col ${t("bg-gray-950", "bg-slate-50")}`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${t("border-gray-800 bg-gray-900", "border-gray-200 bg-white shadow-sm")}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${t("bg-gray-800", "bg-indigo-50")}`}>
                <svg className={`w-5 h-5 ${t("text-indigo-400", "text-indigo-600")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-lg font-bold tracking-tight ${t("text-white", "text-gray-900")}`}>Security Council Deliberation</h2>
                <p className={`text-xs font-medium ${t("text-gray-400", "text-gray-500")}`}>Detailed Protocol Transcript</p>
              </div>
            </div>
            <button
              onClick={() => setIsFullScreen(false)}
              className={`p-2 rounded-lg transition-colors ${t("hover:bg-gray-800 text-gray-400 hover:text-gray-200", "hover:bg-gray-100 text-gray-500 hover:text-gray-900")}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6">
            <div className="max-w-5xl mx-auto space-y-6">
              {deliberationLog.length === 0 ? (
                <div className="text-center py-20">
                  <p className={`text-sm ${t("text-gray-500", "text-gray-400")}`}>No details available yet.</p>
                </div>
              ) : (
                deliberationLog.map((log, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border overflow-hidden ${t("border-gray-800 bg-gray-900/50", "border-gray-200 bg-white")}`}
                  >
                    <div className={`px-6 py-4 border-b flex items-center justify-between ${t("border-gray-800", "border-gray-100")}`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${phaseBg[log.phase]} ${phaseBorder[log.phase]} ${phaseText[log.phase]}`}>
                          {log.phase}
                        </span>
                        {log.status && (
                          <span className={`text-xs font-medium ${t("text-gray-500", "text-gray-400")}`}>
                            {log.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className={`font-mono text-sm leading-relaxed whitespace-pre-wrap ${t("text-gray-300", "text-gray-700")}`}>
                        {log.content || <span className="italic opacity-50">Thinking...</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}