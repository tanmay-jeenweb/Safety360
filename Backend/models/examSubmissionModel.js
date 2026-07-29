const db = require('../config/db.js');

const createExamSubmissionsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS employee_exam_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            batch_id INT NOT NULL,
            employee_id INT NOT NULL,
            test_type ENUM('Pre', 'Post') NOT NULL,
            attempt_number INT NOT NULL,
            answers JSON NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
            UNIQUE KEY unique_submission (batch_id, employee_id, test_type, attempt_number)
        )
    `;
    await db.execute(query);
    console.log("Employee exam submissions table ready");
};

const saveExamSubmission = async (batchId, employeeId, testType, attemptNumber, answers) => {
    const query = `
        INSERT INTO employee_exam_submissions (batch_id, employee_id, test_type, attempt_number, answers)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE answers = VALUES(answers)
    `;
    const answersJson = JSON.stringify(answers || []);
    const [result] = await db.execute(query, [batchId, employeeId, testType, attemptNumber, answersJson]);
    return result;
};

module.exports = {
    createExamSubmissionsTable,
    saveExamSubmission
};
