import apiClient from "./authApi";

export const getDepartments = async () => {
    return apiClient.get("/departments/all");
};

export const createDepartment = async (data) => {
    // data: { departmentName }
    return apiClient.post("/departments/add", data);
};

export const updateDepartment = async (id, data) => {
    // data: { departmentName }
    return apiClient.put(`/departments/update/${id}`, data);
};

export const deleteDepartment = async (id) => {
    return apiClient.delete(`/departments/delete/${id}`);
};
