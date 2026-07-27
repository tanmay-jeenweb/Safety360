import apiClient from "./authApi";

export const getBatches = async () => {
    return apiClient.get("/batches/all");
};

export const createBatch = async (data) => {
    // data: { clientId, siteId, trainingModuleId, trainerId, scheduledDate, venue, batchSize, status }
    return apiClient.post("/batches/add", data);
};

export const updateBatch = async (id, data) => {
    // data: { clientId, siteId, trainingModuleId, trainerId, scheduledDate, venue, batchSize, status }
    return apiClient.put(`/batches/update/${id}`, data);
};

export const deleteBatch = async (id) => {
    return apiClient.delete(`/batches/delete/${id}`);
};
