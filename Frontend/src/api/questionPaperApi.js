import apiClient from "./authApi";

export const getQuestionPapers = async () => {
    return apiClient.get("/question-paper/all");
};

export const getQuestionPaperById = async (id) => {
    return apiClient.get(`/question-paper/${id}`);
};

export const createQuestionPaper = async (data) => {
    return apiClient.post("/question-paper/add", data);
};

export const updateQuestionPaper = async (id, data) => {
    return apiClient.put(`/question-paper/update/${id}`, data);
};

export const deleteQuestionPaper = async (id) => {
    return apiClient.delete(`/question-paper/delete/${id}`);
};
