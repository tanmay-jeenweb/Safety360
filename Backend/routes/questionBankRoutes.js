const express = require('express');
const router = express.Router();

const {
    addQuestionController,
    getAllQuestionsController,
    getQuestionByIdController,
    updateQuestionController,
    deleteQuestionController,
    getQuestionsByModuleController,
    bulkAddQuestionsController
} = require('../controllers/questionBankController.js');

const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

router.post('/add', verifyToken, verifyPermission('question_bank', 'write'), addQuestionController);
router.post('/bulk-add', verifyToken, verifyPermission('question_bank', 'write'), bulkAddQuestionsController);
router.get('/all', verifyToken, verifyPermission('question_bank', 'read'), getAllQuestionsController);
router.get('/module/:moduleId', verifyToken, verifyPermission('question_bank', 'read'), getQuestionsByModuleController);
router.get('/:id', verifyToken, verifyPermission('question_bank', 'read'), getQuestionByIdController);
router.put('/update/:id', verifyToken, verifyPermission('question_bank', 'update'), updateQuestionController);
router.delete('/delete/:id', verifyToken, verifyPermission('question_bank', 'delete'), deleteQuestionController);

module.exports = router;

