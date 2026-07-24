const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createTrainersTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS trainers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trainer_name VARCHAR(150) NOT NULL,
            trainer_email VARCHAR(150) NOT NULL UNIQUE,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Trainers table ready");
};

// ─── Trainer CRUD ─────────────────────────────────────────────────────────────
const createTrainer = async (trainerName, trainerEmail, addedBy) => {
    const query = `INSERT INTO trainers (trainer_name, trainer_email, added_by) VALUES (?, ?, ?)`;
    const [result] = await db.execute(query, [trainerName, trainerEmail, addedBy]);
    return result;
};

const getAllTrainers = async () => {
    const query = `
        SELECT 
            t.id,
            t.trainer_name,
            t.trainer_email,
            t.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            t.created_at,
            t.updated_at
        FROM trainers t
        LEFT JOIN users u ON t.added_by = u.id
        ORDER BY t.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateTrainer = async (id, trainerName, trainerEmail) => {
    const query = `UPDATE trainers SET trainer_name = ?, trainer_email = ? WHERE id = ?`;
    const [result] = await db.execute(query, [trainerName, trainerEmail, id]);
    return result;
};

const deleteTrainer = async (id) => {
    const query = `DELETE FROM trainers WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getTrainerById = async (id) => {
    const query = `
        SELECT 
            t.id,
            t.trainer_name,
            t.trainer_email,
            t.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            t.created_at,
            t.updated_at
        FROM trainers t
        LEFT JOIN users u ON t.added_by = u.id
        WHERE t.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createTrainersTable,
    createTrainer,
    getAllTrainers,
    updateTrainer,
    deleteTrainer,
    getTrainerById
};
