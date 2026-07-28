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

export const importEmployees = async (records) => {
    return apiClient.post("/employees/import", records);
};

export const getMyActiveTests = async () => {
    return apiClient.get("/employees/my-tests");
};

export const getMyDashboardData = async () => {
    return apiClient.get("/employees/my-dashboard");
};

export const changeEmployeePassword = async (data) => {
    return apiClient.post("/employees/change-password", data);
};

export const getTestDetails = async (batchId, testType) => {
    return apiClient.get(`/employees/test-details/${batchId}/${testType}`);
};

export const submitTest = async (payload) => {
    return apiClient.post("/employees/submit-test", payload);
};
