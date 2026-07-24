import apiClient from "./authApi";

export const getRatingScales = async () => {
    return apiClient.get("/rating-scales/all");
};

export const createRatingScale = async (data) => {
    // data: { ratingValue, meaning, colorHex }
    return apiClient.post("/rating-scales/add", data);
};

export const updateRatingScale = async (id, data) => {
    // data: { ratingValue, meaning, colorHex }
    return apiClient.put(`/rating-scales/update/${id}`, data);
};

export const deleteRatingScale = async (id) => {
    return apiClient.delete(`/rating-scales/delete/${id}`);
};
