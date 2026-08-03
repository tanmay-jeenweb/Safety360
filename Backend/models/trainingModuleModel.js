const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createTrainingModulesTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS training_modules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            module_name VARCHAR(150) NOT NULL UNIQUE,
            category_id INT NOT NULL,
            duration_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00,
            validity_months INT NOT NULL DEFAULT 0,
            passing_marks INT NOT NULL DEFAULT 0,
            refresher_months INT NOT NULL DEFAULT 0,
            practical_required ENUM('Yes', 'No') NOT NULL DEFAULT 'No',
            pre_test_qs INT NOT NULL DEFAULT 0,
            post_test_qs INT NOT NULL DEFAULT 0,
            certificate_applicable ENUM('Yes', 'No') NOT NULL DEFAULT 'No',
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);
    console.log("Training modules table ready");
};

// ─── Training Module CRUD ─────────────────────────────────────────────────────
const createTrainingModule = async (data, addedBy) => {
    const query = `
        INSERT INTO training_modules (
            module_name,
            category_id,
            duration_hours,
            validity_months,
            passing_marks,
            refresher_months,
            practical_required,
            pre_test_qs,
            post_test_qs,
            certificate_applicable,
            added_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        data.moduleName,
        data.categoryId,
        data.durationHours || 0,
        data.validityMonths || 0,
        data.passingMarks || 0,
        data.refresherMonths || 0,
        data.practicalRequired || 'No',
        data.preTestQs || 0,
        data.postTestQs || 0,
        data.certificateApplicable || 'No',
        addedBy
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const getAllTrainingModules = async () => {
    const query = `
        SELECT 
            tm.id,
            tm.module_name,
            tm.category_id,
            COALESCE(c.category_name, 'Unknown') AS category_name,
            tm.duration_hours,
            tm.validity_months,
            tm.passing_marks,
            tm.refresher_months,
            tm.practical_required,
            tm.pre_test_qs,
            tm.post_test_qs,
            tm.certificate_applicable,
            tm.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            tm.created_at,
            tm.updated_at,
            CONCAT(tm.category_id, '.', (
                SELECT COUNT(*) 
                FROM training_modules tm2 
                WHERE tm2.category_id = tm.category_id AND tm2.id <= tm.id
            )) AS display_id
        FROM training_modules tm
        LEFT JOIN categories c ON tm.category_id = c.id
        LEFT JOIN users u ON tm.added_by = u.id
        ORDER BY tm.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateTrainingModule = async (id, data) => {
    const query = `
        UPDATE training_modules SET 
            module_name = ?,
            category_id = ?,
            duration_hours = ?,
            validity_months = ?,
            passing_marks = ?,
            refresher_months = ?,
            practical_required = ?,
            pre_test_qs = ?,
            post_test_qs = ?,
            certificate_applicable = ?
        WHERE id = ?
    `;

    const params = [
        data.moduleName,
        data.categoryId,
        data.durationHours || 0,
        data.validityMonths || 0,
        data.passingMarks || 0,
        data.refresherMonths || 0,
        data.practicalRequired || 'No',
        data.preTestQs || 0,
        data.postTestQs || 0,
        data.certificateApplicable || 'No',
        id
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const deleteTrainingModule = async (id) => {
    const query = `DELETE FROM training_modules WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getTrainingModuleById = async (id) => {
    const query = `
        SELECT 
            tm.id,
            tm.module_name,
            tm.category_id,
            COALESCE(c.category_name, 'Unknown') AS category_name,
            tm.duration_hours,
            tm.validity_months,
            tm.passing_marks,
            tm.refresher_months,
            tm.practical_required,
            tm.pre_test_qs,
            tm.post_test_qs,
            tm.certificate_applicable,
            tm.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            tm.created_at,
            tm.updated_at,
            CONCAT(tm.category_id, '.', (
                SELECT COUNT(*) 
                FROM training_modules tm2 
                WHERE tm2.category_id = tm.category_id AND tm2.id <= tm.id
            )) AS display_id
        FROM training_modules tm
        LEFT JOIN categories c ON tm.category_id = c.id
        LEFT JOIN users u ON tm.added_by = u.id
        WHERE tm.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createTrainingModulesTable,
    createTrainingModule,
    getAllTrainingModules,
    updateTrainingModule,
    deleteTrainingModule,
    getTrainingModuleById
};
