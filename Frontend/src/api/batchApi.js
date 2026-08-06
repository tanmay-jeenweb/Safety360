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

export const getBatchById = async (id) => {
    return apiClient.get(`/batches/${id}`);
};

export const getBatchParticipants = async (batchId) => {
    return apiClient.get(`/batches/${batchId}/participants`);
};

export const addBatchParticipant = async (batchId, employeeIdOrIds) => {
    const payload = Array.isArray(employeeIdOrIds) 
        ? { employeeIds: employeeIdOrIds } 
        : { employeeId: employeeIdOrIds };
    return apiClient.post(`/batches/${batchId}/participants`, payload);
};

export const removeBatchParticipant = async (batchId, employeeId) => {
    return apiClient.delete(`/batches/${batchId}/participants/${employeeId}`);
};

export const updateBatchParticipant = async (batchId, employeeId, data) => {
    return apiClient.put(`/batches/${batchId}/participants/${employeeId}`, data);
};

export const requestTrainingApproval = async (batchId, employeeId, comments) => {
    return apiClient.post("/batches/request-exception", { batchId, employeeId, comments });
};

export const getApprovalRequests = async () => {
    return apiClient.get("/batches/exceptions/all");
};

export const updateApprovalRequestStatus = async (requestId, status) => {
    return apiClient.put(`/batches/exceptions/${requestId}/status`, { status });
};

