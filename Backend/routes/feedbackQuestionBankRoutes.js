const express = require('express');
const router = express.Router();

const {
    addFeedbackQuestionController,
    getAllFeedbackQuestionsController,
    getFeedbackQuestionByIdController,
    updateFeedbackQuestionController,
    deleteFeedbackQuestionController
} = require('../controllers/feedbackQuestionBankController.js');

const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

router.post('/add', verifyToken, verifyPermission('feedback_question_bank', 'write'), addFeedbackQuestionController);
router.get('/all', verifyToken, verifyPermission('feedback_question_bank', 'read'), getAllFeedbackQuestionsController);
router.get('/:id', verifyToken, verifyPermission('feedback_question_bank', 'read'), getFeedbackQuestionByIdController);
router.put('/update/:id', verifyToken, verifyPermission('feedback_question_bank', 'update'), updateFeedbackQuestionController);
router.delete('/delete/:id', verifyToken, verifyPermission('feedback_question_bank', 'delete'), deleteFeedbackQuestionController);

module.exports = router;
