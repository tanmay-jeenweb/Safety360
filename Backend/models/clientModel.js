const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createClientsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_name VARCHAR(150) NOT NULL UNIQUE,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Clients table ready");
};

// ─── Client CRUD ──────────────────────────────────────────────────────────────
const createClient = async (clientName, addedBy) => {
    const query = `INSERT INTO clients (client_name, added_by) VALUES (?, ?)`;
    const [result] = await db.execute(query, [clientName, addedBy]);
    return result;
};

const getAllClients = async () => {
    const query = `
        SELECT 
            c.id,
            c.client_name,
            c.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            c.created_at,
            c.updated_at
        FROM clients c
        LEFT JOIN users u ON c.added_by = u.id
        ORDER BY c.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateClient = async (id, clientName) => {
    const query = `UPDATE clients SET client_name = ? WHERE id = ?`;
    const [result] = await db.execute(query, [clientName, id]);
    return result;
};

const deleteClient = async (id) => {
    const query = `DELETE FROM clients WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getClientById = async (id) => {
    const query = `
        SELECT 
            c.id,
            c.client_name,
            c.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            c.created_at,
            c.updated_at
        FROM clients c
        LEFT JOIN users u ON c.added_by = u.id
        WHERE c.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createClientsTable,
    createClient,
    getAllClients,
    updateClient,
    deleteClient,
    getClientById
};
