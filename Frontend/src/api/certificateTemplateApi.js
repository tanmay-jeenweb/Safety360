import apiClient from "./authApi";

export const getCertificateTemplates = async () => {
    return apiClient.get("/certificate-templates/all");
};

export const createCertificateTemplate = async (data) => {
    // data: { formatPrefix }
    return apiClient.post("/certificate-templates/add", data);
};

export const updateCertificateTemplate = async (id, data) => {
    // data: { formatPrefix }
    return apiClient.put(`/certificate-templates/update/${id}`, data);
};

export const deleteCertificateTemplate = async (id) => {
    return apiClient.delete(`/certificate-templates/delete/${id}`);
};
