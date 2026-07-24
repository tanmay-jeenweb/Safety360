import apiClient from "./authApi";

export const getRoles = async () => {
    return apiClient.get("/roles/all");
};

export const createRole = async (data) => {
    // data: { roleName }
    return apiClient.post("/roles/add", data);
};

export const updateRole = async (id, data) => {
    // data: { roleName }
    return apiClient.put(`/roles/update/${id}`, data);
};

export const deleteRole = async (id) => {
    return apiClient.delete(`/roles/delete/${id}`);
};
