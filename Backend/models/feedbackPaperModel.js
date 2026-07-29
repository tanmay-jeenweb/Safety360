const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createFeedbackPapersTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS feedback_papers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            questions JSON NOT NULL,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Feedback papers table ready");
};

// ─── Feedback Paper CRUD ──────────────────────────────────────────────────────
const createFeedbackPaper = async (data, addedBy) => {
    const query = `
        INSERT INTO feedback_papers (
            name,
            questions,
            added_by
        ) VALUES (?, ?, ?)
    `;

    const questionsJson = JSON.stringify(data.questions || []);

    const params = [
        data.name,
        questionsJson,
        addedBy
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const getAllFeedbackPapers = async () => {
    const query = `
        SELECT 
            fp.id,
            fp.name,
            fp.questions,
            fp.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            fp.created_at,
            fp.updated_at
        FROM feedback_papers fp
        LEFT JOIN users u ON fp.added_by = u.id
        ORDER BY fp.created_at DESC
    `;
    const [results] = await db.execute(query);

    return results.map(row => ({
        ...row,
        questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : (row.questions || [])
    }));
};

const getFeedbackPaperById = async (id) => {
    const query = `
        SELECT 
            fp.id,
            fp.name,
            fp.questions,
            fp.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            fp.created_at,
            fp.updated_at
        FROM feedback_papers fp
        LEFT JOIN users u ON fp.added_by = u.id
        WHERE fp.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    if (!rows[0]) return null;

    const row = rows[0];
    const qIds = typeof row.questions === 'string' ? JSON.parse(row.questions) : (row.questions || []);

    // Fetch detailed questions for these IDs if any
    let detailedQuestions = [];
    if (qIds.length > 0) {
        const [qRows] = await db.query(
            `SELECT fq.id, fq.question_text, fq.question_type, fq.language 
             FROM feedback_question_bank fq 
             WHERE fq.id IN (?)`,
            [qIds]
        );
        // Order resolved questions in the same order as in the qIds array
        detailedQuestions = qIds.map(qid => qRows.find(q => q.id === qid)).filter(Boolean);
    }

    return {
        ...row,
        questions: qIds,
        detailedQuestions
    };
};

const updateFeedbackPaper = async (id, data) => {
    const query = `
        UPDATE feedback_papers SET 
            name = ?,
            questions = ?
        WHERE id = ?
    `;

    const questionsJson = JSON.stringify(data.questions || []);

    const params = [
        data.name,
        questionsJson,
        id
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const deleteFeedbackPaper = async (id) => {
    const query = `DELETE FROM feedback_papers WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

module.exports = {
    createFeedbackPapersTable,
    createFeedbackPaper,
    getAllFeedbackPapers,
    getFeedbackPaperById,
    updateFeedbackPaper,
    deleteFeedbackPaper
};
