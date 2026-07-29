import apiClient from "./authApi";

export const getFeedbackQuestions = async () => {
    return apiClient.get("/feedback-question-bank/all");
};

export const getFeedbackQuestionById = async (id) => {
    return apiClient.get(`/feedback-question-bank/${id}`);
};

export const createFeedbackQuestion = async (data) => {
    return apiClient.post("/feedback-question-bank/add", data);
};

export const updateFeedbackQuestion = async (id, data) => {
    return apiClient.put(`/feedback-question-bank/update/${id}`, data);
};

export const deleteFeedbackQuestion = async (id) => {
    return apiClient.delete(`/feedback-question-bank/delete/${id}`);
};
