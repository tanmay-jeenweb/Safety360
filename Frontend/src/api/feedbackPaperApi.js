import apiClient from "./authApi";

export const getFeedbackPapers = async () => {
    return apiClient.get("/feedback-papers/all");
};

export const getFeedbackPaperById = async (id) => {
    return apiClient.get(`/feedback-papers/${id}`);
};

export const createFeedbackPaper = async (data) => {
    return apiClient.post("/feedback-papers/add", data);
};

export const updateFeedbackPaper = async (id, data) => {
    return apiClient.put(`/feedback-papers/update/${id}`, data);
};

export const deleteFeedbackPaper = async (id) => {
    return apiClient.delete(`/feedback-papers/delete/${id}`);
};
