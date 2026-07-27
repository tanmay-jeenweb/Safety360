const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createQuestionPaperTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS question_papers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            exam_type ENUM('Pre', 'Post') NOT NULL,
            module_id INT NOT NULL,
            questions JSON NOT NULL,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (module_id) REFERENCES training_modules(id) ON DELETE CASCADE,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Question papers table ready");
};

// ─── Question Paper CRUD ──────────────────────────────────────────────────────
const createQuestionPaper = async (data, addedBy) => {
    const query = `
        INSERT INTO question_papers (
            name,
            exam_type,
            module_id,
            questions,
            added_by
        ) VALUES (?, ?, ?, ?, ?)
    `;

    const questionsJson = JSON.stringify(data.questions || []);

    const params = [
        data.name,
        data.examType || 'Pre',
        data.moduleId,
        questionsJson,
        addedBy
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const getAllQuestionPapers = async () => {
    const query = `
        SELECT 
            qp.id,
            qp.name,
            qp.exam_type,
            qp.module_id,
            COALESCE(tm.module_name, 'Unknown') AS module_name,
            qp.questions,
            qp.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            qp.created_at,
            qp.updated_at
        FROM question_papers qp
        LEFT JOIN training_modules tm ON qp.module_id = tm.id
        LEFT JOIN users u ON qp.added_by = u.id
        ORDER BY qp.created_at DESC
    `;
    const [results] = await db.execute(query);

    return results.map(row => ({
        ...row,
        questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : (row.questions || [])
    }));
};

const getQuestionPaperById = async (id) => {
    const query = `
        SELECT 
            qp.id,
            qp.name,
            qp.exam_type,
            qp.module_id,
            COALESCE(tm.module_name, 'Unknown') AS module_name,
            qp.questions,
            qp.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            qp.created_at,
            qp.updated_at
        FROM question_papers qp
        LEFT JOIN training_modules tm ON qp.module_id = tm.id
        LEFT JOIN users u ON qp.added_by = u.id
        WHERE qp.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    if (!rows[0]) return null;

    const row = rows[0];
    const qIds = typeof row.questions === 'string' ? JSON.parse(row.questions) : (row.questions || []);

    // Fetch detailed questions for these IDs if any
    let detailedQuestions = [];
    if (qIds.length > 0) {
        // Query database for all question details using db.query for array flattening
        const [qRows] = await db.query(
            `SELECT qb.id, qb.question_text, qb.question_type, qb.options, qb.correct_answer 
             FROM question_bank qb 
             WHERE qb.id IN (?)`,
            [qIds]
        );
        detailedQuestions = qRows;
    }

    return {
        ...row,
        questions: qIds,
        detailedQuestions
    };
};

const updateQuestionPaper = async (id, data) => {
    const query = `
        UPDATE question_papers SET 
            name = ?,
            exam_type = ?,
            module_id = ?,
            questions = ?
        WHERE id = ?
    `;

    const questionsJson = JSON.stringify(data.questions || []);

    const params = [
        data.name,
        data.examType || 'Pre',
        data.moduleId,
        questionsJson,
        id
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const deleteQuestionPaper = async (id) => {
    const query = `DELETE FROM question_papers WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

module.exports = {
    createQuestionPaperTable,
    createQuestionPaper,
    getAllQuestionPapers,
    getQuestionPaperById,
    updateQuestionPaper,
    deleteQuestionPaper
};
