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
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
            FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT,
            FOREIGN KEY (training_module_id) REFERENCES training_modules(id) ON DELETE RESTRICT,
            FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE RESTRICT,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
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
            added_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            b.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            b.created_at,
            b.updated_at
        FROM batches b
        LEFT JOIN clients c ON b.client_id = c.id
        LEFT JOIN sites s ON b.site_id = s.id
        LEFT JOIN training_modules tm ON b.training_module_id = tm.id
        LEFT JOIN trainers t ON b.trainer_id = t.id
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
            status = ?
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
            b.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            b.created_at,
            b.updated_at
        FROM batches b
        LEFT JOIN clients c ON b.client_id = c.id
        LEFT JOIN sites s ON b.site_id = s.id
        LEFT JOIN training_modules tm ON b.training_module_id = tm.id
        LEFT JOIN trainers t ON b.trainer_id = t.id
        LEFT JOIN users u ON b.added_by = u.id
        WHERE b.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createBatchesTable,
    createBatch,
    getAllBatches,
    updateBatch,
    deleteBatch,
    getBatchById
};
