import apiClient from "./authApi";

export const getCategories = async () => {
    return apiClient.get("/categories/all");
};

export const createCategory = async (data) => {
    // data: { categoryName }
    return apiClient.post("/categories/add", data);
};

export const updateCategory = async (id, data) => {
    // data: { categoryName }
    return apiClient.put(`/categories/update/${id}`, data);
};

export const deleteCategory = async (id) => {
    return apiClient.delete(`/categories/delete/${id}`);
};
