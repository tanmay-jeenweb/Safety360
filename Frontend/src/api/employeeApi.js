import apiClient from "./authApi";

export const getEmployees = async () => {
    return apiClient.get("/employees/all");
};

export const createEmployee = async (data) => {
    return apiClient.post("/employees/add", data);
};

export const updateEmployee = async (id, data) => {
    return apiClient.put(`/employees/update/${id}`, data);
};

export const deleteEmployee = async (id) => {
    return apiClient.delete(`/employees/delete/${id}`);
};
