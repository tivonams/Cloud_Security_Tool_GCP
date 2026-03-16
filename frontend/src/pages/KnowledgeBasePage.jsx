import { useState, useEffect } from "react";
import { getDocuments, deleteDocument } from "../api/document.api";
import { ingestDocument } from "../api/ingest.api";
import { useTheme } from "../layout/MainLayout";

export default function KnowledgeBasePage() {
    const { dark } = useTheme();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Interaction states for adding new doc
    const [isAddingTo, setIsAddingTo] = useState(null); // 'aws', 'gcp', 'azure', 'general'
    const [newDoc, setNewDoc] = useState({ title: "", url: "", version: "" });
    const [ingesting, setIngesting] = useState(false);
    const [ingestStatus, setIngestStatus] = useState({ message: "", error: "" });

    const t = (d, l) => (dark ? d : l);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            setLoading(true);
            const data = await getDocuments();
            setDocuments(data);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch documents");
        } finally {
            setLoading(false);
        }
    };

    const handleIngest = async (e, provider) => {
        e.preventDefault();
        if (!newDoc.title || !newDoc.url) {
            setIngestStatus({ message: "", error: "Title and URL are required" });
            return;
        }

        try {
            setIngesting(true);
            setIngestStatus({ message: "", error: "" });
            const res = await ingestDocument({ ...newDoc, provider });
            setIngestStatus({ message: res.message || "Document queued for ingestion", error: "" });

            // Cleanup after success
            setTimeout(() => {
                setIsAddingTo(null);
                setNewDoc({ title: "", url: "", version: "" });
                setIngestStatus({ message: "", error: "" });
                fetchDocs(); // Refresh list
            }, 2000);

        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || "Failed to start ingestion";
            setIngestStatus({ message: "", error: errorMsg });
        } finally {
            setIngesting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document? This will remove it from the knowledge base and vector store.")) return;

        try {
            setDeleteLoading(id);
            await deleteDocument(id);
            setDocuments(documents.filter((doc) => doc.id !== id));
        } catch (err) {
            console.error(err);
            alert("Failed to delete document");
        } finally {
            setDeleteLoading(null);
        }
    };

    const providers = ["aws", "gcp", "azure", "general"];
    const groupedDocs = providers.reduce((acc, provider) => {
        acc[provider] = documents.filter((doc) => doc.provider === provider);
        return acc;
    }, {});

    const card = `rounded-2xl border overflow-hidden mb-8 ${t("bg-gray-900 border-gray-800", "bg-white border-gray-200 shadow-sm")}`;
    const cardHeader = `px-5 py-4 border-b flex items-center justify-between ${t("border-gray-800 bg-gray-900/50", "border-gray-100 bg-gray-50/50")}`;
    const tableHeader = `px-4 py-3 text-[10px] font-bold uppercase tracking-wider ${t("text-gray-500", "text-gray-400")}`;
    const tableCell = `px-4 py-3 text-sm border-t ${t("border-gray-800 text-gray-300", "border-gray-100 text-gray-700")}`;
    const inputBase = `w-full px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 ${t("bg-gray-950 border-gray-700 text-gray-100 placeholder-gray-600", "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400")}`;

    const providerIcons = {
        aws: "☁️",
        gcp: "🌐",
        azure: "🔷",
        general: "📄"
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            {/* ── Page Header ── */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className={`text-2xl font-black tracking-tight ${t("text-white", "text-gray-900")}`}>
                        Knowledge Base
                    </h1>
                    <p className={`text-sm mt-1 ${t("text-gray-500", "text-gray-400")}`}>
                        Manage and expand your cloud security intelligence
                    </p>
                </div>
                <button
                    onClick={fetchDocs}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${t("bg-gray-800 hover:bg-gray-700 text-gray-300", "bg-gray-100 hover:bg-gray-200 text-gray-600")}`}
                >
                    <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {loading && documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p className={t("text-gray-500", "text-gray-400")}>Loading knowledge base...</p>
                </div>
            ) : (
                <>
                    {providers.map((provider) => {
                        const docs = groupedDocs[provider];
                        const isAdding = isAddingTo === provider;

                        return (
                            <div key={provider} className={card}>
                                <div className={cardHeader}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{providerIcons[provider]}</span>
                                        <div>
                                            <h2 className={`text-sm font-bold uppercase tracking-tight ${t("text-white", "text-gray-900")}`}>
                                                {provider === 'aws' ? 'Amazon Web Services' :
                                                    provider === 'gcp' ? 'Google Cloud Platform' :
                                                        provider === 'azure' ? 'Microsoft Azure' : 'General Documents'}
                                            </h2>
                                            <p className={`text-[10px] font-medium ${t("text-gray-500", "text-gray-400")}`}>
                                                {docs.length} document{docs.length !== 1 ? 's' : ''} currently indexed
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAddingTo(isAdding ? null : provider)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isAdding
                                            ? t("bg-gray-800 text-gray-400 hover:text-white", "bg-gray-100 text-gray-500 hover:text-black")
                                            : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95"
                                            }`}
                                    >
                                        {isAdding ? "Cancel" : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                                Ingest New
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* ── Ingestion Form (Inline) ── */}
                                {isAdding && (
                                    <div className={`p-5 border-b animate-in fade-in slide-in-from-top-2 duration-300 ${t("bg-indigo-500/5 border-gray-800", "bg-indigo-50/30 border-gray-100")}`}>
                                        <form onSubmit={(e) => handleIngest(e, provider)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className={`block text-[9px] font-black uppercase tracking-widest mb-1 ${t("text-gray-500", "text-gray-400")}`}>Title</label>
                                                <input
                                                    className={inputBase}
                                                    placeholder="e.g. S3 Security Best Practices"
                                                    value={newDoc.title}
                                                    onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                                                    disabled={ingesting}
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className={`block text-[9px] font-black uppercase tracking-widest mb-1 ${t("text-gray-500", "text-gray-400")}`}>Source URL</label>
                                                <input
                                                    className={inputBase}
                                                    placeholder="https://docs.aws.amazon.com/..."
                                                    value={newDoc.url}
                                                    onChange={e => setNewDoc({ ...newDoc, url: e.target.value })}
                                                    disabled={ingesting}
                                                />
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <label className={`block text-[9px] font-black uppercase tracking-widest mb-1 ${t("text-gray-500", "text-gray-400")}`}>Version (Opt)</label>
                                                    <input
                                                        className={inputBase}
                                                        placeholder="v1.0"
                                                        value={newDoc.version}
                                                        onChange={e => setNewDoc({ ...newDoc, version: e.target.value })}
                                                        disabled={ingesting}
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={ingesting}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-all flex items-center gap-2 h-[34px] shadow-lg shadow-indigo-600/20"
                                                >
                                                    {ingesting ? (
                                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                        </svg>
                                                    ) : "Start"}
                                                </button>
                                            </div>
                                        </form>

                                        {/* Feedback Banners */}
                                        {ingestStatus.message && (
                                            <div className={`mt-3 p-2 rounded-lg text-[11px] font-bold flex items-center gap-2 ${t("bg-emerald-500/10 text-emerald-400", "bg-emerald-50 text-emerald-700")}`}>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                {ingestStatus.message}
                                            </div>
                                        )}
                                        {ingestStatus.error && (
                                            <div className={`mt-3 p-2 rounded-lg text-[11px] font-bold flex items-center gap-2 ${t("bg-red-500/10 text-red-400", "bg-red-50 text-red-700")}`}>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                {ingestStatus.error}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="overflow-x-auto min-h-[60px] flex flex-col justify-center">
                                    {docs.length > 0 ? (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className={t("bg-gray-950/30", "bg-gray-50/30")}>
                                                    <th className={tableHeader}>Document Title</th>
                                                    <th className={tableHeader}>Version</th>
                                                    <th className={tableHeader}>Status</th>
                                                    <th className={`${tableHeader} text-right`}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {docs.map((doc) => (
                                                    <tr key={doc.id} className={`${t("hover:bg-gray-800/30", "hover:bg-gray-50/50")} transition-colors group`}>
                                                        <td className={tableCell}>
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${t("bg-gray-800", "bg-gray-100")}`}>
                                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-bold truncate max-w-[250px]" title={doc.title}>{doc.title}</div>
                                                                    <a href={doc.url} target="_blank" rel="noreferrer" className={`text-[10px] font-medium block truncate max-w-[250px] ${t("text-gray-500 hover:text-indigo-400", "text-gray-400 hover:text-indigo-600")}`}>
                                                                        {doc.url}
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={tableCell}>
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t("bg-gray-800 text-gray-500", "bg-gray-100 text-gray-700")}`}>
                                                                {doc.version || "STABLE"}
                                                            </span>
                                                        </td>
                                                        <td className={tableCell}>
                                                            {doc.is_indexed ? (
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${t("bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", "bg-emerald-50 text-emerald-700 border border-emerald-200")}`}>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                                                                    Ready
                                                                </span>
                                                            ) : (
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${t("bg-amber-500/10 text-amber-400 border border-amber-500/20", "bg-amber-50 text-amber-700 border border-amber-200")}`}>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                                                    Syncing
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className={`${tableCell} text-right`}>
                                                            <button
                                                                onClick={() => handleDelete(doc.id)}
                                                                disabled={deleteLoading === doc.id}
                                                                className={`p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${t("text-gray-500 hover:text-red-400 hover:bg-red-400/10", "text-gray-400 hover:text-red-600 hover:bg-red-50")}`}
                                                                title="Delete Document"
                                                            >
                                                                {deleteLoading === doc.id ? (
                                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                                                ) : (
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className={`text-[11px] font-bold uppercase tracking-widest ${t("text-gray-600", "text-gray-400")}`}>No documents for {provider}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

            {/* ── Info Footer ── */}
            <div className={`mt-8 flex items-start gap-4 p-5 rounded-2xl border ${t("bg-gray-900 border-gray-800 text-gray-500", "bg-gray-50 border-gray-200 text-gray-400")}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t("bg-gray-950 text-indigo-400", "bg-white text-indigo-600 shadow-sm")}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wide mb-1 ${t("text-gray-300", "text-gray-700")}`}>Pro Tip: Multi-Cloud Intelligence</h4>
                    <p className="text-[11px] leading-relaxed">
                        Your AI Assistant's accuracy depends on the quality of documentation provided here. Use the <strong>Ingest New</strong> button to pull the latest security whitepapers, compliance benchmarks, and API references for each provider. All content is processed as vector embeddings for precise retrieval during security analysis.
                    </p>
                </div>
            </div>
        </div>
    );
}
