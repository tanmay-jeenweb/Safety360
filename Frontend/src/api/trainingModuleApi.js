import apiClient from "./authApi";

export const getTrainingModules = async () => {
    return apiClient.get("/training-modules/all");
};

export const getTrainingModuleById = async (id) => {
    return apiClient.get(`/training-modules/${id}`);
};

export const createTrainingModule = async (data) => {
    return apiClient.post("/training-modules/add", data);
};

export const updateTrainingModule = async (id, data) => {
    return apiClient.put(`/training-modules/update/${id}`, data);
};

export const deleteTrainingModule = async (id) => {
    return apiClient.delete(`/training-modules/delete/${id}`);
};
