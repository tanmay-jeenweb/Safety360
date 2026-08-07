const db = require('../config/db.js');

// ─── Table creation and migration ──────────────────────────────────────────
const createQuestionBankTable = async () => {
    // 1. Create main question_bank table if not exists
    const query = `
        CREATE TABLE IF NOT EXISTS question_bank (
            id INT AUTO_INCREMENT PRIMARY KEY,
            language ENUM('English', 'Hindi') NOT NULL DEFAULT 'English',
            question_type ENUM('MCQ', 'True/False') NOT NULL DEFAULT 'MCQ',
            question_text TEXT NOT NULL,
            options JSON NOT NULL,
            correct_answer VARCHAR(255) NOT NULL,
            valuation_type ENUM('Pre', 'Post', 'Both') NOT NULL DEFAULT 'Both',
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;
    await db.execute(query);

    // 2. Create junction table for multiple module association
    const queryJunction = `
        CREATE TABLE IF NOT EXISTS question_module_mappings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_id INT NOT NULL,
            module_id INT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
            FOREIGN KEY (module_id) REFERENCES training_modules(id) ON DELETE CASCADE,
            UNIQUE KEY unique_q_m (question_id, module_id)
        )
    `;
    await db.execute(queryJunction);

    // 3. Handle Migration / Schema Updates for existing installations
    
    // 3.1 Check if valuation_type column exists, if not add it
    const [valTypeCol] = await db.execute(`SHOW COLUMNS FROM question_bank LIKE 'valuation_type'`);
    if (valTypeCol.length === 0) {
        await db.execute(`ALTER TABLE question_bank ADD COLUMN valuation_type ENUM('Pre', 'Post', 'Both') NOT NULL DEFAULT 'Both'`);
        console.log("Added valuation_type column to question_bank");
    }

    // 3.2 Check if module_id column still exists in question_bank
    const [moduleIdCol] = await db.execute(`SHOW COLUMNS FROM question_bank LIKE 'module_id'`);
    if (moduleIdCol.length > 0) {
        console.log("Found legacy module_id column in question_bank. Migrating data...");

        // 3.3 If question_module_mappings is empty, copy existing module_id associations
        const [existingMappings] = await db.execute(`SELECT COUNT(*) as count FROM question_module_mappings`);
        if (existingMappings[0].count === 0) {
            await db.execute(`
                INSERT IGNORE INTO question_module_mappings (question_id, module_id)
                SELECT id, module_id FROM question_bank WHERE module_id IS NOT NULL
            `);
            console.log("Successfully migrated legacy module associations to question_module_mappings");
        }

        // 3.4 Find constraint name for foreign key on module_id to drop it
        const [fkRows] = await db.execute(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'question_bank' 
              AND COLUMN_NAME = 'module_id' 
              AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        for (const row of fkRows) {
            try {
                await db.execute(`ALTER TABLE question_bank DROP FOREIGN KEY ${row.CONSTRAINT_NAME}`);
                console.log(`Dropped foreign key constraint ${row.CONSTRAINT_NAME}`);
            } catch (err) {
                console.error(`Failed to drop foreign key constraint ${row.CONSTRAINT_NAME}:`, err.message);
            }
        }

        // 3.5 Drop index on module_id if exists
        try {
            await db.execute(`ALTER TABLE question_bank DROP INDEX module_id`);
            console.log("Dropped legacy index on module_id");
        } catch (err) {
            // Index might not exist under this name or already dropped with foreign key
        }

        // 3.6 Drop the module_id column
        try {
            await db.execute(`ALTER TABLE question_bank DROP COLUMN module_id`);
            console.log("Dropped legacy module_id column from question_bank");
        } catch (err) {
            console.error("Failed to drop legacy module_id column:", err.message);
        }
    }

    console.log("Question bank database tables and schema ready");
};

// ─── Question Bank CRUD ──────────────────────────────────────────────────────
const createQuestion = async (data, addedBy) => {
    const query = `
        INSERT INTO question_bank (
            language,
            question_type,
            question_text,
            options,
            correct_answer,
            valuation_type,
            added_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const optionsJson = JSON.stringify(data.options || []);

    const params = [
        data.language || 'English',
        data.questionType || 'MCQ',
        data.questionText,
        optionsJson,
        data.correctAnswer,
        data.valuationType || 'Both',
        addedBy
    ];

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.execute(query, params);
        const questionId = result.insertId;

        // Insert mappings into question_module_mappings
        const moduleIds = Array.isArray(data.moduleIds) ? data.moduleIds : (data.moduleId ? [data.moduleId] : []);
        for (const moduleId of moduleIds) {
            await connection.execute(
                `INSERT INTO question_module_mappings (question_id, module_id) VALUES (?, ?)`,
                [questionId, moduleId]
            );
        }

        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getAllQuestions = async () => {
    const query = `
        SELECT 
            qb.id,
            qb.language,
            qb.question_type,
            qb.question_text,
            qb.options,
            qb.correct_answer,
            qb.valuation_type,
            qb.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            qb.created_at,
            qb.updated_at
        FROM question_bank qb
        LEFT JOIN users u ON qb.added_by = u.id
        ORDER BY qb.created_at DESC
    `;
    const [results] = await db.execute(query);

    if (results.length === 0) return [];

    // Fetch all module mappings
    const [mappings] = await db.execute(`
        SELECT qmm.question_id, qmm.module_id, tm.module_name
        FROM question_module_mappings qmm
        JOIN training_modules tm ON qmm.module_id = tm.id
    `);

    // Group mappings by question_id
    const mappingsMap = {};
    mappings.forEach(m => {
        if (!mappingsMap[m.question_id]) {
            mappingsMap[m.question_id] = [];
        }
        mappingsMap[m.question_id].push({
            id: m.module_id,
            name: m.module_name
        });
    });

    return results.map(row => ({
        ...row,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []),
        modules: mappingsMap[row.id] || []
    }));
};

