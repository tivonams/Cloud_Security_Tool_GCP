// src/pages/PolicyPage.jsx
import { useState } from "react";
import { analyzePolicy } from "../api/policy.api";
import { useTheme } from "../layout/MainLayout";

export default function PolicyPage() {
  const { dark } = useTheme();
  const [policyText, setPolicyText] = useState(
    JSON.stringify(
      {
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }],
      },
      null,
      2
    )
  );
  const [provider, setProvider] = useState("aws");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = (d, l) => (dark ? d : l);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);
      const parsedPolicy = JSON.parse(policyText);
      const res = await analyzePolicy({ policy: parsedPolicy, provider });
      setResult(res);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON — please check your policy syntax");
      } else {
        setError("Policy analysis failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const card = `rounded-2xl border ${t("bg-gray-900 border-gray-800", "bg-white border-gray-200 shadow-sm")}`;
  const cardHeader = `px-4 py-3 border-b flex items-center gap-2 ${t("border-gray-800 bg-gray-900", "border-gray-100 bg-gray-50")}`;

  const riskConfig = {
    CRITICAL: {
      badge: t("bg-red-900/60 text-red-300 border-red-700/60", "bg-red-100 text-red-700 border-red-200"),
      border: t("border-red-700/50", "border-red-200"),
      bg: t("bg-red-900/20", "bg-red-50"),
      dot: "bg-red-500",
    },
    HIGH: {
      badge: t("bg-orange-900/60 text-orange-300 border-orange-700/60", "bg-orange-100 text-orange-700 border-orange-200"),
      border: t("border-orange-700/50", "border-orange-200"),
      bg: t("bg-orange-900/20", "bg-orange-50"),
      dot: "bg-orange-500",
    },
    MEDIUM: {
      badge: t("bg-yellow-900/60 text-yellow-300 border-yellow-700/60", "bg-yellow-100 text-yellow-700 border-yellow-200"),
      border: t("border-yellow-700/50", "border-yellow-200"),
      bg: t("bg-yellow-900/20", "bg-yellow-50"),
      dot: "bg-yellow-500",
    },
    LOW: {
      badge: t("bg-emerald-900/60 text-emerald-300 border-emerald-700/60", "bg-emerald-100 text-emerald-700 border-emerald-200"),
      border: t("border-emerald-700/50", "border-emerald-200"),
      bg: t("bg-emerald-900/20", "bg-emerald-50"),
      dot: "bg-emerald-500",
    },
  };

  const risk = result ? (riskConfig[result.risk_level] || riskConfig["LOW"]) : null;

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      if (line.trim().startsWith("###")) {
        const cleanText = line.replace(/^#+\s*/, "");
        return (
          <div key={i} className={`font-bold mt-3 mb-1 text-xs ${t("text-gray-200", "text-gray-800")}`}>
            {cleanText}
          </div>
        );
      }
      const boldParts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={i} className="block min-h-[1.1rem]">
          {boldParts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className={t("text-gray-300", "text-gray-700")}>{part.slice(2, -2)}</strong>
            ) : part
          )}
        </span>
      );
    });
  };

  return (
    // Fills whatever height MainLayout provides — no internal page scroll
    <div className={`flex flex-col h-full overflow-hidden ${t("bg-gray-950", "bg-gray-50")}`}>

      {/* ── Top bar ── */}
      <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${t("border-gray-800 bg-gray-950", "border-gray-200 bg-white")}`}>
        <div>
          <h1 className={`text-xl font-black tracking-tight ${t("text-white", "text-gray-900")}`}>Policy Analyzer</h1>
          <p className={`text-xs mt-0.5 ${t("text-gray-500", "text-gray-400")}`}>
            Paste an IAM policy to detect risks and get remediation suggestions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${t("text-gray-500", "text-gray-400")}`}>Provider</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={loading}
            className={`text-sm font-semibold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer ${t("bg-gray-900 border-gray-700 text-gray-200", "bg-white border-gray-200 text-gray-800")}`}
          >
            <option value="aws">☁️ AWS</option>
            <option value="azure">🔷 Azure</option>
            <option value="gcp">🌐 GCP</option>
          </select>
        </div>
      </div>

      {/* ── Two-column body — each side scrolls independently ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: fixed-width editor panel */}
        <div className={`w-[400px] flex-shrink-0 flex flex-col border-r ${t("border-gray-800", "border-gray-200")}`}>

          {/* Editor label */}
          <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b ${t("border-gray-800 bg-gray-900/60", "border-gray-100 bg-gray-50")}`}>
            <svg className={`w-3.5 h-3.5 ${t("text-indigo-400", "text-indigo-500")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${t("text-gray-400", "text-gray-500")}`}>Policy JSON</span>
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${t("bg-indigo-900/40 text-indigo-400 border-indigo-700/50", "bg-indigo-50 text-indigo-600 border-indigo-200")}`}>
              JSON
            </span>
          </div>

          {/* Textarea fills all remaining left-column space */}
          <div className="flex-1 min-h-0 p-4">
            <textarea
              className={`w-full h-full px-4 py-3 rounded-xl border text-sm font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all duration-200 ${t(
                "bg-gray-950 border-gray-700 text-gray-100 placeholder-gray-600 focus:border-indigo-500/50",
                "bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-400"
              )}`}
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              disabled={loading}
              spellCheck={false}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className={`flex-shrink-0 mx-4 mb-3 flex items-start gap-2 p-3 rounded-xl border text-xs ${t("bg-red-950/50 border-red-800/60 text-red-300", "bg-red-50 border-red-200 text-red-700")}`}>
              <svg className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${t("text-red-400", "text-red-500")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Analyze button — always pinned at bottom */}
          <div className={`flex-shrink-0 p-4 border-t ${t("border-gray-800 bg-gray-900/40", "border-gray-100 bg-gray-50")}`}>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-900/30"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing Policy...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Analyze Policy
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: scrollable results panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4 max-w-3xl mx-auto">

            {/* Loading skeleton */}
            {loading && (
              <div className={`${card} p-5 space-y-3`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${t("text-indigo-400", "text-indigo-500")}`}>
                    Running analysis...
                  </span>
                </div>
                {[100, 75, 90, 60, 80, 45, 85, 35].map((w, i) => (
                  <div
                    key={i}
                    className={`h-3 rounded-full animate-pulse ${t("bg-gray-800", "bg-gray-100")}`}
                    style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && (
              <div className={`${card} flex flex-col items-center justify-center py-24 px-8 text-center`}>
                <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-5 ${t("bg-gray-800 border-gray-700", "bg-gray-100 border-gray-200")}`}>
                  <svg className={`w-8 h-8 ${t("text-gray-600", "text-gray-400")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <p className={`text-sm font-semibold ${t("text-gray-400", "text-gray-500")}`}>No analysis yet</p>
                <p className={`text-xs mt-2 leading-relaxed max-w-xs ${t("text-gray-600", "text-gray-400")}`}>
                  Paste your IAM policy on the left and click{" "}
                  <span className="font-semibold text-indigo-400">Analyze Policy</span>{" "}
                  to see findings, risk level, and remediation suggestions.
                </p>
              </div>
            )}

            {result && (
              <>
                {/* Risk Level Banner */}
                <div className={`rounded-2xl border p-4 flex items-center gap-4 ${risk.bg} ${risk.border}`}>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${risk.dot} shadow-lg`}></div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${t("text-gray-500", "text-gray-400")}`}>
                      Overall Risk Level
                    </p>
                    <p className={`text-lg font-black tracking-tight mt-0.5 ${t("text-white", "text-gray-900")}`}>
                      {result.risk_level}
                    </p>
                  </div>
                  <span className={`text-xs font-black px-3 py-1.5 rounded-xl border ${risk.badge}`}>
                    {result.findings?.length || 0} finding{result.findings?.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Findings */}
                {result.findings?.length > 0 && (
                  <div className={card}>
                    <div className={cardHeader}>
                      <svg className={`w-3.5 h-3.5 ${t("text-amber-400", "text-amber-500")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${t("text-gray-400", "text-gray-500")}`}>Findings</span>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${t("bg-gray-800 text-gray-400", "bg-gray-100 text-gray-500")}`}>
                        {result.findings.length}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      {result.findings.map((f, idx) => {
                        const fRisk = riskConfig[f.severity] || riskConfig["LOW"];
                        return (
                          <div key={idx} className={`rounded-xl border overflow-hidden ${t("border-gray-700/60", "border-gray-200")}`}>
                            <div className={`px-4 py-3 flex items-center justify-between gap-3 ${t("bg-gray-800/60", "bg-gray-50")}`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${fRisk.dot}`}></div>
                                <h3 className={`text-sm font-bold truncate ${t("text-gray-100", "text-gray-800")}`}>{f.issue}</h3>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex-shrink-0 ${fRisk.badge}`}>
                                {f.severity}
                              </span>
                            </div>
                            <div className="px-4 py-3 space-y-3">
                              <div className={`text-xs leading-relaxed ${t("text-gray-400", "text-gray-600")}`}>
                                {renderMarkdown(f.explanation)}
                              </div>
                              {f.sources?.length > 0 && (
                                <div className={`pt-3 border-t space-y-1.5 ${t("border-gray-700/60", "border-gray-100")}`}>
                                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${t("text-gray-600", "text-gray-400")}`}>References</p>
                                  {[...new Map(f.sources.map((s) => [s.source, s])).values()].map((s, i) => (
                                    <a
                                      key={i}
                                      href={s.source}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${t("text-indigo-400 hover:text-indigo-300", "text-indigo-600 hover:text-indigo-700")}`}
                                    >
                                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                      </svg>
                                      {s.title}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Suggested Policy */}
                {result.suggested_policy && (
                  <div className={card}>
                    <div className={cardHeader}>
                      <svg className={`w-3.5 h-3.5 ${t("text-emerald-400", "text-emerald-500")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${t("text-gray-400", "text-gray-500")}`}>Suggested Policy</span>
                    </div>
                    <div className="p-4">
                      <pre className="text-xs font-mono leading-relaxed rounded-xl p-4 overflow-auto max-h-72 bg-gray-950 text-emerald-300 border border-gray-800">
                        {JSON.stringify(result.suggested_policy, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Policy Diff */}
                {result.policy_diff && (
                  <div className={card}>
                    <div className={cardHeader}>
                      <svg className={`w-3.5 h-3.5 ${t("text-indigo-400", "text-indigo-500")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
                      </svg>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${t("text-gray-400", "text-gray-500")}`}>Policy Changes</span>
                    </div>
                    <div className="p-4">
                      <pre className={`text-xs font-mono leading-relaxed rounded-xl p-4 overflow-auto max-h-72 ${t("bg-gray-950 text-emerald-300 border border-gray-800", "bg-slate-50 text-emerald-700 border border-gray-200")}`}>
                        {JSON.stringify(result.policy_diff, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}