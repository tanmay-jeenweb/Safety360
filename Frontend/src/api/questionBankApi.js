import apiClient from "./authApi";

export const getQuestions = async () => {
    return apiClient.get("/question-bank/all");
};

export const getQuestionById = async (id) => {
    return apiClient.get(`/question-bank/${id}`);
};

export const createQuestion = async (data) => {
    return apiClient.post("/question-bank/add", data);
};

export const updateQuestion = async (id, data) => {
    return apiClient.put(`/question-bank/update/${id}`, data);
};

export const deleteQuestion = async (id) => {
    return apiClient.delete(`/question-bank/delete/${id}`);
};

export const getQuestionsByModule = async (moduleId) => {
    return apiClient.get(`/question-bank/module/${moduleId}`);
};

export const importQuestions = async (questions) => {
    return apiClient.post("/question-bank/bulk-add", { questions });
};

