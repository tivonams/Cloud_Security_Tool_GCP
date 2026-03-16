import { NavLink, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import api from "../api/axios";

import RagPage from "../pages/RagPage";
import PolicyPage from "../pages/PolicyPage";
import KnowledgeBasePage from "../pages/KnowledgeBasePage";
import DashboardPage from "../pages/DashboardPage";

// ─── Theme Context ─────────────────────────────────────────────────────────────
export const ThemeContext = createContext({ dark: true, toggle: () => { } });
export const useTheme = () => useContext(ThemeContext);

// ─── Nav Items ─────────────────────────────────────────────────────────────────
const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    to: "rag",
    label: "RAG Assistant",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    badge: "AI",
  },
  {
    to: "/knowledge-base",
    label: "Knowledge Base",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.128 16.556 17.975 12 17.975s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75" />
      </svg>
    ),
  },
  {
    to: "/policies",
    label: "Policy Analyzer",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

// ─── Theme Toggle ──────────────────────────────────────────────────────────────
function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${dark ? "bg-indigo-600 focus:ring-offset-gray-900" : "bg-gray-300 focus:ring-offset-white"
        }`}
      aria-label="Toggle theme"
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${dark ? "translate-x-5" : "translate-x-0"
          }`}
      >
        {dark ? (
          <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.752 15.002A9.718 9.718 0 0118 15.75 9.75 9.75 0 018.25 6a9.72 9.72 0 01.75-3.752A9.753 9.753 0 003 11.25 9.75 9.75 0 0012.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
        )}
      </span>
    </button>
  );
}

// ─── Main Layout ───────────────────────────────────────────────────────────────
export default function MainLayout() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("cloudsec-theme");
    return saved ? saved === "dark" : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOperational, setIsOperational] = useState(true);

  const location = useLocation();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get("health/");
        setIsOperational(response.data.status === "ok");
      } catch (error) {
        setIsOperational(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("cloudsec-theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => setDark((d) => !d);

  // t(darkClass, lightClass) — picks the right class based on theme
  const t = (d, l) => (dark ? d : l);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <div className={`min-h-screen flex transition-colors duration-300 ${t("bg-gray-950 text-gray-100", "bg-slate-50 text-gray-900")}`}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${t("bg-gray-900 border-r border-gray-800", "bg-white border-r border-gray-200 shadow-sm")}`}>

          {/* Logo */}
          <div className={`px-5 py-5 border-b ${t("border-gray-800", "border-gray-100")}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${t("shadow-indigo-900/40", "shadow-indigo-200")}`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className={`text-sm font-black tracking-tight ${t("text-white", "text-gray-900")}`}>CloudSec AI</h2>
                <p className={`text-[10px] font-medium leading-tight mt-0.5 italic ${t("text-gray-500", "text-gray-400")}`}>
                  One Security Tool for Every Cloud
                </p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className={`text-[9px] font-black uppercase tracking-[0.18em] px-3 mb-3 ${t("text-gray-600", "text-gray-400")}`}>
              Navigation
            </p>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group border ${isActive
                    ? dark
                      ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : dark
                      ? "text-gray-400 hover:text-gray-100 hover:bg-gray-800 border-transparent"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={
                      isActive
                        ? t("text-indigo-400", "text-indigo-600")
                        : t("text-gray-600 group-hover:text-gray-300", "text-gray-400 group-hover:text-gray-600")
                    }>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${isActive
                        ? t("bg-indigo-500/30 text-indigo-300", "bg-indigo-100 text-indigo-600")
                        : t("bg-gray-700 text-gray-500", "bg-gray-100 text-gray-400")
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className={`px-4 py-4 border-t ${t("border-gray-800", "border-gray-100")}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${t("text-gray-500", "text-gray-400")}`}>
                {dark ? "Dark Mode" : "Light Mode"}
              </span>
              <ThemeToggle dark={dark} onToggle={toggle} />
            </div>
            <div className={`mt-3 flex items-center gap-2 px-2.5 py-2 rounded-lg ${t("bg-gray-800/60", "bg-gray-50 border border-gray-100")}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
              <span className={`text-[9px] font-bold uppercase tracking-wide ${t("text-gray-500", "text-gray-400")}`}>
                Multi-Agent Engine v3.1
              </span>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top Bar */}
          <header className={`sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b backdrop-blur-md ${t("bg-gray-950/80 border-gray-800", "bg-white/80 border-gray-200 shadow-sm")}`}>

            {/* Mobile hamburger */}
            <button
              className={`lg:hidden p-1.5 rounded-lg transition-colors ${t("text-gray-400 hover:bg-gray-800 hover:text-gray-100", "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}`}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2">
              <span className={`text-xs font-medium ${t("text-gray-600", "text-gray-400")}`}>CloudSec AI</span>
              <svg className={`w-3.5 h-3.5 ${t("text-gray-700", "text-gray-300")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className={`text-xs font-semibold ${t("text-gray-300", "text-gray-700")}`}>Security Console</span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden lg:flex items-center gap-2">
                <span className={`text-[10px] font-semibold ${t("text-gray-600", "text-gray-400")}`}>
                  {dark ? "Dark" : "Light"}
                </span>
                <ThemeToggle dark={dark} onToggle={toggle} />
              </div>
              <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full border ${isOperational
                ? t("bg-emerald-950/60 border-emerald-800/50 text-emerald-400", "bg-emerald-50 border-emerald-200 text-emerald-700")
                : t("bg-red-950/60 border-red-800/50 text-red-400", "bg-red-50 border-red-200 text-red-700")
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOperational ? "bg-emerald-400" : "bg-red-400"}`}></span>
                {isOperational ? "Systems Operational" : "System Error"}
              </span>
            </div>
          </header>

          {/* Page Content */}
          <main className={`flex-1 relative overflow-hidden ${t("bg-gray-950", "bg-slate-50")}`}>
            <div className="absolute inset-0 overflow-y-auto flex-col" style={{ display: location.pathname.includes('/dashboard') ? 'flex' : 'none' }}>
              <DashboardPage />
            </div>
            <div className="absolute inset-0 overflow-y-auto flex-col" style={{ display: location.pathname.includes('/rag') ? 'flex' : 'none' }}>
              <RagPage />
            </div>
            <div className="absolute inset-0 overflow-y-auto flex-col" style={{ display: location.pathname.includes('/policies') ? 'flex' : 'none' }}>
              <PolicyPage />
            </div>
            <div className="absolute inset-0 overflow-y-auto flex-col" style={{ display: location.pathname.includes('/knowledge-base') ? 'flex' : 'none' }}>
              <KnowledgeBasePage />
            </div>

            {/* Render nested routes (which handles <Navigate> for root /) */}
            <Outlet />
          </main>
        </div>

      </div>
    </ThemeContext.Provider>
  );
}