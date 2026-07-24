import apiClient from "./authApi";

export const getClients = async () => {
    return apiClient.get("/clients/all");
};

export const createClient = async (data) => {
    // data: { clientName }
    return apiClient.post("/clients/add", data);
};

export const updateClient = async (id, data) => {
    // data: { clientName }
    return apiClient.put(`/clients/update/${id}`, data);
};

export const deleteClient = async (id) => {
    return apiClient.delete(`/clients/delete/${id}`);
};
