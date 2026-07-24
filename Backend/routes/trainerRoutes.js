const express = require('express');
const {
    addTrainer,
    getAllTrainersController,
    updateTrainerController,
    deleteTrainerController
} = require('../controllers/trainerController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('trainer_master', 'write'), addTrainer);
router.get('/all', verifyToken, verifyPermission('trainer_master', 'read'), getAllTrainersController);
router.put('/update/:id', verifyToken, verifyPermission('trainer_master', 'update'), updateTrainerController);
router.delete('/delete/:id', verifyToken, verifyPermission('trainer_master', 'delete'), deleteTrainerController);

module.exports = router;
