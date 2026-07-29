const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createFeedbackQuestionBankTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS feedback_question_bank (
            id INT AUTO_INCREMENT PRIMARY KEY,
            language ENUM('English', 'Hindi') NOT NULL DEFAULT 'English',
            question_type ENUM('Rating', 'Text') NOT NULL DEFAULT 'Rating',
            question_text TEXT NOT NULL,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Feedback question bank table ready");
};

// ─── Feedback Question Bank CRUD ─────────────────────────────────────────────
const createFeedbackQuestion = async (data, addedBy) => {
    const query = `
        INSERT INTO feedback_question_bank (
            language,
            question_type,
            question_text,
            added_by
        ) VALUES (?, ?, ?, ?)
    `;

    const params = [
        data.language || 'English',
        data.questionType || 'Rating',
        data.questionText,
        addedBy
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const getAllFeedbackQuestions = async () => {
    const query = `
        SELECT 
            fq.id,
            fq.language,
            fq.question_type,
            fq.question_text,
            fq.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            fq.created_at,
            fq.updated_at
        FROM feedback_question_bank fq
        LEFT JOIN users u ON fq.added_by = u.id
        ORDER BY fq.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const getFeedbackQuestionById = async (id) => {
    const query = `
        SELECT 
            fq.id,
            fq.language,
            fq.question_type,
            fq.question_text,
            fq.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            fq.created_at,
            fq.updated_at
        FROM feedback_question_bank fq
        LEFT JOIN users u ON fq.added_by = u.id
        WHERE fq.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

const updateFeedbackQuestion = async (id, data) => {
    const query = `
        UPDATE feedback_question_bank SET 
            language = ?,
            question_type = ?,
            question_text = ?
        WHERE id = ?
    `;

    const params = [
        data.language || 'English',
        data.questionType || 'Rating',
        data.questionText,
        id
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const deleteFeedbackQuestion = async (id) => {
    const query = `DELETE FROM feedback_question_bank WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

module.exports = {
    createFeedbackQuestionBankTable,
    createFeedbackQuestion,
    getAllFeedbackQuestions,
    getFeedbackQuestionById,
    updateFeedbackQuestion,
    deleteFeedbackQuestion
};
