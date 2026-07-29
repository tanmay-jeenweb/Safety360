const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createBatchesTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS batches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_id INT NOT NULL,
            site_id INT NOT NULL,
            training_module_id INT NOT NULL,
            trainer_id INT NOT NULL,
            scheduled_date DATE NOT NULL,
            venue VARCHAR(255) NOT NULL,
            batch_size INT NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'Draft',
            pre_test_question_paper_id INT DEFAULT NULL,
            post_test_question_paper_id INT DEFAULT NULL,
            pre_test_weightage INT DEFAULT 0,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
            FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT,
            FOREIGN KEY (training_module_id) REFERENCES training_modules(id) ON DELETE RESTRICT,
            FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE RESTRICT,
            FOREIGN KEY (pre_test_question_paper_id) REFERENCES question_papers(id) ON DELETE SET NULL,
            FOREIGN KEY (post_test_question_paper_id) REFERENCES question_papers(id) ON DELETE SET NULL,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);

    const columnsToEnsure = [
        {
            name: 'pre_test_question_paper_id',
            query: 'ALTER TABLE batches ADD COLUMN pre_test_question_paper_id INT DEFAULT NULL'
        },
        {
            name: 'post_test_question_paper_id',
            query: 'ALTER TABLE batches ADD COLUMN post_test_question_paper_id INT DEFAULT NULL'
        },
        {
            name: 'pre_test_weightage',
            query: 'ALTER TABLE batches ADD COLUMN pre_test_weightage INT DEFAULT 0'
        }
    ];

    for (const column of columnsToEnsure) {
        const [rows] = await db.execute(`SHOW COLUMNS FROM batches LIKE '${column.name}'`);
        if (rows.length === 0) {
            await db.execute(column.query);
        }
    }

    try {
        const [preFk] = await db.execute(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'batches' AND COLUMN_NAME = 'pre_test_question_paper_id' AND REFERENCED_TABLE_NAME = 'question_papers'
        `);
        if (preFk.length === 0) {
            await db.execute(`ALTER TABLE batches ADD CONSTRAINT fk_pre_test_qp FOREIGN KEY (pre_test_question_paper_id) REFERENCES question_papers(id) ON DELETE SET NULL`);
        }
        
        const [postFk] = await db.execute(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'batches' AND COLUMN_NAME = 'post_test_question_paper_id' AND REFERENCED_TABLE_NAME = 'question_papers'
        `);
        if (postFk.length === 0) {
            await db.execute(`ALTER TABLE batches ADD CONSTRAINT fk_post_test_qp FOREIGN KEY (post_test_question_paper_id) REFERENCES question_papers(id) ON DELETE SET NULL`);
        }
    } catch (e) {
        console.warn("Could not add foreign key constraints for question papers:", e.message);
    }

    try {
        await db.execute("UPDATE batches SET status = 'Closed' WHERE status = 'Feedback'");
    } catch (e) {
        console.warn("Could not update legacy Feedback status to Closed:", e.message);
    }

    console.log("Batches table ready");
};

