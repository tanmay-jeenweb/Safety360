const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createSitesTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS sites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            site_name VARCHAR(150) NOT NULL UNIQUE,
            client_id INT NOT NULL,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Sites table ready");
};

// ─── Site CRUD ────────────────────────────────────────────────────────────────
const createSite = async (siteName, clientId, addedBy) => {
    const query = `INSERT INTO sites (site_name, client_id, added_by) VALUES (?, ?, ?)`;
    const [result] = await db.execute(query, [siteName, clientId, addedBy]);
    return result;
};

const getAllSites = async () => {
    const query = `
        SELECT 
            s.id,
            s.site_name,
            s.client_id,
            COALESCE(c.client_name, 'Unknown Client') AS client_name,
            s.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            s.created_at,
            s.updated_at
        FROM sites s
        LEFT JOIN clients c ON s.client_id = c.id
        LEFT JOIN users u ON s.added_by = u.id
        ORDER BY s.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateSite = async (id, siteName, clientId) => {
    const query = `UPDATE sites SET site_name = ?, client_id = ? WHERE id = ?`;
    const [result] = await db.execute(query, [siteName, clientId, id]);
    return result;
};

const deleteSite = async (id) => {
    const query = `DELETE FROM sites WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getSiteById = async (id) => {
    const query = `
        SELECT 
            s.id,
            s.site_name,
            s.client_id,
            COALESCE(c.client_name, 'Unknown Client') AS client_name,
            s.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            s.created_at,
            s.updated_at
        FROM sites s
        LEFT JOIN clients c ON s.client_id = c.id
        LEFT JOIN users u ON s.added_by = u.id
        WHERE s.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createSitesTable,
    createSite,
    getAllSites,
    updateSite,
    deleteSite,
    getSiteById
};
