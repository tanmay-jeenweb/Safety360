const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createCategoriesTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category_name VARCHAR(150) NOT NULL UNIQUE,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Categories table ready");
};

// ─── Category CRUD ────────────────────────────────────────────────────────────
const createCategory = async (categoryName, addedBy) => {
    const query = `INSERT INTO categories (category_name, added_by) VALUES (?, ?)`;
    const [result] = await db.execute(query, [categoryName, addedBy]);
    return result;
};

const getAllCategories = async () => {
    const query = `
        SELECT 
            c.id,
            c.category_name,
            c.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            c.created_at,
            c.updated_at
        FROM categories c
        LEFT JOIN users u ON c.added_by = u.id
        ORDER BY c.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateCategory = async (id, categoryName) => {
    const query = `UPDATE categories SET category_name = ? WHERE id = ?`;
    const [result] = await db.execute(query, [categoryName, id]);
    return result;
};

const deleteCategory = async (id) => {
    const query = `DELETE FROM categories WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getCategoryById = async (id) => {
    const query = `
        SELECT 
            c.id,
            c.category_name,
            c.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            c.created_at,
            c.updated_at
        FROM categories c
        LEFT JOIN users u ON c.added_by = u.id
        WHERE c.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createCategoriesTable,
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    getCategoryById
};
