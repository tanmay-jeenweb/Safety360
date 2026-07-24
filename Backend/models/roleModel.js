const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createRolesTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role_name VARCHAR(150) NOT NULL UNIQUE,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Roles table ready");
};

// ─── Role CRUD ────────────────────────────────────────────────────────────────
const createRole = async (roleName, addedBy) => {
    const query = `INSERT INTO roles (role_name, added_by) VALUES (?, ?)`;
    const [result] = await db.execute(query, [roleName, addedBy]);
    return result;
};

const getAllRoles = async () => {
    const query = `
        SELECT 
            r.id,
            r.role_name,
            r.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            r.created_at,
            r.updated_at
        FROM roles r
        LEFT JOIN users u ON r.added_by = u.id
        ORDER BY r.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateRole = async (id, roleName) => {
    const query = `UPDATE roles SET role_name = ? WHERE id = ?`;
    const [result] = await db.execute(query, [roleName, id]);
    return result;
};

const deleteRole = async (id) => {
    const query = `DELETE FROM roles WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getRoleById = async (id) => {
    const query = `
        SELECT 
            r.id,
            r.role_name,
            r.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            r.created_at,
            r.updated_at
        FROM roles r
        LEFT JOIN users u ON r.added_by = u.id
        WHERE r.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createRolesTable,
    createRole,
    getAllRoles,
    updateRole,
    deleteRole,
    getRoleById
};
