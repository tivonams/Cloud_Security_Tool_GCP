// src/api/ingest.api.js
import api from "./axios";

export const ingestDocument = async (payload) => {
  const response = await api.post("/documents/", payload);
  return response.data;
};
