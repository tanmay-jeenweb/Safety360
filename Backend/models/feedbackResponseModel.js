const db = require('../config/db.js');

const createEmployeeFeedbacksTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS employee_feedbacks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            batch_id INT NOT NULL,
            employee_id INT NOT NULL,
            feedback_paper_id INT NOT NULL,
            responses JSON NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
            FOREIGN KEY (feedback_paper_id) REFERENCES feedback_papers(id) ON DELETE RESTRICT,
            UNIQUE KEY unique_batch_employee_feedback (batch_id, employee_id)
        )
    `;
    await db.execute(query);
    console.log("Employee feedbacks table ready");
};

const saveEmployeeFeedback = async (batchId, employeeId, feedbackPaperId, responses) => {
    const query = `
        INSERT INTO employee_feedbacks (batch_id, employee_id, feedback_paper_id, responses)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE responses = VALUES(responses)
    `;
    const responsesJson = JSON.stringify(responses || []);
    const [result] = await db.execute(query, [batchId, employeeId, feedbackPaperId, responsesJson]);
    return result;
};

const getFeedbackByBatchAndEmployee = async (batchId, employeeId) => {
    const query = `
        SELECT id, responses, created_at 
        FROM employee_feedbacks 
        WHERE batch_id = ? AND employee_id = ?
    `;
    const [rows] = await db.execute(query, [batchId, employeeId]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
        ...row,
        responses: typeof row.responses === 'string' ? JSON.parse(row.responses) : (row.responses || [])
    };
};

module.exports = {
    createEmployeeFeedbacksTable,
    saveEmployeeFeedback,
    getFeedbackByBatchAndEmployee
};
