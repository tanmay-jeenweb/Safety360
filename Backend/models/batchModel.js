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
            feedback_paper_id INT DEFAULT NULL,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
            FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT,
            FOREIGN KEY (training_module_id) REFERENCES training_modules(id) ON DELETE RESTRICT,
            FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE RESTRICT,
            FOREIGN KEY (pre_test_question_paper_id) REFERENCES question_papers(id) ON DELETE SET NULL,
            FOREIGN KEY (post_test_question_paper_id) REFERENCES question_papers(id) ON DELETE SET NULL,
            FOREIGN KEY (feedback_paper_id) REFERENCES feedback_papers(id) ON DELETE SET NULL,
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
        },
        {
            name: 'feedback_paper_id',
            query: 'ALTER TABLE batches ADD COLUMN feedback_paper_id INT DEFAULT NULL'
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

        const [feedbackFk] = await db.execute(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'batches' AND COLUMN_NAME = 'feedback_paper_id' AND REFERENCED_TABLE_NAME = 'feedback_papers'
        `);
        if (feedbackFk.length === 0) {
            await db.execute(`ALTER TABLE batches ADD CONSTRAINT fk_feedback_paper FOREIGN KEY (feedback_paper_id) REFERENCES feedback_papers(id) ON DELETE SET NULL`);
        }
    } catch (e) {
        console.warn("Could not add foreign key constraints for question papers or feedback papers:", e.message);
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
            feedback_paper_id,
            added_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        data.feedbackPaperId || null,
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
            b.feedback_paper_id,
            qp_pre.name AS pre_test_question_paper_name,
            qp_post.name AS post_test_question_paper_name,
            fp.name AS feedback_paper_name,
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
        LEFT JOIN feedback_papers fp ON b.feedback_paper_id = fp.id
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
            pre_test_weightage = ?,
            feedback_paper_id = ?
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
        data.feedbackPaperId !== undefined ? data.feedbackPaperId : null,
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
            b.feedback_paper_id,
            qp_pre.name AS pre_test_question_paper_name,
            qp_post.name AS post_test_question_paper_name,
            fp.name AS feedback_paper_name,
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
        LEFT JOIN feedback_papers fp ON b.feedback_paper_id = fp.id
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
            allow_training_exception TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
            UNIQUE KEY unique_batch_employee (batch_id, employee_id)
        )
    `;
    await db.execute(query);
    console.log("Batch participants table ready");

    // Dynamic schema migration
    try {
        await db.execute("ALTER TABLE batch_participants ADD COLUMN allow_training_exception TINYINT(1) DEFAULT 0");
        console.log("Migration: Added allow_training_exception column to batch_participants table");
    } catch (err) {
        // Ignored if column already exists
    }
};

const createPostTestAttemptsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS post_test_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            batch_id INT NOT NULL,
            employee_id INT NOT NULL,
            attempt_number INT NOT NULL,
            score INT NOT NULL,
            total_questions INT NOT NULL,
            passing_marks INT NOT NULL,
            percentage DECIMAL(5,2) NOT NULL,
            status VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
        )
    `;
    await db.execute(query);
    console.log("Post test attempts table ready");
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
            bp.allow_training_exception,
            e.employee_code,
            e.full_name,
            e.employee_type,
            e.contractor_name,
            (SELECT COUNT(*) FROM post_test_attempts pta WHERE pta.batch_id = bp.batch_id AND pta.employee_id = bp.employee_id) AS post_test_attempts_count,
            etr.status AS exception_status,
            etr.comments AS exception_comments
        FROM batch_participants bp
        INNER JOIN employees e ON bp.employee_id = e.id
        LEFT JOIN employee_training_requests etr ON bp.batch_id = etr.batch_id AND bp.employee_id = etr.employee_id
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
            band_badge = COALESCE(?, band_badge),
            allow_training_exception = COALESCE(?, allow_training_exception)
        WHERE batch_id = ? AND employee_id = ?
    `;
    const params = [
        data.attendance !== undefined ? (data.attendance ? 1 : 0) : null,
        data.preTestScore !== undefined ? data.preTestScore : null,
        data.postTestScore !== undefined ? data.postTestScore : null,
        data.finalScore !== undefined ? data.finalScore : null,
        data.bandBadge !== undefined ? data.bandBadge : null,
        data.allowTrainingException !== undefined ? (data.allowTrainingException ? 1 : 0) : null,
        batchId,
        employeeId
    ];
    const [result] = await db.execute(query, params);
    return result;
};

// ─── Employee Training Exception Requests Table & Helpers ─────────────────────
const createEmployeeTrainingRequestsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS employee_training_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            batch_id INT NOT NULL,
            employee_id INT NOT NULL,
            requested_by INT NOT NULL,
            comments TEXT DEFAULT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
            FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_batch_employee_req (batch_id, employee_id)
        )
    `;
    await db.execute(query);
    console.log("Employee training requests table ready");
};

const createTrainingExceptionRequest = async (batchId, employeeId, requestedBy, comments) => {
    const query = `
        INSERT INTO employee_training_requests (batch_id, employee_id, requested_by, comments, status)
        VALUES (?, ?, ?, ?, 'Pending')
        ON DUPLICATE KEY UPDATE status = 'Pending', comments = ?, requested_by = ?, updated_at = CURRENT_TIMESTAMP
    `;
    const [result] = await db.execute(query, [batchId, employeeId, requestedBy, comments, comments, requestedBy]);
    return result;
};

const getAllTrainingExceptionRequests = async () => {
    const query = `
        SELECT 
            etr.id,
            etr.batch_id,
            etr.employee_id,
            etr.requested_by,
            etr.comments,
            etr.status,
            etr.created_at,
            etr.updated_at,
            e.employee_code,
            e.full_name AS employee_name,
            u.name AS requester_name,
            tm.module_name
        FROM employee_training_requests etr
        INNER JOIN employees e ON etr.employee_id = e.id
        INNER JOIN users u ON etr.requested_by = u.id
        INNER JOIN batches b ON etr.batch_id = b.id
        INNER JOIN training_modules tm ON b.training_module_id = tm.id
        ORDER BY etr.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateTrainingExceptionRequestStatus = async (requestId, status) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // Update request status
        await connection.execute(
            "UPDATE employee_training_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [status, requestId]
        );
        
        // If Approved, update batch_participants to set allow_training_exception = 1
        if (status === 'Approved') {
            const [reqRows] = await connection.execute(
                "SELECT batch_id, employee_id FROM employee_training_requests WHERE id = ?",
                [requestId]
            );
            if (reqRows.length > 0) {
                const { batch_id, employee_id } = reqRows[0];
                await connection.execute(
                    "UPDATE batch_participants SET allow_training_exception = 1 WHERE batch_id = ? AND employee_id = ?",
                    [batch_id, employee_id]
                );
            }
        }
        
        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
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
    updateParticipantDetails,
    createPostTestAttemptsTable,
    createEmployeeTrainingRequestsTable,
    createTrainingExceptionRequest,
    getAllTrainingExceptionRequests,
    updateTrainingExceptionRequestStatus
};

