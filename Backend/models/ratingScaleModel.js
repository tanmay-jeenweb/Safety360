const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createRatingScalesTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS rating_scales (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rating_value INT NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
            meaning VARCHAR(150) NOT NULL,
            color_hex VARCHAR(10) NOT NULL,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Rating scales table ready");
};

// ─── Rating Scale CRUD ────────────────────────────────────────────────────────
const createRatingScale = async (ratingValue, meaning, colorHex, addedBy) => {
    const query = `INSERT INTO rating_scales (rating_value, meaning, color_hex, added_by) VALUES (?, ?, ?, ?)`;
    const [result] = await db.execute(query, [ratingValue, meaning, colorHex, addedBy]);
    return result;
};

const getAllRatingScales = async () => {
    const query = `
        SELECT 
            rs.id,
            rs.rating_value,
            rs.meaning,
            rs.color_hex,
            rs.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            rs.created_at,
            rs.updated_at
        FROM rating_scales rs
        LEFT JOIN users u ON rs.added_by = u.id
        ORDER BY rs.rating_value ASC, rs.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateRatingScale = async (id, ratingValue, meaning, colorHex) => {
    const query = `UPDATE rating_scales SET rating_value = ?, meaning = ?, color_hex = ? WHERE id = ?`;
    const [result] = await db.execute(query, [ratingValue, meaning, colorHex, id]);
    return result;
};

const deleteRatingScale = async (id) => {
    const query = `DELETE FROM rating_scales WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getRatingScaleById = async (id) => {
    const query = `
        SELECT 
            rs.id,
            rs.rating_value,
            rs.meaning,
            rs.color_hex,
            rs.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            rs.created_at,
            rs.updated_at
        FROM rating_scales rs
        LEFT JOIN users u ON rs.added_by = u.id
        WHERE rs.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createRatingScalesTable,
    createRatingScale,
    getAllRatingScales,
    updateRatingScale,
    deleteRatingScale,
    getRatingScaleById
};
