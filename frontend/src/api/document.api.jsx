import api from "./axios";

export const getDocuments = async () => {
    const response = await api.get("documents/");
    return response.data;
};

export const deleteDocument = async (id) => {
    const response = await api.delete(`documents/${id}/`);
    return response.data;
};
