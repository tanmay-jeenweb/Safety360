const db = require('../config/db.js');
const bcrypt = require('bcryptjs');
const { getQuestionPaperById } = require('../models/questionPaperModel.js');

const getMyTestsController = async (req, res) => {
    try {
        const employeeId = req.user.id;
        
        if (req.user.role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Access denied. Employees only.' });
        }

        const query = `
            SELECT 
                bp.id AS participant_table_id,
                bp.batch_id,
                bp.pre_test_score,
                bp.post_test_score,
                bp.attendance,
                bp.band_badge,
                b.status AS batch_status,
                b.pre_test_question_paper_id,
                b.post_test_question_paper_id,
                b.scheduled_date,
                b.venue,
                tm.module_name,
                t.trainer_name
            FROM batch_participants bp
            INNER JOIN batches b ON bp.batch_id = b.id
            INNER JOIN training_modules tm ON b.training_module_id = tm.id
            INNER JOIN trainers t ON b.trainer_id = t.id
            WHERE bp.employee_id = ?
        `;
        
        const [rows] = await db.execute(query, [employeeId]);
        
        const activeTests = [];
        
        for (const row of rows) {
            // Pre-Test is active: status is 'Pretest Active', paper is configured, and score is null (not taken yet)
            if (row.batch_status === 'Pretest Active' && row.pre_test_question_paper_id && row.pre_test_score === null) {
                activeTests.push({
                    batchId: row.batch_id,
                    testType: 'Pre',
                    questionPaperId: row.pre_test_question_paper_id,
                    moduleName: row.module_name,
                    trainerName: row.trainer_name,
                    scheduledDate: row.scheduled_date,
                    venue: row.venue
                });
            }
            // Post-Test is active: status is 'Posttest Active', paper is configured, and score is null (not taken yet) OR failed (re-attempt), and attendance is marked present
            if (row.batch_status === 'Posttest Active' && row.post_test_question_paper_id && (row.post_test_score === null || row.band_badge === 'FAILED') && row.attendance === 1) {
                activeTests.push({
                    batchId: row.batch_id,
                    testType: 'Post',
                    questionPaperId: row.post_test_question_paper_id,
                    moduleName: row.module_name,
                    trainerName: row.trainer_name,
                    scheduledDate: row.scheduled_date,
                    venue: row.venue
                });
            }
        }
        
        return res.status(200).json({
            success: true,
            data: activeTests
        });
    } catch (error) {
        console.error('Error getting my active tests:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getTestDetailsController = async (req, res) => {
    try {
        const { batchId, testType } = req.params;
        const employeeId = req.user.id;

        if (req.user.role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Access denied. Employees only.' });
        }
        
        if (testType !== 'Pre' && testType !== 'Post') {
            return res.status(400).json({ success: false, message: 'Invalid test type' });
        }
        
        // Verify user is a participant of this batch
        const [partRows] = await db.execute(
            "SELECT * FROM batch_participants WHERE batch_id = ? AND employee_id = ?",
            [batchId, employeeId]
        );
        if (partRows.length === 0) {
            return res.status(403).json({ success: false, message: 'Access denied. You are not a participant in this batch.' });
        }
        
        const participant = partRows[0];
        
        // Verify test is not already submitted
        if (testType === 'Pre' && participant.pre_test_score !== null) {
            return res.status(400).json({ success: false, message: 'You have already submitted this pre-test.' });
        }
        if (testType === 'Post' && participant.post_test_score !== null && participant.band_badge === 'PASSED') {
            return res.status(400).json({ success: false, message: 'You have already passed this post-test.' });
        }
        if (testType === 'Post' && !participant.attendance) {
            return res.status(400).json({ success: false, message: 'You cannot attend the post-training exam because you were marked absent.' });
        }
        
        // Fetch batch details and verify status
        const [batchRows] = await db.execute(
            `SELECT b.*, tm.module_name 
             FROM batches b
             INNER JOIN training_modules tm ON b.training_module_id = tm.id
             WHERE b.id = ?`,
            [batchId]
        );
        if (batchRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        
        const batchObj = batchRows[0];
        
        // Verify batch status is active for this test
        if (testType === 'Pre' && batchObj.status !== 'Pretest Active') {
            return res.status(400).json({ success: false, message: 'Pre-test is not currently active for this batch.' });
        }
        if (testType === 'Post' && batchObj.status !== 'Posttest Active') {
            return res.status(400).json({ success: false, message: 'Post-test is not currently active for this batch.' });
        }
        
        const questionPaperId = testType === 'Pre' ? batchObj.pre_test_question_paper_id : batchObj.post_test_question_paper_id;
        if (!questionPaperId) {
            return res.status(404).json({ success: false, message: 'Question paper not configured for this test' });
        }
        
        // Load question paper detailed questions
        const questionPaper = await getQuestionPaperById(questionPaperId);
        if (!questionPaper) {
            return res.status(404).json({ success: false, message: 'Question paper not found' });
        }
        
        // Filter out correct answers from the questions returned to frontend
        const questionsToSend = questionPaper.detailedQuestions.map(q => {
            let opts = [];
            try {
                opts = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
            } catch (err) {
                opts = q.options || [];
            }
            return {
                id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: opts
            };
        });
        
        return res.status(200).json({
            success: true,
            data: {
                batchId: parseInt(batchId, 10),
                testType,
                moduleName: batchObj.module_name,
                questionPaperName: questionPaper.name,
                questions: questionsToSend
            }
        });
    } catch (error) {
        console.error('Error getting test details:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const submitTestController = async (req, res) => {
    try {
        const { batchId, testType, answers } = req.body;
        const employeeId = req.user.id;

        if (req.user.role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Access denied. Employees only.' });
        }
        
        if (!batchId || !testType || !answers) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        
        if (testType !== 'Pre' && testType !== 'Post') {
            return res.status(400).json({ success: false, message: 'Invalid test type' });
        }
        
        // Verify user is participant
        const [partRows] = await db.execute(
            "SELECT * FROM batch_participants WHERE batch_id = ? AND employee_id = ?",
            [batchId, employeeId]
        );
        if (partRows.length === 0) {
            return res.status(403).json({ success: false, message: 'Access denied. You are not a participant in this batch.' });
        }
        
        const participant = partRows[0];
        
        // Verify not already submitted
        if (testType === 'Pre' && participant.pre_test_score !== null) {
            return res.status(400).json({ success: false, message: 'You have already submitted this pre-test.' });
        }
        if (testType === 'Post' && participant.post_test_score !== null && participant.band_badge === 'PASSED') {
            return res.status(400).json({ success: false, message: 'You have already passed this post-test.' });
        }
        if (testType === 'Post' && !participant.attendance) {
            return res.status(400).json({ success: false, message: 'You cannot submit the post-training exam because you were marked absent.' });
        }
        
        // Fetch batch details and verify status
        const [batchRows] = await db.execute(
            `SELECT b.*, tm.module_name, tm.passing_marks,
                    JSON_LENGTH(qp_pre.questions) AS pre_total_questions,
                    JSON_LENGTH(qp_post.questions) AS post_total_questions
             FROM batches b
             INNER JOIN training_modules tm ON b.training_module_id = tm.id
             LEFT JOIN question_papers qp_pre ON b.pre_test_question_paper_id = qp_pre.id
             LEFT JOIN question_papers qp_post ON b.post_test_question_paper_id = qp_post.id
             WHERE b.id = ?`,
            [batchId]
        );
        if (batchRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        
        const batchObj = batchRows[0];
        
        // Verify batch status is active for this test
        if (testType === 'Pre' && batchObj.status !== 'Pretest Active') {
            return res.status(400).json({ success: false, message: 'Pre-test is not currently active for this batch.' });
        }
        if (testType === 'Post' && batchObj.status !== 'Posttest Active') {
            return res.status(400).json({ success: false, message: 'Post-test is not currently active for this batch.' });
        }
        
        const questionPaperId = testType === 'Pre' ? batchObj.pre_test_question_paper_id : batchObj.post_test_question_paper_id;
        if (!questionPaperId) {
            return res.status(404).json({ success: false, message: 'Question paper not configured for this test' });
        }
        
        // Load question paper detailed questions
        const questionPaper = await getQuestionPaperById(questionPaperId);
        if (!questionPaper) {
            return res.status(404).json({ success: false, message: 'Question paper not found' });
        }
        
        let correctCount = 0;
        const detailedQuestions = questionPaper.detailedQuestions;
        
        for (const q of detailedQuestions) {
            const userAnswer = answers[q.id];
            if (userAnswer !== undefined && userAnswer !== null) {
                const cleanUserAnswer = String(userAnswer).trim().toLowerCase();
                const cleanCorrectAnswer = String(q.correct_answer).trim().toLowerCase();
                if (cleanUserAnswer === cleanCorrectAnswer) {
                    correctCount++;
                }
            }
        }
        
        // Save the score in the database
        let updateQuery = "";
        let finalScore = participant.final_score;
        let bandBadge = participant.band_badge;
        
        if (testType === 'Pre') {
            updateQuery = `
                UPDATE batch_participants 
                SET pre_test_score = ? 
                WHERE batch_id = ? AND employee_id = ?
            `;
            await db.execute(updateQuery, [correctCount, batchId, employeeId]);
        } else {
            // Post test is the final evaluation
            finalScore = correctCount;
            // Decide band badge based on passing marks percentage
            const totalQs = detailedQuestions.length || 1;
            const percentage = (correctCount / totalQs) * 100;
            const passed = percentage >= batchObj.passing_marks;
            bandBadge = passed ? 'PASSED' : 'FAILED';
            
            // Record attempt in post_test_attempts table
            const [countRows] = await db.execute(
                "SELECT COUNT(*) AS attempt_count FROM post_test_attempts WHERE batch_id = ? AND employee_id = ?",
                [batchId, employeeId]
            );
            const attemptNumber = countRows[0].attempt_count + 1;
            
            await db.execute(
                `INSERT INTO post_test_attempts (batch_id, employee_id, attempt_number, score, total_questions, passing_marks, percentage, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [batchId, employeeId, attemptNumber, correctCount, totalQs, batchObj.passing_marks, percentage, bandBadge]
            );
            
            updateQuery = `
                UPDATE batch_participants 
                SET post_test_score = ?, final_score = ?, band_badge = ?
                WHERE batch_id = ? AND employee_id = ?
            `;
            await db.execute(updateQuery, [correctCount, finalScore, bandBadge, batchId, employeeId]);
        }
        
        return res.status(200).json({
            success: true,
            message: 'Test submitted successfully',
            score: correctCount,
            totalQuestions: detailedQuestions.length
        });
    } catch (error) {
        console.error('Error submitting test:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getMyDashboardController = async (req, res) => {
    try {
        const employeeId = req.user.id;
        
        if (req.user.role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Access denied. Employees only.' });
        }

        const query = `
            SELECT 
                bp.id AS participant_table_id,
                bp.batch_id,
                bp.pre_test_score,
                bp.post_test_score,
                bp.attendance,
                bp.final_score,
                bp.band_badge,
                b.status AS batch_status,
                b.pre_test_question_paper_id,
                b.post_test_question_paper_id,
                JSON_LENGTH(qp_pre.questions) AS pre_total_questions,
                JSON_LENGTH(qp_post.questions) AS post_total_questions,
                b.scheduled_date,
                b.venue,
                tm.module_name,
                t.trainer_name,
                (SELECT COUNT(*) FROM post_test_attempts pta WHERE pta.batch_id = bp.batch_id AND pta.employee_id = bp.employee_id) AS post_test_attempts_count
            FROM batch_participants bp
            INNER JOIN batches b ON bp.batch_id = b.id
            INNER JOIN training_modules tm ON b.training_module_id = tm.id
            INNER JOIN trainers t ON b.trainer_id = t.id
            LEFT JOIN question_papers qp_pre ON b.pre_test_question_paper_id = qp_pre.id
            LEFT JOIN question_papers qp_post ON b.post_test_question_paper_id = qp_post.id
            WHERE bp.employee_id = ?
            ORDER BY b.scheduled_date DESC
        `;
        
        const [rows] = await db.execute(query, [employeeId]);
        
        let pendingTestsCount = 0;
        let completedCoursesCount = 0;
        let activeBatchesCount = 0;
        
        const activeTrainings = [];
        const trainingHistory = [];
        const activeTests = [];
        
        for (const row of rows) {
            const isPendingPreTest = row.batch_status === 'Pretest Active' && row.pre_test_question_paper_id && row.pre_test_score === null;
            const isPendingPostTest = row.batch_status === 'Posttest Active' && row.post_test_question_paper_id && (row.post_test_score === null || row.band_badge === 'FAILED') && row.attendance === 1;
            
            if (isPendingPreTest) {
                pendingTestsCount++;
                activeTests.push({
                    batchId: row.batch_id,
                    testType: 'Pre',
                    questionPaperId: row.pre_test_question_paper_id,
                    moduleName: row.module_name,
                    trainerName: row.trainer_name,
                    scheduledDate: row.scheduled_date,
                    venue: row.venue
                });
            }
            if (isPendingPostTest) {
                pendingTestsCount++;
                activeTests.push({
                    batchId: row.batch_id,
                    testType: 'Post',
                    questionPaperId: row.post_test_question_paper_id,
                    moduleName: row.module_name,
                    trainerName: row.trainer_name,
                    scheduledDate: row.scheduled_date,
                    venue: row.venue
                });
            }
            
            if (row.post_test_score !== null && row.band_badge === 'PASSED') {
                completedCoursesCount++;
            }
            
            if (row.batch_status !== 'Closed') {
                activeBatchesCount++;
                activeTrainings.push({
                    batchId: row.batch_id,
                    moduleName: row.module_name,
                    trainerName: row.trainer_name,
                    scheduledDate: row.scheduled_date,
                    venue: row.venue,
                    status: row.batch_status,
                    preTestScore: row.pre_test_score,
                    postTestScore: row.post_test_score,
                    preTotalQuestions: row.pre_total_questions,
                    postTotalQuestions: row.post_total_questions,
                    attendance: row.attendance,
                    bandBadge: row.band_badge,
                    postTestAttemptsCount: row.post_test_attempts_count || 0,
                    pendingTests: [
                        ...(isPendingPreTest ? [{ type: 'Pre', paperId: row.pre_test_question_paper_id }] : []),
                        ...(isPendingPostTest ? [{ type: 'Post', paperId: row.post_test_question_paper_id }] : [])
                    ]
                });
            } else {
                trainingHistory.push({
                    batchId: row.batch_id,
                    moduleName: row.module_name,
                    trainerName: row.trainer_name,
                    scheduledDate: row.scheduled_date,
                    venue: row.venue,
                    status: row.batch_status,
                    preTestScore: row.pre_test_score,
                    postTestScore: row.post_test_score,
                    preTotalQuestions: row.pre_total_questions,
                    postTotalQuestions: row.post_total_questions,
                    attendance: row.attendance,
                    finalScore: row.final_score,
                    bandBadge: row.band_badge,
                    postTestAttemptsCount: row.post_test_attempts_count || 0
                });
            }
        }
        
        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    pendingTestsCount,
                    completedCoursesCount,
                    activeBatchesCount
                },
                activeTrainings,
                trainingHistory,
                activeTests
            }
        });
    } catch (error) {
        console.error('Error getting employee dashboard data:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const changePasswordController = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        if (req.user.role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Access denied. Employees only.' });
        }

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Old password and new password are required' });
        }

        // Fetch employee
        const [rows] = await db.execute("SELECT password FROM employees WHERE id = ?", [employeeId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const employee = rows[0];

        // Compare old password
        const isMatch = await bcrypt.compare(oldPassword, employee.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid current password' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and set is_first_login to 0
        await db.execute(
            "UPDATE employees SET password = ?, is_first_login = 0 WHERE id = ?",
            [hashedPassword, employeeId]
        );

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getMyTestsController,
    getTestDetailsController,
    submitTestController,
    getMyDashboardController,
    changePasswordController
};
