// src/api/rag.api.js
import api from "./axios";

export const askRag = async (payload) => {
  const response = await api.post("/rag/", payload);
  return response.data;
};

// ✅ Download DOCX report (no LLM call again)
export const downloadRagReport = async (payload) => {
  const response = await api.post("/doc_download/", payload, {
    responseType: "blob",
  });

  // ✅ Fixed filename (since you said you don’t need dynamic name)
  const filename = "rag_report.docx";

  // ✅ Download trigger
  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
};
