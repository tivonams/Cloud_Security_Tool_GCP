// src/pages/DashboardPage.jsx
import { Link } from "react-router-dom";
import { useTheme } from "../layout/MainLayout";

export default function DashboardPage() {
    const { dark } = useTheme();

    const t = (d, l) => (dark ? d : l);

    const tools = [
        {
            to: "/rag",
            label: "RAG Assistant",
            desc: "Ask AI questions about your cloud environment based on indexed documentation.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
            ),
            color: t("text-indigo-400 bg-indigo-900/30 ring-indigo-500/30", "text-indigo-600 bg-indigo-50 ring-indigo-200")
        },
        {
            to: "/knowledge-base",
            label: "Knowledge Base",
            desc: "Manage indexed files and cloud manuals powering the Assistant's retrieval engine.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.128 16.556 17.975 12 17.975s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75" />
                </svg>
            ),
            color: t("text-emerald-400 bg-emerald-900/30 ring-emerald-500/30", "text-emerald-600 bg-emerald-50 ring-emerald-200")
        },
        {
            to: "/policies",
            label: "Policy Analyzer",
            desc: "Scan JSON bucket or IAM policies for security vulnerabilities and compliance issues.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
            ),
            color: t("text-rose-400 bg-rose-900/30 ring-rose-500/30", "text-rose-600 bg-rose-50 ring-rose-200")
        }
    ];

    return (
        <div className={`min-h-full py-12 px-6 sm:px-12 lg:px-20 ${t("bg-gray-950", "bg-slate-50")}`}>
            <div className="max-w-5xl mx-auto">
                {/* Banner */}
                <div className="mb-14 text-center sm:text-left">
                    <h1 className={`text-4xl sm:text-5xl font-black tracking-tight mb-4 ${t("text-white", "text-gray-900")}`}>
                        Welcome to <span className="text-indigo-500">CloudSec AI</span>
                    </h1>
                    <p className={`text-lg max-w-2xl ${t("text-gray-400", "text-gray-600")}`}>
                        The ultimate unified platform to build, scan, and query across all major cloud providers. Choose a tool below to get started.
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool, idx) => (
                        <Link
                            key={idx}
                            to={tool.to}
                            className={`group flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${t(
                                "bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-indigo-500/10",
                                "bg-white border-gray-200 hover:border-indigo-100 hover:shadow-indigo-500/10"
                            )}`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ring-1 ${tool.color}`}>
                                {tool.icon}
                            </div>
                            <h2 className={`text-xl font-bold mb-2 ${t("text-gray-100 group-hover:text-indigo-400", "text-gray-900 group-hover:text-indigo-600 transition-colors")}`}>
                                {tool.label}
                            </h2>
                            <p className={`text-sm leading-relaxed ${t("text-gray-500", "text-gray-600")}`}>
                                {tool.desc}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
