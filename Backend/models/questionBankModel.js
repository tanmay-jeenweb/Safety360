const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createQuestionBankTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS question_bank (
            id INT AUTO_INCREMENT PRIMARY KEY,
            module_id INT NOT NULL,
            language ENUM('English', 'Hindi') NOT NULL DEFAULT 'English',
            question_type ENUM('MCQ', 'True/False') NOT NULL DEFAULT 'MCQ',
            question_text TEXT NOT NULL,
            options JSON NOT NULL,
            correct_answer VARCHAR(255) NOT NULL,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (module_id) REFERENCES training_modules(id) ON DELETE CASCADE,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Question bank table ready");
};

// ─── Question Bank CRUD ──────────────────────────────────────────────────────
const createQuestion = async (data, addedBy) => {
    const query = `
        INSERT INTO question_bank (
            module_id,
            language,
            question_type,
            question_text,
            options,
            correct_answer,
            added_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const optionsJson = JSON.stringify(data.options || []);

    const params = [
        data.moduleId,
        data.language || 'English',
        data.questionType || 'MCQ',
        data.questionText,
        optionsJson,
        data.correctAnswer,
        addedBy
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const getAllQuestions = async () => {
    const query = `
        SELECT 
            qb.id,
            qb.module_id,
            COALESCE(tm.module_name, 'Unknown') AS module_name,
            qb.language,
            qb.question_type,
            qb.question_text,
            qb.options,
            qb.correct_answer,
            qb.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            qb.created_at,
            qb.updated_at
        FROM question_bank qb
        LEFT JOIN training_modules tm ON qb.module_id = tm.id
        LEFT JOIN users u ON qb.added_by = u.id
        ORDER BY qb.created_at DESC
    `;
    const [results] = await db.execute(query);

    return results.map(row => ({
        ...row,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || [])
    }));
};

const getQuestionById = async (id) => {
    const query = `
        SELECT 
            qb.id,
            qb.module_id,
            COALESCE(tm.module_name, 'Unknown') AS module_name,
            qb.language,
            qb.question_type,
            qb.question_text,
            qb.options,
            qb.correct_answer,
            qb.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            qb.created_at,
            qb.updated_at
        FROM question_bank qb
        LEFT JOIN training_modules tm ON qb.module_id = tm.id
        LEFT JOIN users u ON qb.added_by = u.id
        WHERE qb.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    if (!rows[0]) return null;

    const row = rows[0];
    return {
        ...row,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || [])
    };
};

const updateQuestion = async (id, data) => {
    const query = `
        UPDATE question_bank SET 
            module_id = ?,
            language = ?,
            question_type = ?,
            question_text = ?,
            options = ?,
            correct_answer = ?
        WHERE id = ?
    `;

    const optionsJson = JSON.stringify(data.options || []);

    const params = [
        data.moduleId,
        data.language || 'English',
        data.questionType || 'MCQ',
        data.questionText,
        optionsJson,
        data.correctAnswer,
        id
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const deleteQuestion = async (id) => {
    const query = `DELETE FROM question_bank WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getQuestionsByModule = async (moduleId) => {
    const query = `
        SELECT 
            qb.id,
            qb.module_id,
            COALESCE(tm.module_name, 'Unknown') AS module_name,
            qb.language,
            qb.question_type,
            qb.question_text,
            qb.options,
            qb.correct_answer,
            qb.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            qb.created_at,
            qb.updated_at
        FROM question_bank qb
        LEFT JOIN training_modules tm ON qb.module_id = tm.id
        LEFT JOIN users u ON qb.added_by = u.id
        WHERE qb.module_id = ?
        ORDER BY qb.created_at DESC
    `;
    const [results] = await db.execute(query, [moduleId]);

    return results.map(row => ({
        ...row,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || [])
    }));
};

const bulkCreateQuestions = async (questionsList, addedBy) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const results = [];
        
        const query = `
            INSERT INTO question_bank (
                module_id,
                language,
                question_type,
                question_text,
                options,
                correct_answer,
                added_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        for (const q of questionsList) {
            const optionsJson = JSON.stringify(q.options || []);
            const params = [
                q.moduleId,
                q.language || 'English',
                q.questionType || 'MCQ',
                q.questionText,
                optionsJson,
                q.correctAnswer,
                addedBy
            ];
            const [result] = await connection.execute(query, params);
            results.push(result);
        }

        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    createQuestionBankTable,
    createQuestion,
    getAllQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getQuestionsByModule,
    bulkCreateQuestions
};

