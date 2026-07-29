const express = require('express');
const router = express.Router();

const {
    addFeedbackPaperController,
    getAllFeedbackPapersController,
    getFeedbackPaperByIdController,
    updateFeedbackPaperController,
    deleteFeedbackPaperController
} = require('../controllers/feedbackPaperController.js');

const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

router.post('/add', verifyToken, verifyPermission('feedback_papers', 'write'), addFeedbackPaperController);
router.get('/all', verifyToken, verifyPermission('feedback_papers', 'read'), getAllFeedbackPapersController);
router.get('/:id', verifyToken, verifyPermission('feedback_papers', 'read'), getFeedbackPaperByIdController);
router.put('/update/:id', verifyToken, verifyPermission('feedback_papers', 'update'), updateFeedbackPaperController);
router.delete('/delete/:id', verifyToken, verifyPermission('feedback_papers', 'delete'), deleteFeedbackPaperController);

module.exports = router;
