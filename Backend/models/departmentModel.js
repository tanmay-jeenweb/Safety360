const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createDepartmentsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS departments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            department_name VARCHAR(150) NOT NULL UNIQUE,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Departments table ready");
};

// ─── Department CRUD ──────────────────────────────────────────────────────────
const createDepartment = async (departmentName, addedBy) => {
    const query = `INSERT INTO departments (department_name, added_by) VALUES (?, ?)`;
    const [result] = await db.execute(query, [departmentName, addedBy]);
    return result;
};

const getAllDepartments = async () => {
    const query = `
        SELECT 
            d.id,
            d.department_name,
            d.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            d.created_at,
            d.updated_at
        FROM departments d
        LEFT JOIN users u ON d.added_by = u.id
        ORDER BY d.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateDepartment = async (id, departmentName) => {
    const query = `UPDATE departments SET department_name = ? WHERE id = ?`;
    const [result] = await db.execute(query, [departmentName, id]);
    return result;
};

const deleteDepartment = async (id) => {
    const query = `DELETE FROM departments WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getDepartmentById = async (id) => {
    const query = `
        SELECT 
            d.id,
            d.department_name,
            d.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            d.created_at,
            d.updated_at
        FROM departments d
        LEFT JOIN users u ON d.added_by = u.id
        WHERE d.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createDepartmentsTable,
    createDepartment,
    getAllDepartments,
    updateDepartment,
    deleteDepartment,
    getDepartmentById
};