// ─── Batch CRUD ──────────────────────────────────────────────────────────────
const createBatch = async (data, addedBy) => {
    const query = `
        INSERT INTO batches (
            client_id,
            site_id,
            training_module_id,
            trainer_id,
            scheduled_date,
            venue,
            batch_size,
            status,
            pre_test_question_paper_id,
            post_test_question_paper_id,
            pre_test_weightage,
            added_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        data.clientId,
        data.siteId,
        data.trainingModuleId,
        data.trainerId,
        data.scheduledDate,
        data.venue,
        data.batchSize,
        data.status || 'Draft',
        data.preTestQuestionPaperId || null,
        data.postTestQuestionPaperId || null,
        data.preTestWeightage !== undefined ? data.preTestWeightage : 0,
        addedBy
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const getAllBatches = async () => {
    const query = `
        SELECT 
            b.id,
            b.client_id,
            c.client_name,
            b.site_id,
            s.site_name,
            b.training_module_id,
            tm.module_name,
            b.trainer_id,
            t.trainer_name,
            b.scheduled_date,
            b.venue,
            b.batch_size,
            b.status,
            b.pre_test_question_paper_id,
            b.post_test_question_paper_id,
            qp_pre.name AS pre_test_question_paper_name,
            qp_post.name AS post_test_question_paper_name,
            b.pre_test_weightage,
            b.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            b.created_at,
            b.updated_at
        FROM batches b
        LEFT JOIN clients c ON b.client_id = c.id
        LEFT JOIN sites s ON b.site_id = s.id
        LEFT JOIN training_modules tm ON b.training_module_id = tm.id
        LEFT JOIN trainers t ON b.trainer_id = t.id
        LEFT JOIN question_papers qp_pre ON b.pre_test_question_paper_id = qp_pre.id
        LEFT JOIN question_papers qp_post ON b.post_test_question_paper_id = qp_post.id
        LEFT JOIN users u ON b.added_by = u.id
        ORDER BY b.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateBatch = async (id, data) => {
    const query = `
        UPDATE batches SET 
            client_id = ?,
            site_id = ?,
            training_module_id = ?,
            trainer_id = ?,
            scheduled_date = ?,
            venue = ?,
            batch_size = ?,
            status = ?,
            pre_test_question_paper_id = ?,
            post_test_question_paper_id = ?,
            pre_test_weightage = ?
        WHERE id = ?
    `;

    const params = [
        data.clientId,
        data.siteId,
        data.trainingModuleId,
        data.trainerId,
        data.scheduledDate,
        data.venue,
        data.batchSize,
        data.status,
        data.preTestQuestionPaperId !== undefined ? data.preTestQuestionPaperId : null,
        data.postTestQuestionPaperId !== undefined ? data.postTestQuestionPaperId : null,
        data.preTestWeightage !== undefined ? data.preTestWeightage : 0,
        id
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const deleteBatch = async (id) => {
    const query = `DELETE FROM batches WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getBatchById = async (id) => {
    const query = `
        SELECT 
            b.id,
            b.client_id,
            c.client_name,
            b.site_id,
            s.site_name,
            b.training_module_id,
            tm.module_name,
            b.trainer_id,
            t.trainer_name,
            b.scheduled_date,
            b.venue,
            b.batch_size,
            b.status,
            b.pre_test_question_paper_id,
            b.post_test_question_paper_id,
            qp_pre.name AS pre_test_question_paper_name,
            qp_post.name AS post_test_question_paper_name,
            b.pre_test_weightage,
            b.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            b.created_at,
            b.updated_at
        FROM batches b
        LEFT JOIN clients c ON b.client_id = c.id
        LEFT JOIN sites s ON b.site_id = s.id
        LEFT JOIN training_modules tm ON b.training_module_id = tm.id
        LEFT JOIN trainers t ON b.trainer_id = t.id
        LEFT JOIN question_papers qp_pre ON b.pre_test_question_paper_id = qp_pre.id
        LEFT JOIN question_papers qp_post ON b.post_test_question_paper_id = qp_post.id
        LEFT JOIN users u ON b.added_by = u.id
        WHERE b.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

const createBatchParticipantsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS batch_participants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            batch_id INT NOT NULL,
            employee_id INT NOT NULL,
            attendance TINYINT(1) DEFAULT 0,
            pre_test_score INT DEFAULT NULL,
            post_test_score INT DEFAULT NULL,
            final_score INT DEFAULT NULL,
            band_badge VARCHAR(50) DEFAULT 'UNTESTED',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
            UNIQUE KEY unique_batch_employee (batch_id, employee_id)
        )
    `;
    await db.execute(query);
    console.log("Batch participants table ready");
};

// ─── Batch Participants CRUD ────────────────────────────────────────────────
const getParticipantsByBatchId = async (batchId) => {
    const query = `
        SELECT 
            bp.id,
            bp.batch_id,
            bp.employee_id,
            bp.attendance,
            bp.pre_test_score,
            bp.post_test_score,
            bp.final_score,
            bp.band_badge,
            e.employee_code,
            e.full_name,
            e.employee_type,
            e.contractor_name
        FROM batch_participants bp
        INNER JOIN employees e ON bp.employee_id = e.id
        WHERE bp.batch_id = ?
        ORDER BY e.full_name ASC
    `;
    const [results] = await db.execute(query, [batchId]);
    return results;
};

const addParticipantToBatch = async (batchId, employeeId) => {
    const query = `
        INSERT INTO batch_participants (batch_id, employee_id)
        VALUES (?, ?)
    `;
    const [result] = await db.execute(query, [batchId, employeeId]);
    return result;
};

const removeParticipantFromBatch = async (batchId, employeeId) => {
    const query = `
        DELETE FROM batch_participants
        WHERE batch_id = ? AND employee_id = ?
    `;
    const [result] = await db.execute(query, [batchId, employeeId]);
    return result;
};

const updateParticipantDetails = async (batchId, employeeId, data) => {
    const query = `
        UPDATE batch_participants
        SET 
            attendance = COALESCE(?, attendance),
            pre_test_score = COALESCE(?, pre_test_score),
            post_test_score = COALESCE(?, post_test_score),
            final_score = COALESCE(?, final_score),
            band_badge = COALESCE(?, band_badge)
        WHERE batch_id = ? AND employee_id = ?
    `;
    const params = [
        data.attendance !== undefined ? (data.attendance ? 1 : 0) : null,
        data.preTestScore !== undefined ? data.preTestScore : null,
        data.postTestScore !== undefined ? data.postTestScore : null,
        data.finalScore !== undefined ? data.finalScore : null,
        data.bandBadge !== undefined ? data.bandBadge : null,
        batchId,
        employeeId
    ];
    const [result] = await db.execute(query, params);
    return result;
};

module.exports = {
    createBatchesTable,
    createBatch,
    getAllBatches,
    updateBatch,
    deleteBatch,
    getBatchById,
    createBatchParticipantsTable,
    getParticipantsByBatchId,
    addParticipantToBatch,
    removeParticipantFromBatch,
    updateParticipantDetails
};

