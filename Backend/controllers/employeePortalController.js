const db = require('../config/db.js');
const { getQuestionPaperById } = require('../models/questionPaperModel.js');

const getMyTestsController = async (req, res) => {
    try {
        const employeeId = req.user.id;
        
        if (req.user.role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Access denied. Employees only.' });
        }

        // Query to find batches where this employee is a participant and the test is active
        const query = `
            SELECT 
                bp.id AS participant_table_id,
                bp.batch_id,
                bp.pre_test_score,
                bp.post_test_score,
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
            // Post-Test is active: status is 'Posttest Active', paper is configured, and score is null (not taken yet)
            if (row.batch_status === 'Posttest Active' && row.post_test_question_paper_id && row.post_test_score === null) {
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
        if (testType === 'Post' && participant.post_test_score !== null) {
            return res.status(400).json({ success: false, message: 'You have already submitted this post-test.' });
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
        if (testType === 'Post' && participant.post_test_score !== null) {
            return res.status(400).json({ success: false, message: 'You have already submitted this post-test.' });
        }
        
        // Fetch batch details and verify status
        const [batchRows] = await db.execute(
            `SELECT b.*, tm.module_name, tm.passing_marks 
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
            // Decide band badge based on passing marks
            const passed = correctCount >= batchObj.passing_marks;
            bandBadge = passed ? 'PASSED' : 'FAILED';
            
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

module.exports = {
    getMyTestsController,
    getTestDetailsController,
    submitTestController
};
