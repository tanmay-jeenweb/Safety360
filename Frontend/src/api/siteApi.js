import apiClient from "./authApi";

export const getSites = async () => {
    return apiClient.get("/sites/all");
};

export const createSite = async (data) => {
    // data: { siteName, clientId }
    return apiClient.post("/sites/add", data);
};

export const updateSite = async (id, data) => {
    // data: { siteName, clientId }
    return apiClient.put(`/sites/update/${id}`, data);
};

export const deleteSite = async (id) => {
    return apiClient.delete(`/sites/delete/${id}`);
};
