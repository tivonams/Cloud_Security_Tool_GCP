// src/api/policy.api.js
import api from "./axios";

export const analyzePolicy = async (payload) => {
  const response = await api.post("/policies/", payload);
  return response.data;
};
