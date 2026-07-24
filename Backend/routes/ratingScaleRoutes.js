const express = require('express');
const {
    addRatingScale,
    getAllRatingScalesController,
    updateRatingScaleController,
    deleteRatingScaleController
} = require('../controllers/ratingScaleController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('rating_scale_master', 'write'), addRatingScale);
router.get('/all', verifyToken, verifyPermission('rating_scale_master', 'read'), getAllRatingScalesController);
router.put('/update/:id', verifyToken, verifyPermission('rating_scale_master', 'update'), updateRatingScaleController);
router.delete('/delete/:id', verifyToken, verifyPermission('rating_scale_master', 'delete'), deleteRatingScaleController);

module.exports = router;
