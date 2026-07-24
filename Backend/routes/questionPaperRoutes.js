const express = require('express');
const router = express.Router();

const {
    addQuestionPaperController,
    getAllQuestionPapersController,
    getQuestionPaperByIdController,
    updateQuestionPaperController,
    deleteQuestionPaperController
} = require('../controllers/questionPaperController.js');

const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

router.post('/add', verifyToken, verifyPermission('question_paper', 'write'), addQuestionPaperController);
router.get('/all', verifyToken, verifyPermission('question_paper', 'read'), getAllQuestionPapersController);
router.get('/:id', verifyToken, verifyPermission('question_paper', 'read'), getQuestionPaperByIdController);
router.put('/update/:id', verifyToken, verifyPermission('question_paper', 'update'), updateQuestionPaperController);
router.delete('/delete/:id', verifyToken, verifyPermission('question_paper', 'delete'), deleteQuestionPaperController);

module.exports = router;
