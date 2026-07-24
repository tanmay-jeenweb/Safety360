const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createCertificateTemplatesTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS certificate_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            format_prefix VARCHAR(150) NOT NULL UNIQUE,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Certificate templates table ready");
};

// ─── Certificate Template CRUD ────────────────────────────────────────────────
const createCertificateTemplate = async (formatPrefix, addedBy) => {
    const query = `INSERT INTO certificate_templates (format_prefix, added_by) VALUES (?, ?)`;
    const [result] = await db.execute(query, [formatPrefix, addedBy]);
    return result;
};

const getAllCertificateTemplates = async () => {
    const query = `
        SELECT 
            ct.id,
            ct.format_prefix,
            ct.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            ct.created_at,
            ct.updated_at
        FROM certificate_templates ct
        LEFT JOIN users u ON ct.added_by = u.id
        ORDER BY ct.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateCertificateTemplate = async (id, formatPrefix) => {
    const query = `UPDATE certificate_templates SET format_prefix = ? WHERE id = ?`;
    const [result] = await db.execute(query, [formatPrefix, id]);
    return result;
};

const deleteCertificateTemplate = async (id) => {
    const query = `DELETE FROM certificate_templates WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getCertificateTemplateById = async (id) => {
    const query = `
        SELECT 
            ct.id,
            ct.format_prefix,
            ct.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            ct.created_at,
            ct.updated_at
        FROM certificate_templates ct
        LEFT JOIN users u ON ct.added_by = u.id
        WHERE ct.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createCertificateTemplatesTable,
    createCertificateTemplate,
    getAllCertificateTemplates,
    updateCertificateTemplate,
    deleteCertificateTemplate,
    getCertificateTemplateById
};
