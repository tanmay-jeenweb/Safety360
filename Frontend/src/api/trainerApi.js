import apiClient from "./authApi";

export const getTrainers = async () => {
    return apiClient.get("/trainers/all");
};

export const createTrainer = async (data) => {
    // data: { trainerName, trainerEmail }
    return apiClient.post("/trainers/add", data);
};

export const updateTrainer = async (id, data) => {
    // data: { trainerName, trainerEmail }
    return apiClient.put(`/trainers/update/${id}`, data);
};

export const deleteTrainer = async (id) => {
    return apiClient.delete(`/trainers/delete/${id}`);
};