const getQuestionById = async (id) => {
    const query = `
        SELECT 
            qb.id,
            qb.language,
            qb.question_type,
            qb.question_text,
            qb.options,
            qb.correct_answer,
            qb.valuation_type,
            qb.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            qb.created_at,
            qb.updated_at
        FROM question_bank qb
        LEFT JOIN users u ON qb.added_by = u.id
        WHERE qb.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    if (!rows[0]) return null;

    const row = rows[0];
    
    // Fetch modules for this question
    const [mappings] = await db.execute(`
        SELECT qmm.module_id, tm.module_name
        FROM question_module_mappings qmm
        JOIN training_modules tm ON qmm.module_id = tm.id
        WHERE qmm.question_id = ?
    `, [id]);

    return {
        ...row,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []),
        modules: mappings.map(m => ({ id: m.module_id, name: m.module_name }))
    };
};

const updateQuestion = async (id, data) => {
    const query = `
        UPDATE question_bank SET 
            language = ?,
            question_type = ?,
            question_text = ?,
            options = ?,
            correct_answer = ?,
            valuation_type = ?
        WHERE id = ?
    `;

    const optionsJson = JSON.stringify(data.options || []);

    const params = [
        data.language || 'English',
        data.questionType || 'MCQ',
        data.questionText,
        optionsJson,
        data.correctAnswer,
        data.valuationType || 'Both',
        id
    ];

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute(query, params);

        // Delete old mappings
        await connection.execute(`DELETE FROM question_module_mappings WHERE question_id = ?`, [id]);

        // Insert new mappings
        const moduleIds = Array.isArray(data.moduleIds) ? data.moduleIds : (data.moduleId ? [data.moduleId] : []);
        for (const moduleId of moduleIds) {
            await connection.execute(
                `INSERT INTO question_module_mappings (question_id, module_id) VALUES (?, ?)`,
                [id, moduleId]
            );
        }

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
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
            qb.language,
            qb.question_type,
            qb.question_text,
            qb.options,
            qb.correct_answer,
            qb.valuation_type,
            qb.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            qb.created_at,
            qb.updated_at
        FROM question_bank qb
        INNER JOIN question_module_mappings qmm ON qb.id = qmm.question_id
        LEFT JOIN users u ON qb.added_by = u.id
        WHERE qmm.module_id = ?
        ORDER BY qb.created_at DESC
    `;
    const [results] = await db.execute(query, [moduleId]);

    if (results.length === 0) return [];

    // Fetch mappings for these question IDs
    const qIds = results.map(r => r.id);
    const [mappings] = await db.query(`
        SELECT qmm.question_id, qmm.module_id, tm.module_name
        FROM question_module_mappings qmm
        JOIN training_modules tm ON qmm.module_id = tm.id
        WHERE qmm.question_id IN (?)
    `, [qIds]);

    const mappingsMap = {};
    mappings.forEach(m => {
        if (!mappingsMap[m.question_id]) {
            mappingsMap[m.question_id] = [];
        }
        mappingsMap[m.question_id].push({
            id: m.module_id,
            name: m.module_name
        });
    });

    return results.map(row => ({
        ...row,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []),
        modules: mappingsMap[row.id] || []
    }));
};

const bulkCreateQuestions = async (questionsList, addedBy) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const results = [];
        
        const query = `
            INSERT INTO question_bank (
                language,
                question_type,
                question_text,
                options,
                correct_answer,
                valuation_type,
                added_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        for (const q of questionsList) {
            const optionsJson = JSON.stringify(q.options || []);
            const params = [
                q.language || 'English',
                q.questionType || 'MCQ',
                q.questionText,
                optionsJson,
                q.correctAnswer,
                q.valuationType || 'Both',
                addedBy
            ];
            const [result] = await connection.execute(query, params);
            const questionId = result.insertId;

            // Insert mappings into question_module_mappings
            const moduleIds = Array.isArray(q.moduleIds) ? q.moduleIds : (q.moduleId ? [q.moduleId] : []);
            for (const moduleId of moduleIds) {
                await connection.execute(
                    `INSERT INTO question_module_mappings (question_id, module_id) VALUES (?, ?)`,
                    [questionId, moduleId]
                );
            }
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
